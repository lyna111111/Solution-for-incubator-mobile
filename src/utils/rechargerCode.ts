import { DevSettings, NativeModules } from 'react-native';

/**
 * Développement uniquement : recharge le code de l'app quand le serveur Expo (Metro) en a une version plus
 * récente que celle chargée dans le téléphone. Le rechargement automatique d'Expo ne parvient pas toujours au
 * téléphone (app passée en arrière-plan, connexion coupée) : sans cela, il fallait fermer puis rouvrir l'app.
 *
 * Metro donne un identifiant de version du code (en-tête `X-Metro-Delta-ID`) qui change à chaque modification.
 * Dans une app installée (`__DEV__` faux) rien de tout cela n'existe : le code ne change qu'avec une mise à jour.
 */
let versionChargee: string | null = null;

async function versionDuServeur(): Promise<string | null> {
  const adresse = (NativeModules.SourceCode as { scriptURL?: string } | undefined)?.scriptURL;
  if (!adresse || !/^https?:/.test(adresse)) return null;
  try {
    const reponse = await fetch(adresse, { method: 'HEAD' });
    return reponse.headers.get('x-metro-delta-id');
  } catch {
    return null; // serveur injoignable : on garde le code chargé
  }
}

/** À appeler au démarrage : retient la version du code qui vient d'être chargée. */
export async function memoriserVersionDuCode(): Promise<void> {
  if (__DEV__) versionChargee = await versionDuServeur();
}

/**
 * Recharge l'app si Metro propose un code plus récent que celui chargé. Sans effet dans une app installée.
 * `recharger` n'est à fournir que pour les tests.
 */
export async function rechargerCodeSiNouveau(recharger: () => void = () => DevSettings.reload()): Promise<void> {
  if (!__DEV__) return;
  const version = await versionDuServeur();
  if (!version) return;
  if (versionChargee === null) versionChargee = version;
  else if (version !== versionChargee) recharger();
}
