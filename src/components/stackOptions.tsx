import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BackHandler, Pressable } from 'react-native';

import { ThemeToggle } from '@/components/ThemeToggle';
import { estPremierePage, type PileNavigation, reculer, useRetour } from '@/store/retour';
import { useColors } from '@/theme';

/** Flèche de retour de l'en-tête ; gère aussi le bouton retour d'Android pour la page affichée. */
function BoutonRetour({ navigation, routeKey }: { navigation: PileNavigation; routeKey: string }) {
  const colors = useColors();
  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      // Seulement à la première page ouverte depuis un autre onglet ; ailleurs, le retour normal convient.
      if (!navigation.isFocused() || !useRetour.getState().origine || !estPremierePage(navigation, routeKey)) return false;
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
 * d'où l'on vient, voir `store/retour.ts`), bouton clair / sombre à droite.
 */
export function useStackOptions() {
  const colors = useColors();
  return ({ navigation, route }: { navigation: PileNavigation; route: { key?: string } }) => ({
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.textMuted, fontSize: 15, fontWeight: '600' as const },
    headerShadowVisible: false,
    headerLeft: () => <BoutonRetour navigation={navigation} routeKey={route.key ?? ''} />,
    headerRight: () => <ThemeToggle />,
    contentStyle: { backgroundColor: colors.background },
  });
}
