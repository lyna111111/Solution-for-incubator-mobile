import { api } from '@/api/client';

import type { Fichier } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON décrites par les écrans */

/** Espace de l'API : /api/mobile/admin/... (administrateur) ou /api/mobile/superadmin/... (Super Admin). */
export type BaseApi = 'admin' | 'superadmin';

/** Lecture sous /api/mobile/<base>/... */
export async function adminGet<T = any>(
  chemin: string,
  params?: Record<string, unknown>,
  base: BaseApi = 'admin',
): Promise<T> {
  const { data } = await api.get<T>(`/mobile/${base}/${chemin}`, { params });
  return data;
}

/**
 * Écriture sous /api/mobile/<base>/... : JSON, ou multipart dès qu'il y a des fichiers
 * (le serveur valide taille, extension et contenu des fichiers avant toute écriture).
 */
export async function adminEnvoyer<T = any>(
  methode: 'post' | 'put' | 'delete',
  chemin: string,
  corps: Record<string, unknown> = {},
  fichiers: Fichier[] = [],
  base: BaseApi = 'admin',
): Promise<T> {
  const url = `/mobile/${base}/${chemin}`;
  if (fichiers.length === 0) {
    const { data } = await api.request<T>({ url, method: methode, data: methode === 'delete' ? undefined : corps });
    return data;
  }
  const form = new FormData();
  for (const [cle, valeur] of Object.entries(corps)) {
    if (valeur === undefined || valeur === null) continue;
    if (Array.isArray(valeur)) valeur.forEach((v) => form.append(cle, String(v)));
    else form.append(cle, String(valeur));
  }
  for (const f of fichiers) {
    form.append(f.champ, { uri: f.uri, name: f.name, type: f.mimeType ?? 'application/octet-stream' } as unknown as Blob);
  }
  const { data } = await api.request<T>({
    url,
    method: methode,
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}
