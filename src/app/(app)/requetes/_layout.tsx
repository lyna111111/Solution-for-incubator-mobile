import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export default function RequetesLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Mes Requêtes' }} />
      <Stack.Screen name="nouvelle" options={{ title: 'Nouvelle requête' }} />
      <Stack.Screen name="[id]" options={{ title: 'Détail de la requête' }} />
    </Stack>
  );
}
