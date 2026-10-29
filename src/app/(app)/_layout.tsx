import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { useNonLues } from '@/hooks/useNotifications';
import { useRetour, viderPileMenu } from '@/store/retour';
import { useColors } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Mêmes icônes (FontAwesome) que la barre latérale du site.
function icone(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <FontAwesome5 name={name} size={size - 4} color={color as string} solid />
  );
}

/**
 * Même barre pour tous les rôles : Accueil, Menu, Profil. Seul le contenu change selon le rôle
 * (accueil et entrées du menu : voir `index.tsx` et `(menu)/menu.tsx`).
 */
export default function AppTabs() {
  const colors = useColors();
  // Notifications non lues (utilisateur uniquement ; 0 pour les autres rôles).
  const nonLues = useNonLues();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('home') }} />
      <Tabs.Screen
        name="(menu)"
        // « Menu » affiche toujours la liste du Menu : la pile est remise à zéro en appuyant sur l'onglet et en le quittant.
        listeners={({ navigation }) => ({
          tabPress: () => viderPileMenu(navigation),
          blur: () => {
            viderPileMenu(navigation);
            useRetour.getState().definir(null);
          },
        })}
        options={{
          title: 'Menu',
          tabBarIcon: icone('th-large'),
          tabBarBadge: nonLues > 0 ? nonLues : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.unread, color: colors.text },
        }}
      />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}
