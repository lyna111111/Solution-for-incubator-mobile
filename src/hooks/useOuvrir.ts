import { type Href, router, usePathname } from 'expo-router';
import { useRef } from 'react';

/**
 * Ouvre une page : l'historique est tenu par le routeur (voir `navigation/retour.ts`), rien n'est mémorisé ici.
 * À utiliser pour toute ouverture de page. Un double appui sur un lien n'ajoute qu'une seule entrée à
 * l'historique (même lien rappuyé aussitôt, ou lien vers la page déjà affichée).
 */
export function useOuvrir() {
  const chemin = usePathname();
  const dernier = useRef({ cle: '', quand: 0 });
  return (href: Href) => {
    const cle = typeof href === 'string' ? href : JSON.stringify(href);
    const maintenant = Date.now();
    if (cle === dernier.current.cle && maintenant - dernier.current.quand < 600) return;
    if (typeof href === 'string' && href === chemin) return;
    dernier.current = { cle, quand: maintenant };
    router.push(href);
  };
}

/** Remplace la page affichée (ex. formulaire de création -> fiche créée) : le formulaire quitte l'historique. */
export function useRemplacer() {
  return (href: Href) => router.replace(href);
}

/** Change les paramètres de la page affichée (filtres imposés d'une liste) sans ajouter d'entrée à l'historique. */
export function useParametres() {
  return (params: Record<string, string>) => router.setParams(params);
}
