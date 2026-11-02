import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BackHandler, Pressable } from 'react-native';

import { ThemeToggle } from '@/components/ThemeToggle';
import { estPremierePage, type PileMenu, reculer } from '@/navigation/retour';
import { useColors } from '@/theme';

type Navigation = PileMenu & { isFocused: () => boolean };

/** Flèche de retour de l'en-tête ; gère aussi le bouton retour d'Android pour la page affichée. */
function BoutonRetour({ navigation, routeKey }: { navigation: Navigation; routeKey: string }) {
  const colors = useColors();
  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false;
      reculer(navigation, routeKey);
      return true;
    });
    return () => abonnement.remove();
  }, [navigation, routeKey]);

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
