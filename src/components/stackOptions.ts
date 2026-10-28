import { colors } from '@/theme';

/** En-têtes des écrans empilés : fond blanc, titre sombre, flèche violette (comme la topbar du site). */
export const stackOptions = {
  headerTintColor: colors.primary,
  headerBackTitle: 'Retour',
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};
