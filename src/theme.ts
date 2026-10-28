// Charte graphique reprise du site web (static/css/dashboard.css, theme.css, utilisateurs.css).

export const colors = {
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
  dangerSoft: '#fee2e2',
  success: '#10b981',
  successSoft: '#d1fae5',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
  unread: '#facc15', // pastille jaune des notifications non lues
  navy: '#0e0e2c', // fond du logo
};

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
