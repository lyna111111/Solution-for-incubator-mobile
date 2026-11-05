import { create } from 'zustand';

/** Menu latéral (tiroir à droite) : ouvert par le burger de la barre du haut, fermé par son fond ou une entrée. */
interface MenuState {
  ouvert: boolean;
  ouvrir: () => void;
  fermer: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  ouvert: false,
  ouvrir: () => set({ ouvert: true }),
  fermer: () => set({ ouvert: false }),
}));
