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
    // L'origine ne change que depuis l'Accueil / le Profil (elle est retenue) ou depuis la liste du Menu (aucune).
    // Depuis une autre page du Menu (ex. une ligne de la liste des événements ouverte depuis l'Accueil), elle est
    // conservée : le retour de la liste doit toujours ramener à l'Accueil.
    if (depuisAutreOnglet) definir(chemin);
    else if (chemin === '/menu') definir(null);
    // La liste du Menu est toujours la page du dessous : appuyer sur « Menu » y ramène, quelle que soit la page ouverte.
    if (depuisAutreOnglet) router.navigate('/menu');
    router.push(href);
  };
}
