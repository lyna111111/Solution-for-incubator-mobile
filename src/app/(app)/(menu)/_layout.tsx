import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';
import { useT } from '@/i18n';

export const unstable_settings = { initialRouteName: 'menu' };

/**
 * Pile de l'onglet « Menu » : le menu puis toutes les pages auxquelles il mène (espace utilisateur,
 * modules de l'administrateur, pages du Super Admin). La flèche de retour ramène donc au menu.
 * Les écrans non listés ici posent leur titre eux-mêmes (`<Stack.Screen options>`).
 */
export default function MenuLayout() {
  const t = useT();
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ title: t('Notifications') }} />
      <Stack.Screen name="notifications/[id]" options={{ title: t('Notification') }} />
      <Stack.Screen name="evenements/index" options={{ title: t('Événements') }} />
      <Stack.Screen name="evenements/[id]" options={{ title: t("Détail de l'événement") }} />
      <Stack.Screen name="requetes/index" options={{ title: t('Mes Requêtes') }} />
      <Stack.Screen name="requetes/nouvelle" options={{ title: t('Nouvelle requête') }} />
      <Stack.Screen name="requetes/[id]" options={{ title: t('Détail de la requête') }} />
      <Stack.Screen name="articles/index" options={{ title: t('Articles') }} />
      <Stack.Screen name="articles/[id]" options={{ title: t("Détail de l'article") }} />
    </Stack>
  );
}
