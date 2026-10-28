import { Stack } from 'expo-router';

import { stackOptions } from '@/components/stackOptions';

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Notifications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Notification' }} />
    </Stack>
  );
}
