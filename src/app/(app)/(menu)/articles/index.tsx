import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchArticles } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorState, Field, Loading } from '@/components/ui';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useT } from '@/i18n';
import { type Palette, spacing, useStyles } from '@/theme';

export default function Articles() {
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
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
        label={t('Rechercher')}
        icon="search"
        value={saisie}
        onChangeText={setSaisie}
        onSubmitEditing={() => { setRecherche(saisie.trim()); setPage(1); }}
        returnKeyType="search"
        placeholder={t('Titre ou auteur...')}
      />

      {data.articles.length === 0 ? (
        <Text style={styles.empty}>{t('Aucun article trouvé.')}</Text>
      ) : (
        data.articles.map((a) => (
          <Pressable key={a.id} onPress={() => ouvrir(`/articles/${a.id}`)}>
            <Card style={{ gap: 4 }}>
              <Text style={styles.title}>{a.titre}</Text>
              <Text style={styles.meta}>{a.auteur} · {a.created_at}</Text>
            </Card>
          </Pressable>
        ))
      )}

      {data.lastPage > 1 && (
        <View style={styles.pager}>
          <Button title={t('‹ Précédent')} variant="secondary" disabled={!data.hasPrevious} onPress={() => setPage(page - 1)} style={{ flex: 1 }} />
          <Text style={styles.meta}>{data.currentPage} / {data.lastPage}</Text>
          <Button title={t('Suivant ›')} variant="secondary" disabled={!data.hasNext} onPress={() => setPage(page + 1)} style={{ flex: 1 }} />
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
