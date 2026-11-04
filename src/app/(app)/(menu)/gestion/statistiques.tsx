import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import type { IconeChamp } from '@/admin/types';
import { Barres } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { Kpi } from '@/components/DashboardUi';
import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading, SectionTitle, LigneIcone } from '@/components/ui';
import { type Palette, spacing, useColors, useStyles } from '@/theme';

const PERIODES = [
  { value: '', label: 'Global' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' },
  { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' },
];
const ENGAGEMENT = [{ value: 'semaine', label: 'Semaine' }, { value: 'mois', label: 'Mois' }, { value: 'trimestre', label: 'Trimestre' }];

/** Icône d'un statut de requête (Traitée, Rejetée, En attente). */
function iconeStatut(statut: string): IconeChamp {
  const t = statut.toLowerCase();
  if (t.includes('trait')) return 'check-circle';
  if (t.includes('rejet')) return 'times-circle';
  return 'hourglass-half';
}

function Variation({ valeur }: { valeur: number }) {
  const colors = useColors();
  const positif = valeur >= 0;
  return <Text style={{ color: positif ? colors.success : colors.danger, fontWeight: '700' }}>{positif ? '▲' : '▼'} {Math.abs(valeur)} %</Text>;
}

export default function Statistiques() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const [periode, setPeriode] = useState('');
  const [engagement, setEngagement] = useState('mois');
  // Tirer-pour-actualiser demande des chiffres recalculés (le serveur garde sinon ceux des 5 dernières minutes).
  const frais = useRef(false);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'statistiques', periode],
    queryFn: () => {
      const recalcules = frais.current;
      frais.current = false;
      return adminGet('statistiques/', { ...(periode ? { periode } : {}), ...(recalcules ? { frais: 1 } : {}) });
    },
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const g = data.globales;
  const f = data.filtre;
  const eng = g.engagement[engagement];

  const cartes = [
    { label: 'Utilisateurs', valeur: g.cartes.utilisateurs, variation: g.variations.utilisateurs, icone: 'users' as const, teinte: colors.primary, fond: colors.primarySoft },
    { label: 'Requêtes traitées', valeur: g.cartes.requetes_traitees, variation: g.variations.requetes, icone: 'check-double' as const, teinte: colors.info, fond: colors.infoSoft },
    { label: 'Événements', valeur: g.cartes.evenements, variation: g.variations.evenements, icone: 'calendar-alt' as const, teinte: colors.success, fond: colors.successSoft },
    { label: 'Projets', valeur: g.cartes.projets, variation: g.variations.projets, icone: 'rocket' as const, teinte: colors.warning, fond: colors.warningSoft },
  ];

  return (
    <Screen refreshing={isRefetching} onRefresh={() => { frais.current = true; void refetch(); }}>
      <Stack.Screen options={{ title: 'Statistiques Global' }} />
      <Chips options={PERIODES} value={periode} onChange={setPeriode} />

      <View style={styles.grille}>
        {cartes.map((c) => (
          <Kpi key={c.label} icone={c.icone} couleur={c.teinte} fond={c.fond} label={c.label} valeur={c.valeur}
            pied={<Variation valeur={c.variation} />} />
        ))}
      </View>

      {f && (
        <Card style={{ gap: spacing.md }}>
          <SectionTitle icon="filter" couleur={colors.primary}>Période choisie</SectionTitle>
          <LigneIcone icone="users" couleur={colors.primary}>Nouveaux utilisateurs : <Text style={styles.gras}>{f.utilisateurs.total}</Text></LigneIcone>
          <LigneIcone icone="envelope-open-text" couleur={colors.warning}>Requêtes : <Text style={styles.gras}>{f.requetes.total}</Text></LigneIcone>
          <LigneIcone icone="calendar-alt" couleur={colors.success}>Événements : <Text style={styles.gras}>{f.evenements.total}</Text></LigneIcone>
          <Barres couleur={colors.warning} donnees={Object.entries(f.requetes.par_statut).map(([label, valeur]) => ({ label, valeur: Number(valeur), icone: iconeStatut(label) }))} />
        </Card>
      )}

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-line" couleur={colors.primary}>Croissance des utilisateurs</SectionTitle>
        <Barres donnees={g.utilisateurs_par_mois.map((m: any) => ({ label: m.month, valeur: m.monthly }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-pie" couleur={colors.info}>Répartition des utilisateurs</SectionTitle>
        <Barres couleur={colors.secondary} donnees={Object.entries(g.utilisateurs_par_type).map(([label, valeur]) => ({ label, valeur: Number(valeur), icone: 'user-tag' }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="tasks" couleur={colors.warning}>Requêtes par statut</SectionTitle>
        <Barres couleur={colors.warning} donnees={g.requetes_par_statut.map((r: any) => ({ label: r.status, valeur: r.count, icone: iconeStatut(r.status) }))} />
        <SectionTitle icon="tags" couleur={colors.warning}>Requêtes par type</SectionTitle>
        <Barres couleur={colors.warning} donnees={g.requetes_par_type.map((r: any) => ({ label: r.type_requete, valeur: r.count, icone: 'tag' }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="calendar-alt" couleur={colors.success}>Événements par mois</SectionTitle>
        <Barres couleur={colors.success} donnees={g.evenements_par_mois.map((m: any) => ({
          label: m.month, valeur: m.workshops.count + m.conferences.count + m.formations.count }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="bolt" couleur={colors.info}>Engagement des utilisateurs</SectionTitle>
        <Chips options={ENGAGEMENT} value={engagement} onChange={setEngagement} />
        <Barres couleur={colors.info} donnees={[
          { label: 'Connexions', valeur: eng.connexions, icone: 'sign-in-alt' }, { label: 'Requêtes', valeur: eng.requetes, icone: 'envelope-open-text' },
          { label: 'Participations', valeur: eng.participations, icone: 'calendar-check' }, { label: 'Projets soumis', valeur: eng.projets_soumis, icone: 'rocket' },
          { label: 'Documents', valeur: eng.documents, icone: 'file-alt' },
        ]} />
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  ligne: { fontSize: 15, color: colors.text },
  gras: { fontWeight: '800' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
