import { router } from 'expo-router';
import { create } from 'zustand';

/**
 * Page d'où l'on a ouvert une page du Menu depuis un autre onglet (« / » = Accueil, « /profil »).
 * Les pages du Menu vivent dans une pile propre : sans cette mémoire, leur flèche de retour mènerait à la
 * liste du Menu au lieu de la page d'où l'on vient (ex. carte du tableau de bord).
 */
interface RetourState {
  origine: string | null;
  definir: (origine: string | null) => void;
}

export const useRetour = create<RetourState>((set) => ({
  origine: null,
  definir: (origine) => set({ origine }),
}));

interface NavigationOnglets {
  getState: () => { routes: { name: string; state?: { key?: string; routes: { name: string }[] } }[] };
  dispatch: (action: { type: string; target?: string; payload?: unknown }) => void;
}

/**
 * Remet la pile du Menu à zéro : elle ne contient plus que la liste du Menu, quelle que soit la page qui était
 * ouverte (même si elle y était seule). Appelé en quittant l'onglet Menu et en appuyant sur « Menu ».
 */
export function viderPileMenu(onglets: NavigationOnglets): void {
  const pile = onglets.getState().routes.find((r) => r.name === '(menu)')?.state;
  if (!pile?.key || (pile.routes.length === 1 && pile.routes[0].name === 'menu')) return;
  onglets.dispatch({ type: 'RESET', target: pile.key, payload: { index: 0, routes: [{ name: 'menu' }] } });
}

export interface PileNavigation {
  getState: () => { routes: { key: string; name: string }[] };
  goBack: () => void;
  isFocused: () => boolean;
  dispatch: (action: { type: string }) => void;
}

/** Vrai si `routeKey` est la première page ouverte au-dessus de la liste du Menu (celle ouverte depuis l'Accueil/Profil). */
export function estPremierePage(navigation: PileNavigation, routeKey: string): boolean {
  const routes = navigation.getState().routes;
  const premiere = routes[0]?.name === 'menu' ? 1 : 0;
  return routes[premiere]?.key === routeKey;
}

/**
 * Retour d'une page de la pile du Menu : la première page ouverte depuis un autre onglet revient à cet onglet ;
 * toute autre page (ex. nouvelle requête -> liste, détail -> liste) revient d'une page.
 */
export function reculer(navigation: PileNavigation, routeKey: string): void {
  const { origine, definir } = useRetour.getState();
  if (origine && estPremierePage(navigation, routeKey)) {
    definir(null);
    navigation.dispatch({ type: 'POP_TO_TOP' }); // le Menu retrouve sa liste, pas la page qu'on vient de quitter
    router.navigate(origine as never);
    return;
  }
  navigation.goBack();
}
