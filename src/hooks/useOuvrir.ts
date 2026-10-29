import { type Href, router, usePathname } from 'expo-router';

import { useRetour } from '@/store/retour';

/**
 * Ouvre une page en retenant d'où l'on vient : depuis l'Accueil ou le Profil, le retour y ramène ; depuis une
 * page du Menu, le retour ramène à la page précédente de la pile. À utiliser à la place de `router.push`
 * dans les composants affichés dans plusieurs onglets.
 */
export function useOuvrir() {
  const chemin = usePathname();
  const definir = useRetour((s) => s.definir);
  return (href: Href) => {
    const depuisAutreOnglet = chemin === '/' || chemin === '/profil';
    definir(depuisAutreOnglet ? chemin : null);
    // La liste du Menu est toujours la page du dessous : appuyer sur « Menu » y ramène, quelle que soit la page ouverte.
    if (depuisAutreOnglet) router.navigate('/menu');
    router.push(href);
  };
}
