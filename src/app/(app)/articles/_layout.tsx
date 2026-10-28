import { Stack } from 'expo-router';

import { stackOptions } from '@/components/stackOptions';

export default function ArticlesLayout() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Articles' }} />
      <Stack.Screen name="[id]" options={{ title: "Détail de l'article" }} />
    </Stack>
  );
}
