import { Stack } from 'expo-router';

import { stackOptions } from '@/components/stackOptions';

export default function GestionLayout() {
  return <Stack screenOptions={stackOptions} />;
}
