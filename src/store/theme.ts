import { Appearance } from 'react-native';
import { create } from 'zustand';

import { loadItem, saveItem } from '@/utils/secureStorage';

export type ThemeMode = 'light' | 'dark';

const CLE = 'theme';

interface ThemeState {
  mode: ThemeMode;
  /** Vrai quand le choix enregistré a été relu au démarrage (évite un flash du mauvais thème). */
  pret: boolean;
  hydrate: () => Promise<void>;
  basculer: () => Promise<void>;
}

/** Choix clair / sombre de l'utilisateur, enregistré sur le téléphone ; à défaut, le thème du téléphone. */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  pret: false,

  async hydrate() {
    const enregistre = await loadItem(CLE);
    set(enregistre === 'dark' || enregistre === 'light' ? { mode: enregistre, pret: true } : { pret: true });
  },

  async basculer() {
    const mode: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode });
    await saveItem(CLE, mode);
  },
}));
