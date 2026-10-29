import { ThemeToggle } from '@/components/ThemeToggle';
import { useColors } from '@/theme';

/** En-têtes des écrans empilés : fond de carte, titre, flèche violette, bouton clair / sombre à droite. */
export function useStackOptions() {
  const colors = useColors();
  return {
    headerTintColor: colors.primary,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.textMuted, fontSize: 15, fontWeight: '600' as const },
    headerShadowVisible: false,
    headerRight: () => <ThemeToggle />,
    contentStyle: { backgroundColor: colors.background },
  };
}
