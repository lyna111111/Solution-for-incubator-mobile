/**
 * Retour en arrière : une seule règle pour toute l'application (tous les rôles, tous les espaces).
 *
 * Dans le Menu, le retour va toujours vers une route précise, jamais « en arrière » dans un historique :
 *
 *   page ouverte depuis l'Accueil ou le Profil  ->  cet onglet (route `/` ou `/profil`, portée par le paramètre
 *                                                   `retour` que `useOuvrir` ajoute à l'adresse de la page)
 *   détail, formulaire de création              ->  sa liste          (ex. /requetes/7, /requetes/nouvelle  ->  /requetes)
 *   liste, page de gestion                      ->  la liste du Menu  (ex. /requetes, /gestion/statistiques  ->  /menu)
 *
 * L'origine voyage dans l'adresse de la page : elle ne peut donc jamais devenir périmée (pas d'état global).
 *
 * Dans l'espace de connexion (Bienvenue, Connexion, Inscription...), il n'y a pas de hiérarchie : retour = page
 * précédente de la pile, ou `secours` sans page précédente (lien direct, actualisation).
 *
 * `reculer` est l'unique fonction de retour. Les écrans ne l'appellent jamais directement : ils passent par
 * `hooks/useReculer.ts` (flèche, bouton Android, retours après enregistrement ou suppression, liens « retour »).
 * Ouverture, remplacement d'une page : `hooks/useOuvrir.ts`. Remise à zéro de la pile en quittant l'onglet Menu :
 * `popToTopOnBlur` dans `app/(app)/_layout.tsx`.
 */
import { type Href, router } from 'expo-router';

export interface Route {
  name: string;
  params?: object;
}

export interface Navigation {
  getState: () => { routes: Route[] };
  goBack: () => void;
  canGoBack: () => boolean;
  isFocused: () => boolean;
}

/** Nom de l'écran « liste du Menu » : toujours le premier de la pile du Menu. */
const LISTE_MENU = 'menu';

/** Nom du paramètre d'adresse qui porte l'onglet d'où la page a été ouverte. */
export const PARAM_RETOUR = 'retour';

/** Onglets (hors Menu) depuis lesquels on ouvre des pages du Menu, et vers lesquels celles-ci reviennent. */
const ORIGINES = ['/', '/profil'];

/** Dossiers de pages qui regroupent des modules sans avoir de liste à eux (il n'y a pas de page `/gestion`). */
const SANS_LISTE = ['gestion'];

/**
 * Page parente d'une page du Menu, d'après le nom de sa route (`requetes/[id]`, `gestion/requetes/index`...) :
 * la liste pour un détail ou un formulaire, la liste du Menu pour une liste ou une page de gestion.
 */
export function pageParente(nomRoute: string): Href {
  const segments = nomRoute.split('/');
  if (segments.at(-1) === 'index') return '/menu';
  const dossier = segments.slice(0, -1);
  if (dossier.length === 0 || SANS_LISTE.includes(dossier.join('/'))) return '/menu';
  return `/${dossier.join('/')}` as Href;
}

/** Ajoute l'onglet d'origine à l'adresse à ouvrir, si la page affichée (`chemin`) est l'Accueil ou le Profil. */
export function avecOrigine(href: Href, chemin: string): Href {
  if (!ORIGINES.includes(chemin)) return href;
  if (typeof href === 'string') return `${href}${href.includes('?') ? '&' : '?'}${PARAM_RETOUR}=${encodeURIComponent(chemin)}` as Href;
  return { ...href, params: { ...href.params, [PARAM_RETOUR]: chemin } };
}

/** Onglet d'origine porté par l'adresse de la page, s'il est valide. */
export function origineDe(route: Route): string | null {
  const valeur = (route.params as Record<string, unknown> | undefined)?.[PARAM_RETOUR];
  return typeof valeur === 'string' && ORIGINES.includes(valeur) ? valeur : null;
}

/**
 * Adresse de la page parente de `route`, avec les paramètres que celle-ci a déjà dans la pile : remonter vers
 * une page ouverte sans eux effacerait son propre onglet d'origine (liste ouverte depuis l'Accueil, par exemple).
 */
function parentDansLaPile(navigation: Navigation, route: Route): Href {
  const chemin = pageParente(route.name) as string;
  const nom = chemin === `/${LISTE_MENU}` ? LISTE_MENU : `${chemin.slice(1)}/index`;
  const parent = navigation.getState().routes.filter((r) => r.name === nom).pop();
  const params = parent?.params;
  return (params && Object.keys(params).length ? { pathname: chemin, params } : chemin) as Href;
}

/** Vrai pour les pages de la pile du Menu (la liste du Menu en est toujours le premier écran). */
function estDansMenu(navigation: Navigation): boolean {
  return navigation.getState().routes[0]?.name === LISTE_MENU;
}

/**
 * Retour de la page `route`, dans le Menu : l'onglet d'où elle a été ouverte (Accueil, Profil), sinon sa page
 * parente (on remonte jusqu'à elle si elle est dans la pile, sinon elle remplace la page affichée). Hors du Menu :
 * page précédente de la pile ou `secours`. La liste du Menu n'a ni origine ni parent : son retour est celui des
 * onglets (onglet visité juste avant).
 */
export function reculer(navigation: Navigation, route: Route, secours: Href = '/menu'): void {
  if (estDansMenu(navigation) && route.name !== LISTE_MENU) {
    const origine = origineDe(route);
    if (origine) router.navigate(origine as Href);
    else router.dismissTo(parentDansLaPile(navigation, route));
  } else if (navigation.canGoBack()) navigation.goBack();
  else router.replace(secours);
}
