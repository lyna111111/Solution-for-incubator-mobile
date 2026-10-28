import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import { Barres } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formaterDA } from '@/utils/format';

import { Screen } from './Screen';
import { Badge, Card, ErrorState, Loading, SectionTitle } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

function Carte({ icone, couleur, fond, label, valeur }: { icone: IconName; couleur: string; fond: string; label: string; valeur: string | number }) {
  const styles = useStyles(createStyles);
  return (
    <Card style={styles.carte}>
      <View style={styles.entete}>
        <View style={[styles.icone, { backgroundColor: fond }]}><FontAwesome5 name={icone} size={14} color={couleur} /></View>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={styles.valeur} adjustsFontSizeToFit numberOfLines={1}>{valeur}</Text>
    </Card>
  );
}

/** Tableau de bord du Super Admin : mêmes chiffres que l'accueil Super Admin du site. */
export function AccueilSuperAdmin() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'super-dashboard'],
    queryFn: () => adminGet('dashboard/', undefined, 'superadmin'),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen withTopInset title="Tableau de Bord" refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Card>
        <Text style={styles.bienvenue}>
          Bienvenue, <Text style={{ color: colors.primary }}>{user?.prenom}</Text> !
        </Text>
        <Text style={styles.sous}>Super Admin · tous les incubateurs</Text>
      </Card>

      <View style={styles.grille}>
        <Carte icone="building" couleur={colors.primary} fond={colors.primarySoft} label="Incubateurs" valeur={data.total_incubateurs} />
        <Carte icone="check-circle" couleur={colors.success} fond={colors.successSoft} label="Incubateurs actifs" valeur={data.incubateurs_actifs} />
        <Carte icone="money-bill-wave" couleur={colors.info} fond={colors.infoSoft} label="Revenus du mois" valeur={formaterDA(data.revenus_mois)} />
        <Carte icone="ban" couleur={colors.danger} fond={colors.dangerSoft} label="Abonnements annulés" valeur={data.abonnements_annules} />
      </View>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-pie">Répartition des plans</SectionTitle>
        {data.plans.length === 0
          ? <Text style={styles.sous}>Aucun abonnement.</Text>
          : <Barres donnees={data.plans.map((p: any) => ({ label: p.nom, valeur: p.n }))} />}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-bar">Revenus des 6 derniers mois</SectionTitle>
        <Barres couleur={colors.secondary} donnees={data.revenus.map((r: any) => ({ label: `${r.libelle} · ${formaterDA(r.total)}`, valeur: r.total }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="history">Derniers incubateurs</SectionTitle>
        {data.derniers_incubateurs.length === 0 && <Text style={styles.sous}>Aucun incubateur.</Text>}
        {data.derniers_incubateurs.map((i: any) => (
          <Pressable key={i.id} onPress={() => router.push(`/incubateurs/${i.id}`)} style={styles.incubateur}>
            <View style={[styles.pastille, { backgroundColor: i.couleur }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nom}>{i.nom}</Text>
              <Text style={styles.sous}>{i.plan_display}</Text>
            </View>
            <Badge label={i.actif ? 'Actif' : 'Inactif'} fond={i.actif ? colors.successSoft : colors.dangerSoft}
              texte={i.actif ? colors.success : colors.danger} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  bienvenue: { fontSize: 20, fontWeight: '800', color: colors.text },
  sous: { fontSize: 13, color: colors.textMuted },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  carte: { width: '47.5%', flexGrow: 1, gap: spacing.md, padding: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  valeur: { fontSize: 26, fontWeight: '800', color: colors.text },
  incubateur: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pastille: { width: 14, height: 14, borderRadius: 7 },
  nom: { fontSize: 15, fontWeight: '600', color: colors.text },
});
