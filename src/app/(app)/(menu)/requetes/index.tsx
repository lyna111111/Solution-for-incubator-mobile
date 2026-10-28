import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchRequetes } from '@/api/endpoints';
import { Chips } from '@/components/Chips';
import { RequeteRow } from '@/components/rows';
import { Screen } from '@/components/Screen';
import { Button, ErrorState, Field, Loading } from '@/components/ui';
import { type Palette, spacing, useStyles } from '@/theme';

type Filtre = 'all' | 'pending' | 'delivered' | 'canceled';

export default function MesRequetes() {
  const styles = useStyles(createStyles);
  const [filtre, setFiltre] = useState<Filtre>('all');
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);

  // Filtre, recherche et pagination sont appliqués par le serveur (comme sur le site).
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['requetes', filtre, recherche, page],
    queryFn: () => fetchRequetes(filtre, recherche, page),
    placeholderData: (precedent) => precedent,
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const c = data.compteurs;
  const p = data.pagination;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Button title="Nouvelle requête" icon="plus" onPress={() => router.push('/requetes/nouvelle')} />

      <Field
        label="Rechercher dans mes requêtes"
        icon="search"
        value={saisie}
        onChangeText={setSaisie}
        onSubmitEditing={() => { setRecherche(saisie.trim()); setPage(1); }}
        returnKeyType="search"
        maxLength={100}
        placeholder="Sujet..."
      />

      <Chips<Filtre>
        options={[
          { value: 'all', label: `Toutes (${c.total})` },
          { value: 'pending', label: `En attente (${c.en_attente})` },
          { value: 'delivered', label: `Traitées (${c.traitees})` },
          { value: 'canceled', label: `Rejetées (${c.rejetees})` },
        ]}
        value={filtre}
        onChange={(f) => { setFiltre(f); setPage(1); }}
      />

      {data.requetes.length === 0 ? (
        <Text style={styles.empty}>Aucune requête à afficher.</Text>
      ) : (
        data.requetes.map((r) => <RequeteRow key={r.id} requete={r} />)
      )}

      {p.nb_pages > 1 && (
        <View style={styles.pager}>
          <Button title="‹ Précédent" variant="secondary" disabled={!p.a_precedent} onPress={() => setPage(page - 1)} style={{ flex: 1 }} />
          <Text style={styles.pageInfo}>{p.page} / {p.nb_pages}</Text>
          <Button title="Suivant ›" variant="secondary" disabled={!p.a_suivant} onPress={() => setPage(page + 1)} style={{ flex: 1 }} />
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pageInfo: { color: colors.textMuted, fontSize: 14 },
});
