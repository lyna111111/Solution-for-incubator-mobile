import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export default function EvenementsLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Événements' }} />
      <Stack.Screen name="[id]" options={{ title: "Détail de l'événement" }} />
    </Stack>
  );
}
