import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '@/config';
import { useAuthStore } from '@/store/auth';

/** Client HTTP unique : ajoute le jeton JWT et l'incubateur à chaque appel. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const { accessToken, tenant } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // Le backend identifie l'incubateur par ce header (middleware TenantMiddleware).
  if (tenant?.slug) config.headers['X-Tenant-Slug'] = tenant.slug;
  return config;
});

// Une seule demande de renouvellement à la fois, même si plusieurs appels échouent ensemble.
let refreshing: Promise<string | null> | null = null;

async function renewAccessToken(): Promise<string | null> {
  const { refreshToken, tenant, setTokens } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    // Appel "nu" (sans nos intercepteurs) pour éviter une boucle infinie.
    const { data } = await axios.post<{ access: string; refresh?: string }>(
      `${API_URL}/mobile/auth/refresh/`,
      { refresh: refreshToken },
      { headers: tenant?.slug ? { 'X-Tenant-Slug': tenant.slug } : undefined, timeout: 20000 },
    );
    await setTokens(data.access, data.refresh);
    return data.access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing ??= renewAccessToken().finally(() => {
        refreshing = null;
      });
      const newAccess = await refreshing;

      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      // Renouvellement impossible : la session est terminée, retour à l'écran de connexion.
      await useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  },
);

/** Transforme une erreur réseau/DRF en message lisible en français. */
export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Une erreur inattendue est survenue.';

  if (!error.response) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion et l\'adresse du backend.';
  }

  const { status, data } = error.response;
  if (status === 429) return 'Trop de tentatives. Réessayez dans quelques instants.';
  if (status >= 500) return 'Erreur du serveur. Réessayez plus tard.';

  if (typeof data === 'string') return 'Requête refusée par le serveur.';
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    // API mobile : { success: false, errors: ["message", ...] }
    if (Array.isArray(body.errors) && body.errors.length) return body.errors.map(String).join('\n');
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.error === 'string') return body.error;
    if (typeof body.message === 'string') return body.message;

    // Erreurs de validation DRF : { champ: ["message", ...] }
    const lignes: string[] = [];
    for (const [champ, valeur] of Object.entries(body)) {
      const texte = Array.isArray(valeur) ? valeur.join(' ') : String(valeur);
      lignes.push(champ === 'non_field_errors' ? texte : `${champ} : ${texte}`);
    }
    if (lignes.length) return lignes.join('\n');
  }
  return 'Requête refusée par le serveur.';
}

/** Les listes DRF sont soit un tableau, soit { results: [...] } si la pagination est activée. */
export function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}
