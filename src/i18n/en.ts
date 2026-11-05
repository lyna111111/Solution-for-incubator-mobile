import { APP } from './dict/app';
import { WEB } from './dict/web';

/** Texte français -> anglais : traductions du site, complétées (et corrigées) par celles propres à l'application. */
export const EN: Record<string, string> = Object.fromEntries(
  Object.entries({ ...WEB, ...APP }).map(([fr, [en]]) => [fr, en]),
);
