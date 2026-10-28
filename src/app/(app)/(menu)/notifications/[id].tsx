import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchNotification, markNotificationRead } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { Badge, Card, ErrorState, Loading } from '@/components/ui';
import { type Palette, useColors, useStyles } from '@/theme';

export default function DetailNotification() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => fetchNotification(Number(id)),
  });

  // Ouvrir une notification la marque comme lue.
  const dejaLue = data?.read;
  useEffect(() => {
    if (!data || dejaLue) return;
    markNotificationRead(data.id)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['notifications'] }),
          queryClient.invalidateQueries({ queryKey: ['compteurs'] }),
          queryClient.invalidateQueries({ queryKey: ['accueil'] }),
        ]),
      )
      .catch(() => {
        // pas bloquant : la notification restera simplement « non lue »
      });
  }, [data, dejaLue, queryClient]);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title}>{data.titre}</Text>
      <Badge label={data.type} fond={colors.primarySoft} texte={colors.primaryDark} />
      <Text style={styles.meta}>{data.created_at}</Text>
      <Card>
        <Text style={styles.body}>{data.message || 'Aucun détail.'}</Text>
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
});
