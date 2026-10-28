import { create } from 'zustand';

import type { Compte } from '@/types';
import { loadItem, saveItem } from '@/utils/secureStorage';

const KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'user',
} as const;

interface AuthState {
  /** Vrai quand le stockage sécurisé a été relu au démarrage. */
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: Compte | null;

  hydrate: () => Promise<void>;
  signIn: (access: string, refresh: string, user: Compte) => Promise<void>;
  setTokens: (access: string, refresh?: string) => Promise<void>;
  setUser: (user: Compte) => Promise<void>;
  signOut: () => Promise<void>;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  async hydrate() {
    // Ancien écran « choix de l'incubateur » supprimé : on efface le choix qu'il avait enregistré,
    // sinon il serait encore envoyé au serveur et bloquerait la connexion d'un compte d'un autre incubateur.
    void saveItem('tenant', null);
    const [access, refresh, user] = await Promise.all([
      loadItem(KEYS.access),
      loadItem(KEYS.refresh),
      loadItem(KEYS.user),
    ]);
    set({
      accessToken: access,
      refreshToken: refresh,
      user: parseJson<Compte>(user),
      hydrated: true,
    });
  },

  async signIn(access, refresh, user) {
    set({ accessToken: access, refreshToken: refresh, user });
    await Promise.all([
      saveItem(KEYS.access, access),
      saveItem(KEYS.refresh, refresh),
      saveItem(KEYS.user, JSON.stringify(user)),
    ]);
  },

  async setTokens(access, refresh) {
    set(refresh ? { accessToken: access, refreshToken: refresh } : { accessToken: access });
    await saveItem(KEYS.access, access);
    if (refresh) await saveItem(KEYS.refresh, refresh);
  },

  async setUser(user) {
    set({ user });
    await saveItem(KEYS.user, JSON.stringify(user));
  },

  async signOut() {
    set({ accessToken: null, refreshToken: null, user: null });
    await Promise.all([
      saveItem(KEYS.access, null),
      saveItem(KEYS.refresh, null),
      saveItem(KEYS.user, null),
    ]);
  },
}));
