import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useRetourAndroid } from '@/hooks/useReculer';
import { estPremierePage, type Navigation, reculer } from '@/navigation/retour';
import { useColors } from '@/theme';

/** Flèche de retour de l'en-tête : la fonction de retour de l'application, branchée aussi sur le bouton Android. */
function BoutonRetour({ navigation, routeKey }: { navigation: Navigation; routeKey: string }) {
  const colors = useColors();
  useRetourAndroid(navigation, routeKey, '/menu');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12} onPress={() => reculer(navigation, routeKey)}
      style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
      <FontAwesome5 name="chevron-left" size={18} color={colors.primary} />
    </Pressable>
  );
}

/**
 * En-têtes des écrans empilés : fond de page, petit titre, flèche de retour violette (qui ramène à la page
 * visitée juste avant, voir `navigation/retour.ts`), bouton clair / sombre à droite.
 */
export function useStackOptions() {
  const colors = useColors();
  return ({ navigation, route }: { navigation: Navigation; route: { key?: string } }) => ({
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.textMuted, fontSize: 15, fontWeight: '600' as const },
    headerShadowVisible: false,
    headerLeft: () => <BoutonRetour navigation={navigation} routeKey={route.key ?? ''} />,
    headerRight: () => <ThemeToggle />,
    // Le geste de retour d'iOS passerait par la liste du Menu : la première page ne se ferme que par la flèche.
    gestureEnabled: !estPremierePage(navigation, route.key ?? ''),
    contentStyle: { backgroundColor: colors.background },
  });
}
