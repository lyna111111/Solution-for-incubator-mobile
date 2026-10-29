import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { gradient, type Palette, radius, spacing, useColors, useStyles } from '@/theme';

import { Kpi, TitreGraphique } from './DashboardUi';
import { Anneau, HistogrammeEmpile } from './Graphiques';
import { Screen } from './Screen';
import { Card, ErrorState, Loading } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Couleurs des secteurs « Répartition des utilisateurs » du site (templates/dashboard/accueil.html).
const COULEURS_UTILISATEURS = ['#8a3ffc', '#00c2ff', '#10b981', '#f59e0b', '#ef4444', '#63e0ff'];

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
  // Seulement les pages auxquelles son type d'administrateur donne accès.
  const lien = (module: string) => (user?.modules?.includes(module) ? `/gestion/${module}` : undefined);
  const t = data.totaux;
  const trimestres = data.evenements_par_trimestre;
  const documents: { label: string; valeur: number; icone: IconName; couleur: string; fond: string }[] = [
    { label: 'Événements', valeur: data.documents.evenement, icone: 'calendar-alt', couleur: colors.primary, fond: colors.primarySoft },
    { label: 'Requêtes', valeur: data.documents.requete, icone: 'tasks', couleur: colors.info, fond: colors.infoSoft },
    { label: 'Réponses', valeur: data.documents.reponse, icone: 'reply', couleur: colors.success, fond: colors.successSoft },
  ];
  const activite: { icone: IconName; label: string; valeur?: string | null; couleur: string; fond: string }[] = [
    { icone: 'user-plus', label: 'Dernier inscrit', valeur: data.derniers.utilisateur, couleur: colors.primary, fond: colors.primarySoft },
    { icone: 'tasks', label: 'Dernière requête', valeur: data.derniers.requete, couleur: colors.info, fond: colors.infoSoft },
    { icone: 'calendar-alt', label: 'Dernier événement', valeur: data.derniers.evenement, couleur: colors.success, fond: colors.successSoft },
    { icone: 'file-alt', label: 'Dernier document', valeur: data.derniers.document, couleur: colors.warning, fond: colors.warningSoft },
    { icone: 'user-shield', label: 'Dernier admin', valeur: data.derniers.administrateur, couleur: colors.danger, fond: colors.dangerSoft },
  ];

  return (
    <Screen withTopInset title="Tableau de bord" refreshing={isRefetching} onRefresh={() => void refetch()}>
      <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroIcone}><FontAwesome5 name="rocket" size={20} color="#fff" /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.heroPetit}>Bienvenue</Text>
          <Text style={styles.heroTitre} numberOfLines={2}>
            {user?.type === 'Admin principal' ? 'Administrateur principal' : user?.type}
          </Text>
          <Text style={styles.heroSous} numberOfLines={2}>{user?.prenom} {user?.nom} · {user?.incubateur?.nom}</Text>
        </View>
      </LinearGradient>

      <View style={styles.grille}>
        <Kpi icone="users" couleur={colors.primary} fond={colors.primarySoft} label="Inscrits" valeur={t.utilisateurs}
          route={lien('utilisateurs')} />
        <Kpi icone="tasks" couleur={colors.info} fond={colors.infoSoft} label="Requêtes reçues" valeur={t.requetes}
          route={lien('requetes')} />
        <Kpi icone="calendar-alt" couleur={colors.success} fond={colors.successSoft} label="Événements" valeur={t.evenements}
          route={lien('evenements')} />
        <Kpi icone="user-shield" couleur={colors.warning} fond={colors.warningSoft} label="Staff" valeur={t.administrateurs}
          route={lien('administrateurs')} />
      </View>

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="chart-pie" couleur={colors.primary} titre="Répartition des utilisateurs" />
        <Anneau parts={data.repartition_utilisateurs.map((r: any, i: number) => ({
          cle: r.type, label: r.libelle, valeur: r.total, couleur: COULEURS_UTILISATEURS[i % COULEURS_UTILISATEURS.length] }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="calendar-check" couleur={colors.secondary} titre="Événements par trimestre" />
        <HistogrammeEmpile
          series={[
            { label: 'Workshops', couleur: '#8a3ffc' }, { label: 'Conférences', couleur: '#00c2ff' }, { label: 'Formations', couleur: '#10b981' },
          ]}
          barres={trimestres.labels.map((label: string, i: number) => ({
            cle: label, label, valeurs: [trimestres.workshops[i], trimestres.conferences[i], trimestres.formations[i]] }))}
        />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="file-alt" couleur={colors.success} titre="Documents" />
        <View style={styles.documents}>
          {documents.map((d) => (
            <View key={d.label} style={styles.document}>
              <View style={[styles.documentIcone, { backgroundColor: d.fond }]}><FontAwesome5 name={d.icone} size={14} color={d.couleur} /></View>
              <Text style={styles.documentValeur}>{d.valeur}</Text>
              <Text style={styles.documentLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {data.top_projets.length > 0 && (
        <Card style={{ gap: spacing.md }}>
          <View style={styles.entete}>
            <View style={{ flex: 1 }}>
              <TitreGraphique icone="rocket" couleur={colors.primary} titre="Progression des projets clés" />
            </View>
            {!!lien('projets') && (
              <Pressable onPress={() => router.push('/gestion/projets')} style={styles.voirTout} hitSlop={8}>
                <Text style={styles.voirToutTexte}>Voir tout</Text>
                <FontAwesome5 name="arrow-right" size={11} color={colors.text} />
              </Pressable>
            )}
          </View>
          {data.top_projets.map((p: any) => (
            <View key={p.id} style={{ gap: 6 }}>
              <View style={styles.entete}>
                <Text style={styles.projet} numberOfLines={1}>{p.intitule}</Text>
                <Text style={styles.pourcentage}>{p.progression}%</Text>
              </View>
              <View style={styles.piste}>
                <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ height: 8, borderRadius: 4, width: `${Math.min(100, p.progression)}%` }} />
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="history" couleur={colors.textMuted} titre="Activité récente" />
        {activite.every((a) => !a.valeur) && <Text style={styles.vide}>Aucune activité pour le moment.</Text>}
        {activite.filter((a) => a.valeur).map((a) => (
          <View key={a.label} style={styles.activite}>
            <View style={[styles.activiteIcone, { backgroundColor: a.fond }]}><FontAwesome5 name={a.icone} size={13} color={a.couleur} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activiteLabel}>{a.label}</Text>
              <Text style={styles.activiteValeur} numberOfLines={2}>{a.valeur}</Text>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  heroIcone: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  heroPetit: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.6 },
  heroTitre: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSous: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  documents: { flexDirection: 'row', gap: spacing.sm },
  document: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radius.md, paddingVertical: spacing.md },
  documentIcone: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  documentValeur: { fontSize: 20, fontWeight: '700', color: colors.text },
  documentLabel: { fontSize: 11, color: colors.textMuted },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voirTout: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6,
  },
  voirToutTexte: { fontSize: 12, fontWeight: '600', color: colors.text },
  projet: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  pourcentage: { fontSize: 13, fontWeight: '700', color: colors.primary },
  piste: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  activite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activiteIcone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activiteLabel: { fontSize: 12, color: colors.textMuted },
  activiteValeur: { fontSize: 14, fontWeight: '600', color: colors.text },
  vide: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
