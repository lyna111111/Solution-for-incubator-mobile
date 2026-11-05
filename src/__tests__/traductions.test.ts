/// <reference types="jest" />
/// <reference types="node" />
/**
 * Garde-fou des traductions : chaque texte français écrit dans le code (appels `t('...')`, `_t('...')` et libellés des
 * configurations de l'administration) a sa traduction en anglais ET en arabe, et les `{variables}` d'un texte se
 * retrouvent dans ses traductions. Sans cela, un texte resterait en français dans les autres langues.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import { AR } from '@/i18n/ar';
import { EN } from '@/i18n/en';
import { traduire } from '@/i18n';

const RACINE = join(__dirname, '..');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === '__tests__' || nom === 'i18n' ? [] : fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

const LITTERAL = '([\'"`])((?:\\\\.|(?!\\1)[^\\\\\\n])*)\\1';
const RE_APPEL = new RegExp(`(?<![A-Za-z0-9$.])(?:_t|t|tMaintenant)\\(\\s*${LITTERAL}`, 'g');
const RE_PROPRIETE = new RegExp(
  `\\b(?:label|titre|libelle|placeholder|placeholderRecherche|vide|indication|messageSuppression|sousTitre|aide|title|text|message|description)\\s*[:=]\\s*\\{?\\s*${LITTERAL}`,
  'g',
);
const desechapper = (s: string) => s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');

/** Texte français -> fichiers qui l'utilisent. */
function textesDuCode(): Map<string, string[]> {
  const textes = new Map<string, string[]>();
  const ajouter = (brut: string, fichier: string) => {
    const texte = desechapper(brut);
    if (!/[A-Za-zÀ-ÿ]/.test(texte)) return;
    textes.set(texte, [...(textes.get(texte) ?? []), fichier]);
  };
  for (const f of fichiers(RACINE)) {
    const relatif = f.slice(RACINE.length + 1).split('\\').join('/');
    const source = readFileSync(f, 'utf8');
    for (const m of source.matchAll(RE_APPEL)) if (!m[2].includes('${')) ajouter(m[2], relatif);
    // Les écrans de gestion et l'administration écrivent leurs libellés en français dans des propriétés : traduits à l'affichage.
    if (/^(admin|app\/\(app\)\/\(menu\))\//.test(relatif)) {
      for (const m of source.matchAll(RE_PROPRIETE)) if (!m[2].includes('${')) ajouter(m[2], relatif);
    }
  }
  return textes;
}

const variables = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('traductions', () => {
  const textes = textesDuCode();

  test('le code contient des textes à traduire (le test lit bien les fichiers)', () => {
    expect(textes.size).toBeGreaterThan(200);
  });

  test.each([['en', EN], ['ar', AR]] as const)('chaque texte du code a sa traduction (%s)', (langue, dico) => {
    const manquants = [...textes.entries()]
      .filter(([texte]) => !dico[texte])
      .map(([texte, fichiersUtilises]) => `${JSON.stringify(texte)}  (${[...new Set(fichiersUtilises)].join(', ')})`);
    expect({ langue, manquants }).toEqual({ langue, manquants: [] });
  });

  test.each([['en', EN], ['ar', AR]] as const)('les {variables} sont conservées dans la traduction (%s)', (langue, dico) => {
    const fautes = Object.entries(dico)
      .filter(([fr, trad]) => variables(fr).join() !== variables(trad).join())
      .map(([fr]) => fr);
    expect({ langue, fautes }).toEqual({ langue, fautes: [] });
  });

  test("l'anglais et l'arabe ne contiennent pas de traduction vide", () => {
    for (const dico of [EN, AR]) expect(Object.values(dico).filter((v) => !v.trim())).toEqual([]);
  });

  test('traduire() : français inchangé, anglais, arabe, variables, repli sur le français', () => {
    expect(traduire('fr', 'Bienvenue !')).toBe('Bienvenue !');
    expect(traduire('en', 'Bienvenue !')).toBe('Welcome!');
    expect(traduire('ar', 'Bienvenue !')).toBe('مرحبًا بك!');
    expect(traduire('en', 'Étape {n} sur {total}', { n: 2, total: 3 })).toBe('Step 2 of 3');
    expect(traduire('ar', 'Texte inconnu sans traduction')).toBe('Texte inconnu sans traduction');
  });
});
