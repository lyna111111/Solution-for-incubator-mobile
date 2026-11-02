/**
 * Retour en arrière : une seule règle pour toute l'application.
 *
 * Le routeur tient déjà l'historique réel : chaque pile (Menu) garde ses pages ouvertes dans l'ordre, et la barre
 * d'onglets garde l'ordre des onglets visités (`backBehavior="history"`, sans doublon). Il n'y a donc aucune
 * « page d'origine » mémorisée à part, et donc rien qui puisse devenir périmé. Retour = revenir d'une page, avec
 * une seule particularité :
 *
 *   la première page ouverte au-dessus de la liste du Menu (depuis l'Accueil, le Profil ou la liste elle-même)
 *   ramène à l'onglet visité juste avant, car la liste du Menu n'est jamais une page de l'historique.
 *
 * `reculer` est appelée par la flèche de l'en-tête, le bouton Android (`stackOptions.tsx`) et les retours
 * programmatiques (`hooks/useReculer.ts`). Ouverture d'une page : `hooks/useOuvrir.ts`. Remise à zéro de la pile
 * en quittant l'onglet Menu : `popToTopOnBlur` dans `app/(app)/_layout.tsx`.
 */
import { type Href, router } from 'expo-router';

interface Onglets {
  getState: () => { key: string; history?: unknown[] };
  dispatch: (action: { type: string; target?: string }) => void;
}

export interface PileMenu {
  getState: () => { routes: { key: string; name: string }[] };
  getParent: () => unknown;
  goBack: () => void;
  canGoBack: () => boolean;
}

/** Nom de l'écran « liste du Menu » : toujours le premier de la pile, jamais une page de l'historique. */
const LISTE_MENU = 'menu';

/** Vrai pour la première page ouverte au-dessus de la liste du Menu. */
export function estPremierePage(pile: PileMenu, routeKey: string): boolean {
  const routes = pile.getState().routes;
  const premiere = routes[0]?.name === LISTE_MENU ? 1 : 0;
  return routes[premiere]?.key === routeKey;
}

/** Onglets si la page peut ramener à l'onglet précédent (au moins deux onglets visités), sinon `null`. */
function ongletPrecedent(pile: PileMenu): { onglets: Onglets; cle: string } | null {
  const onglets = pile.getParent() as Onglets | undefined;
  const etat = onglets?.getState();
  if (!onglets || !etat?.history || etat.history.length < 2) return null;
  return { onglets, cle: etat.key };
}

/**
 * Retour de la page `routeKey` de la pile du Menu : onglet précédent pour la première page, sinon page
 * précédente de la pile. Sans onglet précédent (lien direct, actualisation) : la liste du Menu.
 */
export function reculer(pile: PileMenu, routeKey: string): void {
  const precedent = estPremierePage(pile, routeKey) ? ongletPrecedent(pile) : null;
  if (precedent) precedent.onglets.dispatch({ type: 'GO_BACK', target: precedent.cle });
  else if (pile.canGoBack()) pile.goBack();
  else router.replace('/menu');
}

/** Retour d'une page hors pile du Menu (connexion, inscription...) : page précédente, sinon `secours`. */
export function reculerOuSecours(secours: Href): void {
  if (router.canGoBack()) router.back();
  else router.replace(secours);
}
