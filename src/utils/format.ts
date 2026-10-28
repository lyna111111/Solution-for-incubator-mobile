import { colors } from '@/theme';
import type { CategorieStatut } from '@/types';

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** "2026-10-28" ou "2026-10-28T09:15:00" -> "28 octobre 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [annee, mois, jour] = value.slice(0, 10).split('-').map(Number);
  if (!annee || !mois || !jour) return value;
  return `${jour} ${MOIS[mois - 1]} ${annee}`;
}

/** "2026-10-28T09:15:00" -> "28 octobre 2026 à 09:15". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const heure = value.length > 10 ? value.slice(11, 16) : '';
  return heure ? `${formatDate(value)} à ${heure}` : formatDate(value);
}

/** "14:30:00" -> "14:30". */
export function formatHeure(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '';
}

export function plage(debut: string | null, fin: string | null): string {
  if (debut && fin) return `${formatHeure(debut)} - ${formatHeure(fin)}`;
  return formatHeure(debut) || formatHeure(fin);
}

export const LIBELLE_STATUT: Record<CategorieStatut, string> = {
  attente: 'En attente',
  traitee: 'Traitée',
  rejetee: 'Rejetée',
};

export const COULEUR_STATUT: Record<CategorieStatut, { fond: string; texte: string }> = {
  attente: { fond: colors.warningSoft, texte: colors.warning },
  traitee: { fond: colors.successSoft, texte: colors.success },
  rejetee: { fond: colors.dangerSoft, texte: colors.danger },
};

/** Date du jour au format AAAA-MM-JJ (heure locale). */
export function aujourdhui(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}
