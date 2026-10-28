import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth';

/** Point d'entrée hors connexion : incubateur déjà choisi -> connexion, sinon choix de l'incubateur. */
export default function AuthIndex() {
  const tenant = useAuthStore((s) => s.tenant);
  return <Redirect href={tenant ? '/login' : '/incubateur'} />;
}
