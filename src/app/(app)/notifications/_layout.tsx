import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Notifications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Notification' }} />
    </Stack>
  );
}
