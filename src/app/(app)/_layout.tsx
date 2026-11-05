import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { useBadgeRequetes } from '@/hooks/useNotifications';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Mêmes icônes (FontAwesome) que la barre latérale du site.
function icone(name: IconName) {
  function IconeOnglet({ color, size }: { color: ColorValue; size: number }) {
    return <FontAwesome5 name={name} size={size - 4} color={color as string} solid />;
  }
  return IconeOnglet;
}

/**
 * Même barre pour tous les rôles : Accueil, Requêtes (selon le rôle), Profil. Le Menu s'ouvre avec le burger en haut à
 * droite. Seul le contenu change selon le rôle (accueil et entrées du menu : voir `index.tsx` et `(menu)/menu.tsx`).
 */
export default function AppTabs() {
  const colors = useColors();
  const ouvrir = useOuvrir();
  // Pastille de l'onglet Requêtes : requêtes reçues en attente (administrateur) ou ses requêtes en attente (utilisateur).
  const badgeRequetes = useBadgeRequetes();
  const role = useAuthStore((s) => s.user?.role);
  // Le sélecteur ne doit pas fabriquer de nouveau tableau (`?? []`) : il relancerait le rendu à l'infini.
  const modules = useAuthStore((s) => s.user?.modules);
  // Page des requêtes selon le rôle ; pas d'onglet pour le Super Admin ni pour un administrateur sans ce module.
  const routeRequetes =
    role === 'utilisateur' ? '/requetes'
      : role === 'admin' && (modules ?? []).includes('requetes') ? '/gestion/requetes'
        : null;

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
        name="raccourci-requetes"
        options={{
          title: 'Requêtes',
          tabBarIcon: icone('rocket'),
          tabBarBadge: badgeRequetes > 0 ? badgeRequetes : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.unread, color: colors.text },
          ...(routeRequetes ? {} : { href: null }),
        }}
        listeners={{
          // L'onglet ne mène à aucun écran à lui : il ouvre la page des requêtes (retour vers l'onglet d'où l'on vient).
          tabPress: (e) => {
            e.preventDefault();
            if (routeRequetes) ouvrir(routeRequetes as never);
          },
        }}
      />
      <Tabs.Screen
        name="(menu)"
        options={{
          title: 'Menu',
          // Plus visible dans la barre du bas : le Menu s'ouvre avec le burger en haut à droite (voir `BoutonMenu`).
          // Il reste un onglet du navigateur (historique, pile des pages du Menu) : `href: null` le rendrait inatteignable.
          tabBarItemStyle: { display: 'none' },
          // Le burger affiche toujours la liste du Menu : la pile est remise à zéro en quittant l'onglet.
          popToTopOnBlur: true,
          // Monté dès le départ : sa pile contient alors toujours la liste du Menu en premier. Sinon, ouvrir une page
          // du Menu depuis l'Accueil créerait une pile réduite à cette page, que la remise à zéro ne peut pas vider.
          lazy: false,
        }}
      />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}
