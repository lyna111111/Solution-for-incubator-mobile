import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { adminGet } from '@/admin/api';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { gradient, type Palette, spacing, useColors, useStyles } from '@/theme';

import { SectionDemandes, SectionEvenements, SectionNotifications, SectionRequetes, CLE_SECTIONS } from './AccueilAdminSections';
import { BandeauBienvenue, Kpi, Pastilles, SectionCarte } from './DashboardUi';
import { Anneau, HistogrammeEmpile } from './Graphiques';
import { Screen } from './Screen';
import { ErrorState, Loading } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Couleurs des secteurs « Répartition des utilisateurs » du site (templates/dashboard/accueil.html).
const COULEURS_UTILISATEURS = ['#8a3ffc', '#00c2ff', '#10b981', '#f59e0b', '#ef4444', '#63e0ff'];

/** Tableau de bord de l'administrateur : mêmes chiffres que l'accueil du site (lus dans son cache). */
export function AccueilAdmin() {
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  // Tirer-pour-actualiser demande des chiffres recalculés (le serveur garde sinon ceux des 5 dernières minutes).
  const frais = useRef(false);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => {
      const recalcules = frais.current;
      frais.current = false;
      return adminGet('dashboard/', recalcules ? { frais: 1 } : undefined);
    },
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
  const activite: { icone: IconName; label: string; valeur?: string | null; couleur: string; fond: string; route?: string }[] = [
    { icone: 'user-plus', label: 'Dernier inscrit', valeur: data.derniers.utilisateur, couleur: colors.primary, fond: colors.primarySoft, route: lien('utilisateurs') },
    { icone: 'tasks', label: 'Dernière requête', valeur: data.derniers.requete, couleur: colors.info, fond: colors.infoSoft, route: lien('requetes') },
    { icone: 'calendar-alt', label: 'Dernier événement', valeur: data.derniers.evenement, couleur: colors.success, fond: colors.successSoft, route: lien('evenements') },
    { icone: 'file-alt', label: 'Dernier document', valeur: data.derniers.document, couleur: colors.warning, fond: colors.warningSoft, route: lien('documents') },
    { icone: 'user-shield', label: 'Dernier admin', valeur: data.derniers.administrateur, couleur: colors.danger, fond: colors.dangerSoft, route: lien('administrateurs') },
  ];

  // Seules les lignes dont la page est accessible : sans aucune, la carte « Activité récente » disparaît.
  const activiteAccessible = activite.filter((a) => a.route);

  return (
    <Screen withTopInset title="Tableau de bord" refreshing={isRefetching} onRefresh={() => { frais.current = true; void refetch(); void queryClient.invalidateQueries({ queryKey: CLE_SECTIONS }); }}>
      <BandeauBienvenue titre={(user?.type === 'Admin principal' ? 'Administrateur principal' : user?.type) ?? ''}
        nom={`${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()} detail={user?.incubateur?.nom} />

      {/* Chaque section n'est affichée que si l'administrateur a accès à la page qu'elle détaille. */}
      <View style={styles.grille}>
        {!!lien('utilisateurs') && <Kpi icone="users" couleur={colors.primary} fond={colors.primarySoft} label="Inscrits" valeur={t.utilisateurs}
          route={lien('utilisateurs')} />}
        {!!lien('requetes') && <Kpi icone="tasks" couleur={colors.info} fond={colors.infoSoft} label="Requêtes reçues" valeur={t.requetes}
          route={lien('requetes')} />}
        {!!lien('evenements') && <Kpi icone="calendar-alt" couleur={colors.success} fond={colors.successSoft} label="Événements" valeur={t.evenements}
          route={lien('evenements')} />}
        {!!lien('administrateurs') && <Kpi icone="user-shield" couleur={colors.warning} fond={colors.warningSoft} label="Staff" valeur={t.administrateurs}
          route={lien('administrateurs')} />}
      </View>

      <SectionRequetes />
      <SectionDemandes />
      <SectionEvenements />

      {!!lien('utilisateurs') && (
        <SectionCarte icone="chart-pie" couleur={colors.primary} titre="Répartition des utilisateurs" route={lien('utilisateurs')}>
          <Anneau parts={data.repartition_utilisateurs.map((r: any, i: number) => ({
            cle: r.type, label: r.libelle, valeur: r.total, couleur: COULEURS_UTILISATEURS[i % COULEURS_UTILISATEURS.length] }))} />
        </SectionCarte>
      )}

      {!!lien('evenements') && (
        <SectionCarte icone="calendar-check" couleur={colors.secondary} titre="Événements par trimestre" route={lien('evenements')}>
          <HistogrammeEmpile
            series={[
              { label: 'Workshops', couleur: '#8a3ffc' }, { label: 'Conférences', couleur: '#00c2ff' }, { label: 'Formations', couleur: '#10b981' },
            ]}
            barres={trimestres.labels.map((label: string, i: number) => ({
              cle: label, label, valeurs: [trimestres.workshops[i], trimestres.conferences[i], trimestres.formations[i]] }))}
          />
        </SectionCarte>
      )}

      {!!lien('documents') && (
        <SectionCarte icone="file-alt" couleur={colors.success} titre="Documents" route={lien('documents')}>
          <Pastilles valeurs={documents} />
        </SectionCarte>
      )}

      {!!lien('projets') && data.top_projets.length > 0 && (
        <SectionCarte icone="rocket" couleur={colors.primary} titre="Progression des projets clés" route={lien('projets')}>
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
        </SectionCarte>
      )}

      <SectionNotifications />

      {activiteAccessible.length > 0 && (
        <SectionCarte icone="history" couleur={colors.textMuted} titre="Activité récente" route={lien('statistiques')}>
          {activiteAccessible.every((a) => !a.valeur) && <Text style={styles.vide}>Aucune activité pour le moment.</Text>}
          {activiteAccessible.filter((a) => a.valeur).map((a) => (
            <Pressable key={a.label} onPress={() => ouvrir(a.route!)} style={styles.activite}>
              <View style={[styles.activiteIcone, { backgroundColor: a.fond }]}><FontAwesome5 name={a.icone} size={13} color={a.couleur} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activiteLabel}>{a.label}</Text>
                <Text style={styles.activiteValeur} numberOfLines={2}>{a.valeur}</Text>
              </View>
            </Pressable>
          ))}
        </SectionCarte>
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  projet: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  pourcentage: { fontSize: 13, fontWeight: '700', color: colors.primary },
  piste: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  activite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activiteIcone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activiteLabel: { fontSize: 12, color: colors.textMuted },
  activiteValeur: { fontSize: 14, fontWeight: '600', color: colors.text },
  vide: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
