import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { useT } from '@/i18n';
import { getErrorMessage } from '@/api/client';
import { fetchAccueil, fetchMonProjet } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { gradient, type Palette, spacing, useColors, useStyles } from '@/theme';

import { BandeauBienvenue, Kpi, TitreGraphique } from './DashboardUi';
import { ProjetModal } from './ProjetModal';
import { EvenementRow, NotificationRow, RequeteRow } from './rows';
import { Screen } from './Screen';
import { Button, Card, ErrorState, Loading } from './ui';

/** « PorteurDeProjet » -> « Porteur de projet » (type de compte affiché dans le bandeau de bienvenue). */
const libelleType = (type: string | undefined, t: (texte: string) => string) => {
  const brut = type ?? 'Utilisateur';
  const traduit = t(brut);
  if (traduit !== brut) return traduit;
  return brut.replace(/([a-zéè])([A-ZÉ])/g, '$1 $2').replace(/ De /g, ' de ').replace(/ Du /g, ' du ');
};

/** Tableau de bord de l'utilisateur : une seule requête serveur (/api/mobile/user/accueil/). */
export function AccueilUtilisateur() {
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
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
    <Screen withTopInset title={t('Tableau de Bord')} refreshing={accueil.isRefetching} onRefresh={() => void actualiser()}>
      <BandeauBienvenue titre={libelleType(a.utilisateur.type, t)} nom={`${a.utilisateur.prenom} ${a.utilisateur.nom}`.trim()}
        detail={a.utilisateur.incubateur?.nom} />

      <Button title={t('Nouvelle Requête')} icon="paper-plane" onPress={() => ouvrir('/requetes/nouvelle')} />

      <View style={styles.grid}>
        <Kpi icone="calendar-check" couleur={colors.info} fond={colors.infoSoft} label={t('Événements à venir')}
          valeur={a.evenements_a_venir_total} route="/evenements" />
        <Kpi icone="paper-plane" couleur={colors.success} fond={colors.successSoft} label={t('Requêtes envoyées')}
          valeur={a.requetes_total} route="/requetes" />
        <Kpi icone="reply-all" couleur={colors.warning} fond={colors.warningSoft} label={t('Requêtes en attente')}
          valeur={a.requetes_en_attente} route="/requetes" />
        <Kpi icone="bell" couleur={colors.danger} fond={colors.dangerSoft} label={t('Notifications')}
          valeur={a.notifications_non_lues} route="/notifications" />
      </View>

      {a.projet && (
        <Card style={{ gap: spacing.md }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <FontAwesome5 name="chart-line" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('Suivi de mon projet')}</Text>
            </View>
            <Pressable onPress={() => setDetailsOuverts(true)} style={styles.detailsBtn}>
              <FontAwesome5 name="eye" size={12} color="#fff" />
              <Text style={styles.detailsBtnText}>{t('Détails')}</Text>
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
              <Text style={styles.projectNote}>{t("Avancement mis à jour par l'équipe de l'incubateur")}</Text>
            </View>
          </View>
        </Card>
      )}

      <TitreGraphique icone="calendar-alt" couleur={colors.info} titre={t('Événements à venir')} route="/evenements" />
      {a.evenements_a_venir.length === 0
        ? <Text style={styles.vide}>{t('Aucun événement à venir.')}</Text>
        : a.evenements_a_venir.map((e) => <EvenementRow key={e.id} evenement={e} />)}

      <TitreGraphique icone="paper-plane" couleur={colors.success} titre={t('Mes dernières requêtes')} route="/requetes" />
      {a.requetes_recentes.length === 0
        ? <Text style={styles.vide}>{t("Vous n'avez envoyé aucune requête.")}</Text>
        : a.requetes_recentes.map((r) => <RequeteRow key={r.id} requete={r} />)}

      <TitreGraphique icone="bell" couleur={colors.danger} titre={t('Notifications récentes')} route="/notifications" />
      {a.notifications_recentes.length === 0
        ? <Text style={styles.vide}>{t('Aucune notification.')}</Text>
        : a.notifications_recentes.map((n) => <NotificationRow key={n.id} notification={n} />)}

      <ProjetModal projet={projet.data} chargement={projet.isLoading} visible={detailsOuverts}
        onClose={() => setDetailsOuverts(false)} />
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
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
