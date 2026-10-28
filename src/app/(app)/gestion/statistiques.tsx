import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import { Barres } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading, SectionTitle } from '@/components/ui';
import { type Palette, spacing, useColors, useStyles } from '@/theme';

const PERIODES = [
  { value: '', label: 'Global' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' },
  { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' },
];
const ENGAGEMENT = [{ value: 'semaine', label: 'Semaine' }, { value: 'mois', label: 'Mois' }, { value: 'trimestre', label: 'Trimestre' }];

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
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'statistiques', periode],
    queryFn: () => adminGet('statistiques/', periode ? { periode } : undefined),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const g = data.globales;
  const f = data.filtre;
  const eng = g.engagement[engagement];

  const cartes = [
    { label: 'Utilisateurs', valeur: g.cartes.utilisateurs, variation: g.variations.utilisateurs },
    { label: 'Requêtes traitées', valeur: g.cartes.requetes_traitees, variation: g.variations.requetes },
    { label: 'Événements', valeur: g.cartes.evenements, variation: g.variations.evenements },
    { label: 'Projets', valeur: g.cartes.projets, variation: g.variations.projets },
  ];

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: 'Statistiques Global' }} />
      <Chips options={PERIODES} value={periode} onChange={setPeriode} />

      {f && (
        <Card style={{ gap: spacing.md }}>
          <SectionTitle icon="filter">Période choisie</SectionTitle>
          <Text style={styles.ligne}>Nouveaux utilisateurs : <Text style={styles.gras}>{f.utilisateurs.total}</Text></Text>
          <Text style={styles.ligne}>Requêtes : <Text style={styles.gras}>{f.requetes.total}</Text></Text>
          <Text style={styles.ligne}>Événements : <Text style={styles.gras}>{f.evenements.total}</Text></Text>
          <Barres donnees={Object.entries(f.requetes.par_statut).map(([label, valeur]) => ({ label, valeur: Number(valeur) }))} />
        </Card>
      )}

      <View style={styles.grille}>
        {cartes.map((c) => (
          <Card key={c.label} style={styles.carte}>
            <Text style={styles.carteLabel}>{c.label}</Text>
            <Text style={styles.carteValeur}>{c.valeur}</Text>
            <Variation valeur={c.variation} />
          </Card>
        ))}
      </View>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-line">Croissance des utilisateurs</SectionTitle>
        <Barres donnees={g.utilisateurs_par_mois.map((m: any) => ({ label: m.month, valeur: m.monthly }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="chart-pie">Répartition des utilisateurs</SectionTitle>
        <Barres couleur={colors.secondary} donnees={Object.entries(g.utilisateurs_par_type).map(([label, valeur]) => ({ label, valeur: Number(valeur) }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="tasks">Requêtes par statut</SectionTitle>
        <Barres couleur={colors.warning} donnees={g.requetes_par_statut.map((r: any) => ({ label: r.status, valeur: r.count }))} />
        <SectionTitle icon="tags">Requêtes par type</SectionTitle>
        <Barres couleur={colors.warning} donnees={g.requetes_par_type.map((r: any) => ({ label: r.type_requete, valeur: r.count }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="calendar-alt">Événements par mois</SectionTitle>
        <Barres couleur={colors.success} donnees={g.evenements_par_mois.map((m: any) => ({
          label: m.month, valeur: m.workshops.count + m.conferences.count + m.formations.count }))} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle icon="bolt">Engagement des utilisateurs</SectionTitle>
        <Chips options={ENGAGEMENT} value={engagement} onChange={setEngagement} />
        <Barres couleur={colors.info} donnees={[
          { label: 'Connexions', valeur: eng.connexions }, { label: 'Requêtes', valeur: eng.requetes },
          { label: 'Participations', valeur: eng.participations }, { label: 'Projets soumis', valeur: eng.projets_soumis },
          { label: 'Documents', valeur: eng.documents },
        ]} />
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  ligne: { fontSize: 15, color: colors.text },
  gras: { fontWeight: '800' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  carte: { width: '47.5%', flexGrow: 1, gap: 4, padding: spacing.md },
  carteLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  carteValeur: { fontSize: 28, fontWeight: '800', color: colors.text },
});
