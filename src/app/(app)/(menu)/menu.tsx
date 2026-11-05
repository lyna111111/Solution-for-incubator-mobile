import { FontAwesome5 } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { useActualiserCompte } from '@/hooks/useActualiserCompte';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useAuthStore } from '@/store/auth';
import { type Palette, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

interface Entree {
  titre: string;
  icone: IconName;
  route: string;
  /** Module requis (administrateur uniquement) : selon le type d'administrateur. */
  module?: string;
}

// Utilisateur : son espace (ses notifications et ses requêtes sont dans la barre du bas, pas ici).
const MENU_UTILISATEUR: Entree[] = [
  { titre: 'Événements', icone: 'calendar-alt', route: '/evenements' },
  { titre: 'Articles', icone: 'newspaper', route: '/articles' },
];

// Administrateur : mêmes intitulés et icônes, dans le même ordre, que la barre latérale du site
// (la gestion des requêtes est dans la barre du bas).
const MENU_ADMIN: Entree[] = [
  { module: 'utilisateurs', titre: 'Gestion des Utilisateurs', icone: 'users', route: '/gestion/utilisateurs' },
  { module: 'evenements', titre: 'Gestion des Événements', icone: 'calendar-alt', route: '/gestion/evenements' },
  { module: 'projets', titre: 'Gestion des Projets', icone: 'project-diagram', route: '/gestion/projets' },
  { module: 'articles', titre: 'Gestion des Articles', icone: 'newspaper', route: '/gestion/articles' },
  { module: 'statistiques', titre: 'Statistiques Global', icone: 'chart-pie', route: '/gestion/statistiques' },
  { module: 'documents', titre: 'Feedback des Documents', icone: 'file-alt', route: '/gestion/documents' },
  { module: 'notifications', titre: 'Gestion des Notifications', icone: 'bell', route: '/gestion/notifications' },
  { module: 'administrateurs', titre: 'Administrateurs', icone: 'user-shield', route: '/gestion/administrateurs' },
];

// Super Admin : mêmes pages que la barre latérale Super Admin du site.
const MENU_SUPERADMIN: Entree[] = [
  { titre: 'Incubateurs', icone: 'building', route: '/incubateurs' },
  { titre: 'Offres', icone: 'tags', route: '/offres' },
  { titre: 'Abonnements', icone: 'sync-alt', route: '/abonnements' },
  { titre: 'Paiements', icone: 'credit-card', route: '/paiements' },
  { titre: 'Administrateurs', icone: 'user-shield', route: '/superadmins' },
];

/** Menu : la même page pour tous les rôles, seules les entrées proposées changent. */
export default function Menu() {
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const role = useAuthStore((s) => s.user?.role);
  // Le sélecteur ne doit pas fabriquer de nouveau tableau (`?? []`) : il relancerait le rendu à l'infini.
  const modulesBruts = useAuthStore((s) => s.user?.modules);
  const { refreshing, actualiser } = useActualiserCompte();

  const entrees =
    role === 'superadmin' ? MENU_SUPERADMIN
      : role === 'admin' ? MENU_ADMIN.filter((m) => (modulesBruts ?? []).includes(m.module ?? ''))
        : MENU_UTILISATEUR;

  return (
    <Screen withTopInset title="Menu" menu="fermer" refreshing={refreshing} onRefresh={() => void actualiser()}>
      <Stack.Screen options={{ headerShown: false }} />
      {entrees.map((m) => (
        <Pressable key={m.route} onPress={() => ouvrir(m.route as never)}>
          <Card style={styles.ligne}>
            <View style={styles.icone}><FontAwesome5 name={m.icone} size={18} color={colors.primary} /></View>
            <Text style={styles.titre}>{m.titre}</Text>
            <FontAwesome5 name="angle-right" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icone: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  titre: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
});
