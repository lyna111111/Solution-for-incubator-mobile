import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export const unstable_settings = { initialRouteName: 'menu' };

/**
 * Pile de l'onglet « Menu » : le menu puis toutes les pages auxquelles il mène (espace utilisateur,
 * modules de l'administrateur, pages du Super Admin). La flèche de retour ramène donc au menu.
 * Les écrans non listés ici posent leur titre eux-mêmes (`<Stack.Screen options>`).
 */
export default function MenuLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} />
      <Stack.Screen name="notifications/[id]" options={{ title: 'Notification' }} />
      <Stack.Screen name="evenements/index" options={{ title: 'Événements' }} />
      <Stack.Screen name="evenements/[id]" options={{ title: "Détail de l'événement" }} />
      <Stack.Screen name="requetes/index" options={{ title: 'Mes Requêtes' }} />
      <Stack.Screen name="requetes/nouvelle" options={{ title: 'Nouvelle requête' }} />
      <Stack.Screen name="requetes/[id]" options={{ title: 'Détail de la requête' }} />
      <Stack.Screen name="articles/index" options={{ title: 'Articles' }} />
      <Stack.Screen name="articles/[id]" options={{ title: "Détail de l'article" }} />
    </Stack>
  );
}
