/**
 * Retour en arrière : une seule règle pour toute l'application (tous les rôles, tous les espaces).
 *
 * Le routeur tient déjà l'historique réel : chaque pile (Menu, connexion) garde ses pages ouvertes dans l'ordre, et
 * la barre d'onglets garde l'ordre des onglets visités (`backBehavior="history"`, sans doublon). Il n'y a donc aucune
 * « page d'origine » mémorisée à part, et donc rien qui puisse devenir périmé. Retour = revenir d'une page, avec
 * une seule particularité :
 *
 *   la première page ouverte au-dessus de la liste du Menu (depuis l'Accueil, le Profil ou la liste elle-même)
 *   ramène à l'onglet visité juste avant, car la liste du Menu n'est jamais une page de l'historique.
 *
 * `reculer` est l'unique fonction de retour. Les écrans ne l'appellent jamais directement : ils passent par
 * `hooks/useReculer.ts` (flèche, bouton Android, retours après enregistrement ou suppression, liens « retour »).
 * Ouverture, remplacement d'une page : `hooks/useOuvrir.ts`. Remise à zéro de la pile en quittant l'onglet Menu :
 * `popToTopOnBlur` dans `app/(app)/_layout.tsx`.
 */
import { type Href, router } from 'expo-router';

interface Onglets {
  getState: () => { key: string; history?: unknown[] };
  dispatch: (action: { type: string; target?: string }) => void;
}

export interface Navigation {
  getState: () => { routes: { key: string; name: string }[] };
  getParent: () => unknown;
  goBack: () => void;
  canGoBack: () => boolean;
  isFocused: () => boolean;
}

/** Nom de l'écran « liste du Menu » : toujours le premier de la pile, jamais une page de l'historique. */
const LISTE_MENU = 'menu';

/** Vrai pour la première page de sa pile (au-dessus de la liste du Menu pour le Menu). */
export function estPremierePage(navigation: Navigation, routeKey: string): boolean {
  const routes = navigation.getState().routes;
  const premiere = routes[0]?.name === LISTE_MENU ? 1 : 0;
  return routes[premiere]?.key === routeKey;
}

/** Onglets si la page peut ramener à l'onglet précédent (au moins deux onglets visités), sinon `null`. */
function ongletPrecedent(navigation: Navigation): { onglets: Onglets; cle: string } | null {
  const onglets = navigation.getParent() as Onglets | undefined;
  const etat = onglets?.getState();
  if (!onglets || !etat?.history || etat.history.length < 2) return null;
  return { onglets, cle: etat.key };
}

/**
 * Retour de la page `routeKey` : onglet précédent pour la première page du Menu, sinon page précédente de la pile.
 * Sans page précédente (lien direct, actualisation) : `secours` (la liste du Menu, ou la connexion).
 */
export function reculer(navigation: Navigation, routeKey: string, secours: Href = '/menu'): void {
  const precedent = estPremierePage(navigation, routeKey) ? ongletPrecedent(navigation) : null;
  if (precedent) precedent.onglets.dispatch({ type: 'GO_BACK', target: precedent.cle });
  else if (navigation.canGoBack()) navigation.goBack();
  else router.replace(secours);
}
