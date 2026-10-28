import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { useNonLues } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Mêmes icônes (FontAwesome) que la barre latérale du site.
function icone(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <FontAwesome5 name={name} size={size - 4} color={color as string} solid />
  );
}

export default function AppTabs() {
  const nonLues = useNonLues();
  const role = useAuthStore((s) => s.user?.role);
  // `href: null` masque un onglet. Utilisateur : espace utilisateur ; administrateur : accueil,
  // gestion (modules selon son type) et profil ; Super Admin : accueil et profil (étape 4).
  const masqueSauf = (visible: boolean) => (visible ? undefined : null);
  const utilisateur = role === 'utilisateur';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('home') }} />
      <Tabs.Screen name="gestion" options={{ title: 'Gestion', href: masqueSauf(role === 'admin'), tabBarIcon: icone('th-large') }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifs',
          href: masqueSauf(utilisateur),
          tabBarIcon: icone('bell'),
          tabBarBadge: nonLues > 0 ? nonLues : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.unread, color: colors.text },
        }}
      />
      <Tabs.Screen name="evenements" options={{ title: 'Événements', href: masqueSauf(utilisateur), tabBarIcon: icone('calendar-alt') }} />
      <Tabs.Screen name="requetes" options={{ title: 'Requêtes', href: masqueSauf(utilisateur), tabBarIcon: icone('paper-plane') }} />
      <Tabs.Screen name="articles" options={{ title: 'Articles', href: masqueSauf(utilisateur), tabBarIcon: icone('newspaper') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}
