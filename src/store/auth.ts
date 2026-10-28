import { create } from 'zustand';

import type { Compte, Tenant } from '@/types';
import { loadItem, saveItem } from '@/utils/secureStorage';

const KEYS = {
  tenant: 'tenant',
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'user',
} as const;

interface AuthState {
  /** Vrai quand le stockage sécurisé a été relu au démarrage. */
  hydrated: boolean;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: Compte | null;

  hydrate: () => Promise<void>;
  setTenant: (tenant: Tenant) => Promise<void>;
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
  tenant: null,
  accessToken: null,
  refreshToken: null,
  user: null,

  async hydrate() {
    const [tenant, access, refresh, user] = await Promise.all([
      loadItem(KEYS.tenant),
      loadItem(KEYS.access),
      loadItem(KEYS.refresh),
      loadItem(KEYS.user),
    ]);
    set({
      tenant: parseJson<Tenant>(tenant),
      accessToken: access,
      refreshToken: refresh,
      user: parseJson<Compte>(user),
      hydrated: true,
    });
  },

  async setTenant(tenant) {
    set({ tenant });
    await saveItem(KEYS.tenant, JSON.stringify(tenant));
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
    // On garde l'incubateur choisi : l'utilisateur se reconnectera au même endroit.
    set({ accessToken: null, refreshToken: null, user: null });
    await Promise.all([
      saveItem(KEYS.access, null),
      saveItem(KEYS.refresh, null),
      saveItem(KEYS.user, null),
    ]);
  },
}));
