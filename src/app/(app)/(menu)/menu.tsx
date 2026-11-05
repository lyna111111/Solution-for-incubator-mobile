import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useAllerOnglet } from '@/hooks/useOuvrir';

/**
 * Racine de la pile des pages du Menu (le Menu lui-même est le tiroir de `MenuLateral`, qui n'est pas une page).
 * Cette page ne s'affiche jamais : quand le retour d'une page y arrive, elle ramène à l'Accueil.
 */
export default function Menu() {
  const allerOnglet = useAllerOnglet();
  useFocusEffect(
    useCallback(() => {
      allerOnglet('/');
    }, [allerOnglet]),
  );
  return null;
}
