import { ThemeToggle } from '@/components/ThemeToggle';
import { useColors } from '@/theme';

/** En-têtes des écrans empilés : fond de carte, titre, flèche violette, bouton clair / sombre à droite. */
export function useStackOptions() {
  const colors = useColors();
  return {
    headerTintColor: colors.primary,
    headerBackTitle: 'Retour',
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
    headerShadowVisible: false,
    headerRight: () => <ThemeToggle />,
    contentStyle: { backgroundColor: colors.background },
  };
}
