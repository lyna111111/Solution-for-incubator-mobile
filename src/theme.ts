// Charte graphique reprise du site web (static/css/dashboard.css, theme.css, utilisateurs.css).

import { type ThemeMode, useThemeStore } from '@/store/theme';

const clair = {
  primary: '#8a3ffc', // violet du site
  primaryDark: '#6d28d9',
  primarySoft: '#f1e8ff',
  secondary: '#00c2ff', // cyan du site
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e5e7eb',
  danger: '#ef4444',
  dangerText: '#b91c1c', // texte sur dangerSoft
  dangerSoft: '#fee2e2',
  success: '#10b981',
  successText: '#047857', // texte sur successSoft
  successSoft: '#d1fae5',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
  unread: '#facc15', // pastille jaune des notifications non lues
  navy: '#0e0e2c', // fond du logo
  input: '#f8fafc', // fond des champs de saisie
  authFond: ['#efe5ff', '#f8fafc', '#e6f8ff'] as readonly [string, string, string], // fond des pages de connexion
};

export type Palette = typeof clair;

/** Thème sombre du site (static/css/theme.css, classe .dark) : fond quasi noir bleuté, cartes un cran au-dessus. */
const sombre: Palette = {
  primary: '#8a3ffc',
  primaryDark: '#c4b5fd', // sert de texte sur les pastilles violettes : doit être clair sur fond sombre
  primarySoft: '#2a1a4d',
  secondary: '#00c2ff',
  background: '#030712',
  card: '#0f172a',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  border: '#1f2937',
  danger: '#f87171',
  dangerText: '#fca5a5',
  dangerSoft: '#4c1d1d',
  success: '#34d399',
  successText: '#6ee7b7',
  successSoft: '#064e3b',
  warning: '#fbbf24',
  warningSoft: '#451a03',
  info: '#38bdf8',
  infoSoft: '#0c4a6e',
  unread: '#facc15',
  navy: '#0e0e2c',
  input: '#0b1220',
  authFond: ['#1a0b3d', '#030712', '#04202e'],
};

export const palettes: Record<ThemeMode, Palette> = { light: clair, dark: sombre };

/** Couleurs du thème courant : le composant se met à jour dès qu'on bascule clair / sombre. */
export function useColors(): Palette {
  return palettes[useThemeStore((s) => s.mode)];
}

const caches = new Map<unknown, Partial<Record<ThemeMode, unknown>>>();

/**
 * Styles dépendant du thème : `const createStyles = (colors: Palette) => StyleSheet.create({...})` au niveau
 * du module, puis `const styles = useStyles(createStyles)` dans le composant. Un jeu de styles est calculé
 * une seule fois par thème.
 */
export function useStyles<T>(creer: (colors: Palette) => T): T {
  const mode = useThemeStore((s) => s.mode);
  const entree = caches.get(creer) ?? {};
  caches.set(creer, entree);
  entree[mode] ??= creer(palettes[mode]);
  return entree[mode] as T;
}

/** Dégradé violet -> cyan utilisé par le site (barre de progression, titres). */
export const gradient = {
  brand: ['#8a3ffc', '#00c2ff'] as const,
  button: ['#8a3ffc', '#a066ff'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Le site utilise 10 px pour les cartes, 8 px pour les boutons, 24 px pour la carte de connexion.
export const radius = { sm: 8, md: 10, lg: 14, xl: 24, pill: 999 };

export const shadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
