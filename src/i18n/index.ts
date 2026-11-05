/**
 * Traduction de l'application : français (langue d'origine), anglais et arabe, comme le site.
 *
 * Le texte français sert de clé : `t('Mes requêtes')` renvoie le texte tel quel en français, sa traduction en anglais
 * ou en arabe sinon (dictionnaires de `./en` et `./ar`). Un texte sans traduction reste en français, jamais vide.
 * `{nom}` dans un texte est remplacé par la valeur donnée : `t('Toutes ({n})', { n: 12 })`.
 *
 * - dans un composant : `const t = useT()` (le composant se réaffiche quand la langue change) ;
 * - pour un libellé écrit dans une configuration hors composant : `_t('Libellé')` (ne fait que marquer le texte pour
 *   le test des traductions), puis `t(libellé)` à l'affichage ;
 * - hors composant, à l'exécution (messages d'erreur...) : `traduire(...)` avec la langue courante.
 */
import { useCallback } from 'react';
import { create } from 'zustand';

import { loadItem, saveItem } from '@/utils/secureStorage';

import { AR } from './ar';
import { EN } from './en';

export type Langue = 'fr' | 'en' | 'ar';

export const LANGUES: { code: Langue; libelle: string }[] = [
  { code: 'fr', libelle: 'Français' },
  { code: 'en', libelle: 'English' },
  { code: 'ar', libelle: 'عربية' },
];

const CLE = 'lang';

interface LangueState {
  lang: Langue;
  /** Vrai quand le choix enregistré a été relu au démarrage (évite un flash de la mauvaise langue). */
  pret: boolean;
  hydrate: () => Promise<void>;
  choisir: (lang: Langue) => Promise<void>;
}

const estLangue = (v: unknown): v is Langue => v === 'fr' || v === 'en' || v === 'ar';

/** Langue choisie par l'utilisateur, enregistrée sur le téléphone (français par défaut, comme le site). */
export const useLangStore = create<LangueState>((set) => ({
  lang: 'fr',
  pret: false,

  async hydrate() {
    const enregistree = await loadItem(CLE);
    set(estLangue(enregistree) ? { lang: enregistree, pret: true } : { pret: true });
  },

  async choisir(lang) {
    set({ lang });
    await saveItem(CLE, lang);
  },
}));

export type Variables = Record<string, string | number>;

const DICTIONNAIRES: Record<Exclude<Langue, 'fr'>, Record<string, string>> = { en: EN, ar: AR };

/** Texte français -> texte dans la langue demandée (le français lui-même si aucune traduction n'existe). */
export function traduire(lang: Langue, texte: string, variables?: Variables): string {
  const base = lang === 'fr' ? texte : (DICTIONNAIRES[lang][texte] ?? texte);
  if (!variables) return base;
  return base.replace(/\{(\w+)\}/g, (m, nom: string) => (nom in variables ? String(variables[nom]) : m));
}

export type Traducteur = (texte: string, variables?: Variables) => string;

/** Fonction de traduction de la langue courante ; le composant se réaffiche quand la langue change. */
export function useT(): Traducteur {
  const lang = useLangStore((s) => s.lang);
  return useCallback((texte, variables) => traduire(lang, texte, variables), [lang]);
}

/** Traduction à l'instant T, hors composant (ne réaffiche rien : à n'utiliser que pour un texte créé à la demande). */
export const tMaintenant: Traducteur = (texte, variables) => traduire(useLangStore.getState().lang, texte, variables);

let inverses: Map<string, string> | null = null;

/**
 * Texte déjà traduit -> texte français d'origine (le texte lui-même s'il est déjà en français ou inconnu). Sert aux
 * règles qui reconnaissent un libellé par ses mots français, comme le choix de l'icône d'un champ.
 */
export function versFrancais(texte: string): string {
  if (!inverses) {
    inverses = new Map();
    for (const dico of [EN, AR]) for (const [fr, trad] of Object.entries(dico)) if (!inverses.has(trad)) inverses.set(trad, fr);
  }
  return inverses.get(texte) ?? texte;
}

/** Marque un texte français écrit hors composant (configuration) ; le texte est traduit à l'affichage avec `t()`. */
export const _t = (texte: string): string => texte;

/** Langue courante, pour le sens d'écriture et les dates. */
export const useLangue = (): Langue => useLangStore((s) => s.lang);

/** Vrai pour l'arabe : l'écran s'affiche de droite à gauche. */
export const useEstRTL = (): boolean => useLangStore((s) => s.lang === 'ar');
