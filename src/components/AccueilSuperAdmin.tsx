import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { adminGet } from '@/admin/api';
import { getErrorMessage } from '@/api/client';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

import { Kpi, TitreGraphique } from './DashboardUi';
import { Anneau, Histogramme } from './Graphiques';
import { Screen } from './Screen';
import { Badge, Card, ErrorState, Loading } from './ui';

const espacer = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** "2026-10-28T09:15:00Z" -> "28/10/2026" (filtre `date:"d/m/Y"` du site). */
function jourMoisAnnee(iso: string): string {
  const [annee, mois, jour] = iso.slice(0, 10).split('-');
  return `${jour}/${mois}/${annee}`;
}

/** Tableau de bord du Super Admin : reprend `templates/superadmin/dashboard.html` du site. */
export function AccueilSuperAdmin() {
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'super-dashboard'],
    queryFn: () => adminGet('dashboard/', undefined, 'superadmin'),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen withTopInset title="Tableau de bord" refreshing={isRefetching} onRefresh={() => void refetch()}>
      <View style={styles.grille}>
        <Kpi icone="building" couleur={colors.primary} fond={colors.primarySoft} label="Total Incubateurs"
          valeur={data.total_incubateurs} route="/incubateurs" />
        <Kpi icone="check-circle" couleur={colors.success} fond={colors.successSoft} label="Incubateurs Actifs"
          valeur={data.incubateurs_actifs} route="/incubateurs?statut=actif" />
        <Kpi icone="coins" couleur={colors.warning} fond={colors.warningSoft} label="Revenus Mensuels"
          valeur={espacer(data.revenus_mois)} unite="DA" route="/paiements?statut=completed" />
        <Kpi icone="exclamation-triangle" couleur={colors.danger} fond={colors.dangerSoft} label="Abonnements Expirés"
          valeur={data.abonnements_annules} route="/abonnements?statut=annule" />
      </View>

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="chart-pie" couleur={colors.primary} titre="Répartition des Plans"
          indice="Cliquez sur un plan pour voir les abonnements correspondants" />
        {data.plans.length === 0
          ? <Text style={styles.vide}>Aucun abonnement.</Text>
          : (
            <Anneau
              // `cle` = nom en minuscules (filtre « plan » du serveur) ; reconstruite si un ancien serveur ne l'envoie pas.
              parts={data.plans.map((p: any) => ({ cle: p.cle ?? String(p.nom).trim().toLowerCase(), label: p.nom, valeur: p.n, couleur: p.couleur }))}
              onSelect={(p) => ouvrir({ pathname: '/abonnements', params: { plan: p.cle } })}
            />
          )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <TitreGraphique icone="chart-bar" couleur={colors.secondary} titre="Revenus Mensuels (6 derniers mois)"
          indice="Cliquez sur un mois pour voir les paiements correspondants" />
        <Histogramme
          barres={data.revenus.map((r: any) => ({ cle: r.cle, label: r.libelle, valeur: r.total }))}
          onSelect={(b) => ouvrir({ pathname: '/paiements', params: { statut: 'completed', mois: b.cle } })}
        />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.entete}>
          <View style={[styles.titreLigne, { flex: 1 }]}>
            <FontAwesome5 name="clock" size={15} color={colors.textMuted} />
            <Text style={styles.titre} numberOfLines={2}>Derniers Incubateurs Créés</Text>
          </View>
          <Pressable onPress={() => ouvrir('/incubateurs')} style={styles.voirTout} hitSlop={8}>
            <Text style={styles.voirToutTexte}>Voir tout</Text>
            <FontAwesome5 name="arrow-right" size={11} color={colors.text} />
          </Pressable>
        </View>
        {data.derniers_incubateurs.length === 0 && <Text style={styles.vide}>Aucun incubateur enregistré</Text>}
        {data.derniers_incubateurs.map((i: any) => (
          <Pressable key={i.id} onPress={() => ouvrir(`/incubateurs/${i.id}`)} style={styles.incubateur}>
            <View style={[styles.avatar, { backgroundColor: i.couleur }]}>
              <Text style={styles.avatarTexte}>{String(i.nom).charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.nom} numberOfLines={1}>{i.nom}</Text>
              {!!i.slug && <Text style={styles.slug} numberOfLines={1}>{i.slug}</Text>}
              <Text style={styles.date}>Créé le {jourMoisAnnee(i.created_at)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Badge label={i.plan_display} fond={colors.primarySoft} texte={colors.primaryDark} />
              <Badge label={i.actif ? 'Actif' : 'Inactif'} fond={i.actif ? colors.successSoft : colors.dangerSoft}
                texte={i.actif ? colors.successText : colors.dangerText} />
            </View>
          </Pressable>
        ))}
      </Card>

      <Text style={styles.pied}>© 2026 Solution for Incubator — Super Admin</Text>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  vide: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voirTout: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6,
  },
  voirToutTexte: { fontSize: 12, fontWeight: '600', color: colors.text },
  incubateur: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nom: { fontSize: 15, fontWeight: '600', color: colors.text },
  slug: { fontSize: 12, color: colors.textMuted },
  date: { fontSize: 12, color: colors.textMuted },
  pied: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
});
