import { type Href, useNavigation, useRoute } from 'expo-router';
import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

import { type Navigation, reculer, type Route } from '@/navigation/retour';

/**
 * Bouton retour d'Android pour la page affichée : même fonction que la flèche (voir `navigation/retour.ts`).
 * Les écouteurs sont appelés du dernier au premier ; seule la page affichée répond.
 */
export function useRetourAndroid(
  navigation: Navigation,
  route: Route,
  secours: Href,
  actif = true,
  avant?: () => boolean,
) {
  // Toujours la dernière version du rappel, sans réabonner l'écouteur à chaque rendu.
  const avantRef = useRef(avant);
  useEffect(() => {
    avantRef.current = avant;
  }, [avant]);
  useEffect(() => {
    if (!actif) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false;
      if (avantRef.current?.()) return true;
      reculer(navigation, route, secours);
      return true;
    });
    return () => abonnement.remove();
  }, [navigation, route, secours, actif]);
}

/**
 * Bouton retour d'Android quand le Menu latéral est ouvert : il le ferme au lieu de quitter la page. L'écouteur n'existe
 * que tant que le tiroir est ouvert, il est donc appelé avant celui de la page.
 */
export function useRetourMenuLateral(ouvert: boolean, fermer: () => void) {
  useEffect(() => {
    if (!ouvert) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      fermer();
      return true;
    });
    return () => abonnement.remove();
  }, [ouvert, fermer]);
}

/**
 * Le retour en arrière de toute page, quel que soit l'espace : flèche, retour programmatique (après un
 * enregistrement, une suppression), lien « retour ». À utiliser à la place de `router.back()`.
 *
 * - `secours` : où aller hors du Menu quand il n'y a aucune page précédente (lien direct, actualisation).
 * - `avant` : rappel appelé d'abord ; s'il renvoie `true`, le retour est déjà pris en charge (ex. étape précédente
 *   d'un formulaire en plusieurs étapes) et la page n'est pas quittée.
 * - `android` : branche aussi le bouton retour d'Android sur cette page (inutile dans le Menu, où la flèche de
 *   l'en-tête le fait déjà).
 */
export function useReculer({
  secours = '/menu',
  android = false,
  avant,
}: { secours?: Href; android?: boolean; avant?: () => boolean } = {}) {
  const navigation = useNavigation() as unknown as Navigation;
  const route = useRoute();
  useRetourAndroid(navigation, route, secours, android, avant);
  return () => {
    if (avant?.()) return;
    reculer(navigation, route, secours);
  };
}
