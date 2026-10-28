import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export default function Layout() {
  return <Stack screenOptions={useStackOptions()} />;
}
