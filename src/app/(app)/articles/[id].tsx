import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchArticle } from '@/api/endpoints';
import { DocumentLink } from '@/components/DocumentLink';
import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading } from '@/components/ui';
import { type Palette, useStyles } from '@/theme';
import { formatDate } from '@/utils/format';

export default function DetailArticle() {
  const styles = useStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title}>{data.titre}</Text>
      <Text style={styles.meta}>
        {data.auteur} · {formatDate(data.created_at)}
      </Text>
      <Card>
        <Text style={styles.body}>{data.contenu}</Text>
      </Card>
      {data.document && <DocumentLink document={data.document} />}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
});
