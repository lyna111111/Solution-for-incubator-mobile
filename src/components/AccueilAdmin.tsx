import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import { Barres } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { gradient, type Palette, spacing, useColors, useStyles } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from './Screen';
import { Card, ErrorState, Loading, SectionTitle } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

function Carte({ icone, couleur, fond, label, valeur }: { icone: IconName; couleur: string; fond: string; label: string; valeur: number }) {
  const styles = useStyles(createStyles);
  return (
    <Card style={styles.carte}>
      <View style={styles.entete}>
        <View style={[styles.icone, { backgroundColor: fond }]}><FontAwesome5 name={icone} size={14} color={couleur} /></View>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={styles.valeur}>{valeur}</Text>
    </Card>
  );
}

/** Tableau de bord de l'administrateur : mêmes chiffres que l'accueil du site (lus dans son cache). */
export function AccueilAdmin() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminGet('dashboard/'),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const t = data.totaux;
  const trimestres = data.evenements_par_trimestre;

  return (
    <Screen withTopInset title="Tableau de Bord" refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Card>
        <Text style={styles.bienvenue}>
          Bienvenue, <Text style={{ color: colors.primary }}>{user?.type}</Text>
        </Text>
        <Text style={styles.sous}>{user?.prenom} {user?.nom} · {user?.incubateur?.nom}</Text>
      </Card>

      <View style={styles.grille}>
        <Carte icone="users" couleur={colors.primary} fond={colors.primarySoft} label="Inscrits" valeur={t.utilisateurs} />
        <Carte icone="tasks" couleur={colors.info} fond={colors.infoSoft} label="Requêtes reçues" valeur={t.requetes} />
        <Carte icone="calendar-alt" couleur={colors.success} fond={colors.successSoft} label="Événements" valeur={t.evenements} />
        <Carte icone="user-shield" couleur={colors.warning} fond={colors.warningSoft} label="Staff" valeur={t.administrateurs} />
      </View>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-pie">Répartition des utilisateurs</SectionTitle>
        <Barres donnees={data.repartition_utilisateurs.map((r: any) => ({ label: r.libelle, valeur: r.total }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="calendar-check">Événements par trimestre</SectionTitle>
        <Barres couleur={colors.secondary} donnees={trimestres.labels.map((label: string, i: number) => ({
          label, valeur: trimestres.workshops[i] + trimestres.conferences[i] + trimestres.formations[i] }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="file-alt">Documents</SectionTitle>
        <Barres couleur={colors.success} donnees={[
          { label: 'Événements', valeur: data.documents.evenement }, { label: 'Requêtes', valeur: data.documents.requete },
          { label: 'Réponses', valeur: data.documents.reponse },
        ]} />
      </Card>

      {data.top_projets.length > 0 && (
        <Card style={{ gap: spacing.md }}>
          <SectionTitle icon="rocket">Projets les plus avancés</SectionTitle>
          {data.top_projets.map((p: any) => (
            <View key={p.id} style={{ gap: 4 }}>
              <View style={styles.entete}>
                <Text style={styles.label}>{p.intitule}</Text>
                <Text style={[styles.label, { color: colors.primary }]}>{p.progression}%</Text>
              </View>
              <View style={styles.piste}>
                <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ height: 10, width: `${Math.min(100, p.progression)}%` }} />
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card style={{ gap: 6 }}>
        <SectionTitle icon="history">Activité récente</SectionTitle>
        {data.derniers.utilisateur && <Text style={styles.sous}>Dernier inscrit : {data.derniers.utilisateur}</Text>}
        {data.derniers.requete && <Text style={styles.sous}>Dernière requête : {data.derniers.requete}</Text>}
        {data.derniers.evenement && <Text style={styles.sous}>Dernier événement : {data.derniers.evenement}</Text>}
        {data.derniers.document && <Text style={styles.sous}>Dernier document : {data.derniers.document}</Text>}
        {data.derniers.administrateur && <Text style={styles.sous}>Dernier admin : {data.derniers.administrateur}</Text>}
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  bienvenue: { fontSize: 20, fontWeight: '800', color: colors.text },
  sous: { fontSize: 14, color: colors.textMuted },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  carte: { width: '47.5%', flexGrow: 1, gap: spacing.md, padding: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  icone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  valeur: { fontSize: 28, fontWeight: '800', color: colors.text },
  piste: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
});
