/// <reference types="jest" />
/// <reference types="node" />
/**
 * Garde-fou : toute la navigation passe par `hooks/useOuvrir` (ouvrir, remplacer), `hooks/useReculer` (revenir,
 * bouton Android compris) et `navigation/retour` (la règle de retour). Aucun écran n'appelle `router`, `goBack` ou
 * `BackHandler` : un appel direct réintroduirait une seconde logique de navigation.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const RACINE = join(__dirname, '..');
const AUTORISES = ['hooks/useOuvrir.ts', 'hooks/useReculer.ts', 'navigation/retour.ts'];
const INTERDITS = [/\brouter\.\w+/, /useRouter\(/, /\.goBack\(/, /<Link[\s>]/, /BackHandler/, /reculerOuSecours/];

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === '__tests__' ? [] : fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

test('aucune navigation directe en dehors du module central', () => {
  const fautes: string[] = [];
  for (const f of fichiers(RACINE)) {
    const relatif = f.slice(RACINE.length + 1).split('\\').join('/');
    if (AUTORISES.includes(relatif)) continue;
    readFileSync(f, 'utf8').split(/\r?\n/).forEach((l, i) => {
      const ligne = l.trim();
      if (ligne.startsWith('*') || ligne.startsWith('//') || ligne.startsWith('/*')) return;
      if (INTERDITS.some((re) => re.test(l))) fautes.push(`${relatif}:${i + 1}  ${ligne}`);
    });
  }
  expect(fautes).toEqual([]);
});
