import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { DialogueHost } from '@/components/Dialogue';
import { Loading } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { memoriserVersionDuCode, rechargerCodeSiNouveau } from '@/utils/rechargerCode';

const queryClient = new QueryClient({
  defaultOptions: {
    // Données toujours relues à l'affichage d'une page et au retour dans l'app (l'ancien cache de 30 s les figeait).
    queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: true },
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

  // Au retour dans l'app : les données sont relues, et en développement le code l'est aussi s'il a changé.
  useEffect(() => {
    void memoriserVersionDuCode();
    const abonnement = AppState.addEventListener('change', (etat) => {
      focusManager.setFocused(etat === 'active');
      if (etat === 'active') void rechargerCodeSiNouveau();
    });
    return () => abonnement.remove();
  }, []);

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
      <DialogueHost />
    </QueryClientProvider>
  );
}
