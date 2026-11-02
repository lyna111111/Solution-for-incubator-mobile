/// <reference types="jest" />
/// <reference types="node" />
/**
 * Garde-fou : toute la navigation passe par `hooks/useOuvrir` (ouvrir une page), `hooks/useReculer` et
 * `navigation/retour` (revenir). Une ouverture ou un retour direct réintroduirait une logique parallèle.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const RACINE = join(__dirname, '..');
const AUTORISES = ['hooks/useOuvrir.ts', 'navigation/retour.ts'];
const INTERDITS = [/router\.(push|back|navigate|dismiss\w*)\(/, /useRouter\(/, /\.goBack\(/, /<Link[\s>]/, /BackHandler\.add/];

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
      if (relatif === 'components/stackOptions.tsx' && /BackHandler\.add/.test(l)) return; // bouton Android de la flèche
      if (INTERDITS.some((re) => re.test(l))) fautes.push(`${relatif}:${i + 1}  ${ligne}`);
    });
  }
  expect(fautes).toEqual([]);
});
