import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchEvenements } from '@/api/endpoints';
import { Calendrier } from '@/components/Calendrier';
import { Chips } from '@/components/Chips';
import { EvenementRow } from '@/components/rows';
import { Screen } from '@/components/Screen';
import { ErrorState, Loading } from '@/components/ui';
import { colors } from '@/theme';

// Mêmes valeurs que le filtre « Type d'événement » du site.
const TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Conference', label: 'Conférence' },
  { value: 'Seminaire', label: 'Séminaire' },
  { value: 'Formation', label: 'Formation' },
  { value: 'Autre', label: 'Autre' },
];

export default function Evenements() {
  const maintenant = new Date();
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [mois, setMois] = useState(maintenant.getMonth() + 1); // 1-12 comme le serveur
  const [jour, setJour] = useState<number | null>(null);
  const [type, setType] = useState('all');

  // Le serveur filtre par mois et par type : le filtre s'applique aussi au calendrier, comme sur le site.
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['evenements', annee, mois, type],
    queryFn: () => fetchEvenements(annee, mois, type),
  });

  const joursAvecEvenement = useMemo(() => new Set(Object.keys(data?.jours ?? {}).map(Number)), [data]);
  const liste = useMemo(
    () => (data?.evenements ?? []).filter((e) => jour === null || Number(e.date.slice(8, 10)) === jour),
    [data, jour],
  );

  function changerMois(delta: number) {
    const d = new Date(annee, mois - 1 + delta, 1);
    setAnnee(d.getFullYear());
    setMois(d.getMonth() + 1);
    setJour(null);
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Chips options={TYPES} value={type} onChange={(t) => { setType(t); setJour(null); }} />

      <Calendrier
        annee={annee}
        mois={mois - 1}
        joursAvecEvenement={joursAvecEvenement}
        jourSelectionne={jour}
        onChangerMois={changerMois}
        onSelectionnerJour={setJour}
      />

      {liste.length === 0 ? (
        <Text style={styles.empty}>
          <FontAwesome5 name="calendar" size={14} color={colors.textMuted} />{' '}
          {jour !== null ? 'Aucun événement ce jour-là.' : 'Aucun événement ce mois-ci.'}
        </Text>
      ) : (
        liste.map((e) => <EvenementRow key={e.id} evenement={e} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
});
