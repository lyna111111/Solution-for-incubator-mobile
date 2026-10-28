import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Loading } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const connecte = useAuthStore((s) => !!s.accessToken && !!s.user);
  const themePret = useThemeStore((s) => s.pret);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const sombre = useThemeStore((s) => s.mode === 'dark');

  useEffect(() => {
    void hydrate();
    void hydrateTheme();
  }, [hydrate, hydrateTheme]);

  // Évite d'afficher l'écran de connexion une fraction de seconde alors que
  // le jeton est en cours de lecture dans le stockage sécurisé.
  if (!hydrated || !themePret) return <Loading />;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={sombre ? 'light' : 'dark'} />
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
