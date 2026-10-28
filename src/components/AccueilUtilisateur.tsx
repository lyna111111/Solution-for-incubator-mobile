import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchAccueil, fetchMonProjet } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { colors, gradient, spacing } from '@/theme';

import { ProjetModal } from './ProjetModal';
import { EvenementRow, NotificationRow, RequeteRow } from './rows';
import { Screen } from './Screen';
import { Button, Card, ErrorState, Loading } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

/** Carte de statistique : même icône colorée + libellé + valeur que « top-card » sur le site. */
function StatCard({
  icone, couleur, fond, label, children, onPress, large,
}: {
  icone: IconName; couleur: string; fond: string; label: string;
  children: React.ReactNode; onPress?: () => void; large?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.statWrap, large && { width: '100%' }]}>
      <Card style={styles.stat}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: fond }]}>
            <FontAwesome5 name={icone} size={14} color={couleur} />
          </View>
          <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
        </View>
        {children}
      </Card>
    </Pressable>
  );
}

function SectionHeader({ icone, titre, onVoirTout }: { icone: IconName; titre: string; onVoirTout?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <FontAwesome5 name={icone} size={15} color={colors.primary} />
        <Text style={styles.sectionTitle}>{titre}</Text>
      </View>
      {onVoirTout && (
        <Pressable onPress={onVoirTout} hitSlop={8}>
          <Text style={styles.viewAll}>Voir tous ›</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Tableau de bord de l'utilisateur : une seule requête serveur (/api/mobile/user/accueil/). */
export function AccueilUtilisateur() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [detailsOuverts, setDetailsOuverts] = useState(false);
  const accueil = useQuery({ queryKey: ['accueil'], queryFn: fetchAccueil });
  const projet = useQuery({
    queryKey: ['projet'],
    queryFn: fetchMonProjet,
    enabled: detailsOuverts,
  });

  if (accueil.isLoading) return <Loading />;
  if (accueil.error || !accueil.data) {
    return <ErrorState message={getErrorMessage(accueil.error)} onRetry={() => void accueil.refetch()} />;
  }
  const a = accueil.data;
  const progression = Math.min(100, a.projet?.progression ?? 0);

  async function actualiser() {
    const resultat = await accueil.refetch();
    if (resultat.data) await setUser(resultat.data.utilisateur);
    await queryClient.invalidateQueries({ queryKey: ['compteurs'] });
  }

  return (
    <Screen withTopInset title="Tableau de Bord" refreshing={accueil.isRefetching} onRefresh={() => void actualiser()}>
      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={styles.welcome}>
            Bienvenue, <Text style={{ color: colors.primary }}>{a.utilisateur.prenom}</Text> !
          </Text>
          <Text style={styles.welcomeText}>
            Suivez vos activités et restez informé des derniers événements de l'incubateur.
          </Text>
        </View>
        <Button title="Nouvelle Requête" icon="paper-plane" onPress={() => router.push('/requetes/nouvelle')} />
      </Card>

      <View style={styles.grid}>
        <StatCard icone="calendar-check" couleur={colors.info} fond={colors.infoSoft} label="Événements à venir"
          onPress={() => router.push('/evenements')}>
          <Text style={styles.statValue}>{a.evenements_a_venir_total}</Text>
        </StatCard>
        <StatCard icone="paper-plane" couleur={colors.success} fond={colors.successSoft} label="Requêtes Envoyées"
          onPress={() => router.push('/requetes')}>
          <Text style={styles.statValue}>{a.requetes_total}</Text>
        </StatCard>
        <StatCard icone="reply-all" couleur={colors.warning} fond={colors.warningSoft} label="Requêtes en Attente"
          onPress={() => router.push('/requetes')}>
          <Text style={styles.statValue}>{a.requetes_en_attente}</Text>
        </StatCard>
        <StatCard icone="bell" couleur={colors.danger} fond={colors.dangerSoft} label="Notifications"
          onPress={() => router.push('/notifications')}>
          <Text style={styles.statValue}>{a.notifications_non_lues}</Text>
        </StatCard>
        <StatCard large icone="lightbulb" couleur={colors.primary} fond={colors.primarySoft} label="Projet en cours">
          <Text style={styles.statProject} numberOfLines={1}>{a.projet ? a.projet.intitule : 'Aucun projet'}</Text>
        </StatCard>
      </View>

      {a.projet && (
        <Card style={{ gap: spacing.md }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <FontAwesome5 name="chart-line" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>Suivi de mon projet</Text>
            </View>
            <Pressable onPress={() => setDetailsOuverts(true)} style={styles.detailsBtn}>
              <FontAwesome5 name="eye" size={12} color="#fff" />
              <Text style={styles.detailsBtnText}>Détails</Text>
            </Pressable>
          </View>
          <View style={styles.projectRow}>
            <View style={styles.rocket}><FontAwesome5 name="rocket" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectName} numberOfLines={1}>{a.projet.intitule}</Text>
              {!!a.projet.theme && <Text style={styles.projectTheme}>{a.projet.theme}</Text>}
              <View style={styles.progressRow}>
                <View style={styles.track}>
                  <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 12, width: `${progression}%` }} />
                </View>
                <Text style={styles.progressLabel}>{progression}%</Text>
              </View>
              <Text style={styles.projectNote}>Avancement mis à jour par l'équipe de l'incubateur</Text>
            </View>
          </View>
        </Card>
      )}

      <SectionHeader icone="calendar-alt" titre="Événements à venir" onVoirTout={() => router.push('/evenements')} />
      {a.evenements_a_venir.length === 0
        ? <Text style={styles.vide}>Aucun événement à venir.</Text>
        : a.evenements_a_venir.map((e) => <EvenementRow key={e.id} evenement={e} />)}

      <SectionHeader icone="paper-plane" titre="Mes dernières requêtes" onVoirTout={() => router.push('/requetes')} />
      {a.requetes_recentes.length === 0
        ? <Text style={styles.vide}>Vous n'avez envoyé aucune requête.</Text>
        : a.requetes_recentes.map((r) => <RequeteRow key={r.id} requete={r} />)}

      <SectionHeader icone="bell" titre="Notifications récentes" onVoirTout={() => router.push('/notifications')} />
      {a.notifications_recentes.length === 0
        ? <Text style={styles.vide}>Aucune notification.</Text>
        : a.notifications_recentes.map((n) => <NotificationRow key={n.id} notification={n} />)}

      <ProjetModal projet={projet.data} chargement={projet.isLoading} visible={detailsOuverts}
        onClose={() => setDetailsOuverts(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { fontSize: 22, fontWeight: '800', color: colors.text },
  welcomeText: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statWrap: { width: '47.5%', flexGrow: 1 },
  stat: { gap: spacing.md, padding: spacing.md },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statLabel: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  statProject: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  viewAll: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  detailsBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  projectRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  rocket: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center' },
  projectName: { fontSize: 16, fontWeight: '700', color: colors.text },
  projectTheme: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
  progressLabel: { fontSize: 14, fontWeight: '700', color: colors.primary, minWidth: 40, textAlign: 'right' },
  projectNote: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  vide: { color: colors.textMuted, fontSize: 14 },
});
