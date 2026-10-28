import { Stack } from 'expo-router';

import { useStackOptions } from '@/components/stackOptions';

export default function GestionLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
