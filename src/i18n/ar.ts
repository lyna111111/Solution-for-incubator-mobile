import { APP } from './dict/app';
import { WEB } from './dict/web';

/** Texte français -> arabe : traductions du site, complétées (et corrigées) par celles propres à l'application. */
export const AR: Record<string, string> = Object.fromEntries(
  Object.entries({ ...WEB, ...APP }).map(([fr, [, ar]]) => [fr, ar]),
);
