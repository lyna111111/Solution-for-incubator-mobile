import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AccueilAdmin } from '@/components/AccueilAdmin';
import { AccueilUtilisateur } from '@/components/AccueilUtilisateur';
import { Screen } from '@/components/Screen';
import { Banner, Badge, Card } from '@/components/ui';
import { useActualiserCompte } from '@/hooks/useActualiserCompte';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme';

export default function Accueil() {
  const user = useAuthStore((s) => s.user);
  const { refreshing, actualiser } = useActualiserCompte();
  if (!user) return null;
  // Utilisateur et administrateur ont leur tableau de bord complet ; le Super Admin arrive à l'étape 4.
  if (user.role === 'utilisateur') return <AccueilUtilisateur />;
  if (user.role === 'admin') return <AccueilAdmin />;

  return (
    <Screen withTopInset title="Tableau de Bord" refreshing={refreshing} onRefresh={() => void actualiser()}>
      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={styles.welcome}>
            Bienvenue, <Text style={{ color: colors.primary }}>{user.prenom}</Text> !
          </Text>
          <Text style={styles.sub}>{user.email}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label="Super Admin" fond={colors.primarySoft} texte={colors.primaryDark} />
        </View>
        <View style={styles.row}>
          <FontAwesome5 name="building" size={14} color={colors.textMuted} />
          <Text style={styles.sub}>Tous les incubateurs</Text>
        </View>
      </Card>
      <Banner type="info" message="L'espace Super Admin arrive à l'étape 4." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
