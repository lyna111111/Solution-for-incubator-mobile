import { Stack } from 'expo-router';

import { stackOptions } from '@/components/stackOptions';

export default function Layout() {
  return <Stack screenOptions={stackOptions} />;
}
