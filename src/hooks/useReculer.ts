import { type Href, useNavigation, useRoute } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { type Navigation, reculer, type Route } from '@/navigation/retour';

/**
 * Bouton retour d'Android pour la page affichée : même fonction que la flèche (voir `navigation/retour.ts`).
 * Les écouteurs sont appelés du dernier au premier ; seule la page affichée répond.
 */
export function useRetourAndroid(navigation: Navigation, route: Route, secours: Href, actif = true) {
  useEffect(() => {
    if (!actif) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false;
      reculer(navigation, route, secours);
      return true;
    });
    return () => abonnement.remove();
  }, [navigation, route, secours, actif]);
}

/**
 * Le retour en arrière de toute page, quel que soit l'espace : flèche, retour programmatique (après un
 * enregistrement, une suppression), lien « retour ». À utiliser à la place de `router.back()`.
 *
 * - `secours` : où aller hors du Menu quand il n'y a aucune page précédente (lien direct, actualisation).
 * - `android` : branche aussi le bouton retour d'Android sur cette page (inutile dans le Menu, où la flèche de
 *   l'en-tête le fait déjà).
 */
export function useReculer({ secours = '/menu', android = false }: { secours?: Href; android?: boolean } = {}) {
  const navigation = useNavigation() as unknown as Navigation;
  const route = useRoute();
  useRetourAndroid(navigation, route, secours, android);
  return () => reculer(navigation, route, secours);
}
