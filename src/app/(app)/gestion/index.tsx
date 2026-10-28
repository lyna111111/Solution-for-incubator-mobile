import { FontAwesome5 } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { useActualiserCompte } from '@/hooks/useActualiserCompte';
import { useAuthStore } from '@/store/auth';
import { type Palette, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Mêmes intitulés et icônes, dans le même ordre, que la barre latérale du site.
const MENU: { module: string; titre: string; icone: IconName; route: string }[] = [
  { module: 'utilisateurs', titre: 'Gestion des Utilisateurs', icone: 'users', route: '/gestion/utilisateurs' },
  { module: 'requetes', titre: 'Gestion des Requêtes', icone: 'tasks', route: '/gestion/requetes' },
  { module: 'evenements', titre: 'Gestion des Événements', icone: 'calendar-alt', route: '/gestion/evenements' },
  { module: 'projets', titre: 'Gestion des Projets', icone: 'project-diagram', route: '/gestion/projets' },
  { module: 'articles', titre: 'Gestion des Articles', icone: 'newspaper', route: '/gestion/articles' },
  { module: 'statistiques', titre: 'Statistiques Global', icone: 'chart-pie', route: '/gestion/statistiques' },
  { module: 'documents', titre: 'Feedback des Documents', icone: 'file-alt', route: '/gestion/documents' },
  { module: 'notifications', titre: 'Gestion des Notifications', icone: 'bell', route: '/gestion/notifications' },
  { module: 'administrateurs', titre: 'Administrateurs', icone: 'user-shield', route: '/gestion/administrateurs' },
];

/** Menu de gestion : seulement les modules auxquels le type d'administrateur a droit. */
export default function MenuGestion() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  // Le sélecteur ne doit pas fabriquer de nouveau tableau (`?? []`) : il relancerait le rendu à l'infini.
  const modulesBruts = useAuthStore((s) => s.user?.modules);
  const modules = modulesBruts ?? [];
  const entrees = MENU.filter((m) => modules.includes(m.module));
  const { refreshing, actualiser } = useActualiserCompte();

  return (
    <Screen withTopInset title="Gestion" refreshing={refreshing} onRefresh={() => void actualiser()}>
      <Stack.Screen options={{ headerShown: false }} />
      {entrees.map((m) => (
        <Pressable key={m.module} onPress={() => router.push(m.route)}>
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
