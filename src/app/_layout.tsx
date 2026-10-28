import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Loading } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const connecte = useAuthStore((s) => !!s.accessToken && !!s.user);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Évite d'afficher l'écran de connexion une fraction de seconde alors que
  // le jeton est en cours de lecture dans le stockage sécurisé.
  if (!hydrated) return <Loading />;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={connecte}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!connecte}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
