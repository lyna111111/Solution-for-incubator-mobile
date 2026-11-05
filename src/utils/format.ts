import { _t, type Langue, tMaintenant, useLangStore } from '@/i18n';
import type { Palette } from '@/theme';
import type { CategorieStatut } from '@/types';

/** Noms des mois (minuscules) dans chaque langue. */
const MOIS: Record<Langue, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** Initiales des jours de la semaine, du lundi au dimanche. */
export const JOURS_INITIALES: Record<Langue, string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

/** Nom du mois (0 = janvier) dans la langue courante, avec une majuscule (« Octobre », « October »). */
export function nomMois(mois: number, lang: Langue = useLangStore.getState().lang): string {
  const nom = MOIS[lang][mois];
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

/** "2026-10-28" ou "2026-10-28T09:15:00" -> "28 octobre 2026" (ou « 28 October 2026 », « 28 أكتوبر 2026 »). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [annee, mois, jour] = value.slice(0, 10).split('-').map(Number);
  if (!annee || !mois || !jour) return value;
  return `${jour} ${MOIS[useLangStore.getState().lang][mois - 1]} ${annee}`;
}

/** "2026-10-28T09:15:00" -> "28 octobre 2026 à 09:15". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const heure = value.length > 10 ? value.slice(11, 16) : '';
  return heure ? `${formatDate(value)} ${tMaintenant('à')} ${heure}` : formatDate(value);
}

/** "14:30:00" -> "14:30". */
export function formatHeure(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '';
}

export function plage(debut: string | null, fin: string | null): string {
  if (debut && fin) return `${formatHeure(debut)} - ${formatHeure(fin)}`;
  return formatHeure(debut) || formatHeure(fin);
}

/** Libellés français des statuts (à traduire à l'affichage avec `t()`). */
export const LIBELLE_STATUT: Record<CategorieStatut, string> = {
  attente: _t('En attente'),
  traitee: _t('Traitée'),
  rejetee: _t('Rejetée'),
};

export const couleurStatut = (colors: Palette): Record<CategorieStatut, { fond: string; texte: string }> => ({
  attente: { fond: colors.warningSoft, texte: colors.warning },
  traitee: { fond: colors.successSoft, texte: colors.success },
  rejetee: { fond: colors.dangerSoft, texte: colors.danger },
});

/** Date du jour au format AAAA-MM-JJ (heure locale). */
export function aujourdhui(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}

/** 125000 -> "125 000 DA" (montants des abonnements et paiements). */
export function formaterDA(montant: number | null | undefined): string {
  const n = Math.round(Number(montant ?? 0));
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${tMaintenant('DA')}`;
}
