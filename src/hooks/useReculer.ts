import { useNavigation, useRoute } from 'expo-router';

import { type PileMenu, reculer } from '@/navigation/retour';

/**
 * Retour programmatique d'une page du Menu (après un enregistrement, une suppression...) : même règle que la
 * flèche de l'en-tête, donc la page réellement visitée avant (voir `navigation/retour.ts`).
 * À utiliser à la place de `router.back()`.
 */
export function useReculer() {
  const navigation = useNavigation() as unknown as PileMenu;
  const route = useRoute();
  return () => reculer(navigation, route.key);
}
