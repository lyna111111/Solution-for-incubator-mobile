import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchArticles } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorState, Field, Loading } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function Articles() {
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['articles', recherche, page],
    queryFn: () => fetchArticles(recherche, page),
    placeholderData: (precedent) => precedent,
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Field
        label="Rechercher"
        icon="search"
        value={saisie}
        onChangeText={setSaisie}
        onSubmitEditing={() => { setRecherche(saisie.trim()); setPage(1); }}
        returnKeyType="search"
        placeholder="Titre ou auteur..."
      />

      {data.articles.length === 0 ? (
        <Text style={styles.empty}>Aucun article trouvé.</Text>
      ) : (
        data.articles.map((a) => (
          <Pressable key={a.id} onPress={() => router.push(`/articles/${a.id}`)}>
            <Card style={{ gap: 4 }}>
              <Text style={styles.title}>{a.titre}</Text>
              <Text style={styles.meta}>{a.auteur} · {a.created_at}</Text>
            </Card>
          </Pressable>
        ))
      )}

      {data.lastPage > 1 && (
        <View style={styles.pager}>
          <Button title="‹ Précédent" variant="secondary" disabled={!data.hasPrevious} onPress={() => setPage(page - 1)} style={{ flex: 1 }} />
          <Text style={styles.meta}>{data.currentPage} / {data.lastPage}</Text>
          <Button title="Suivant ›" variant="secondary" disabled={!data.hasNext} onPress={() => setPage(page + 1)} style={{ flex: 1 }} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
