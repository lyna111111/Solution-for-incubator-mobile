import { type Href, router, usePathname, useRoute } from 'expo-router';
import { useRef } from 'react';

import { avecOrigine, origineDe } from '@/navigation/retour';

/**
 * Ouvre une page. Depuis l'Accueil ou le Profil, l'adresse de la page porte l'onglet d'origine (paramètre `retour`)
 * pour que son retour y ramène (voir `navigation/retour.ts`) ; rien n'est mémorisé ailleurs.
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
    router.push(avecOrigine(href, chemin));
  };
}

/**
 * Passe à un onglet de la barre du bas (Accueil, Menu, Profil) sans empiler de page : à utiliser pour un lien
 * vers un onglet, comme le bandeau « Bienvenue » qui ouvre le Profil.
 */
export function useAllerOnglet() {
  return (href: Href) => router.navigate(href);
}

/**
 * Remplace la page affichée (ex. formulaire de création -> fiche créée) : le formulaire quitte l'historique, et la
 * nouvelle page garde l'onglet d'origine du formulaire (Accueil, Profil) pour que son retour y ramène aussi.
 */
export function useRemplacer() {
  const origine = origineDe(useRoute());
  return (href: Href) => router.replace(origine ? avecOrigine(href, origine) : href);
}

/** Change les paramètres de la page affichée (filtres imposés d'une liste) sans ajouter d'entrée à l'historique. */
export function useParametres() {
  return (params: Record<string, string>) => router.setParams(params);
}
