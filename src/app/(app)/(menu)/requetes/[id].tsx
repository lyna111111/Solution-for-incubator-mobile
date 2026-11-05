import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchRequete } from '@/api/endpoints';
import { DocumentsList } from '@/components/DocumentLink';
import { StatutBadge } from '@/components/rows';
import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading, SectionTitle, Libelle } from '@/components/ui';
import { useT } from '@/i18n';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function DetailRequete() {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['requete', id],
    queryFn: () => fetchRequete(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title}>{data.objet}</Text>
      <View style={styles.row}>
        <StatutBadge statut={data.statut} />
        <Text style={styles.meta}>
          {t(data.type_requete)} · {formatDateTime(data.dateSoumission)}
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Libelle>{t('Votre message')}</Libelle>
        <Text style={styles.body}>{data.contenu}</Text>
        <DocumentsList documents={data.documents} />
      </Card>

      <SectionTitle icon="reply">{t('Réponses ({n})', { n: data.reponses.length })}</SectionTitle>
      {data.reponses.length === 0 ? (
        <Text style={styles.meta}>{t('Aucune réponse pour le moment.')}</Text>
      ) : (
        data.reponses.map((r) => (
          <Card key={r.id} style={{ backgroundColor: colors.primarySoft, gap: spacing.sm }}>
            <Text style={styles.author}>{r.administrateur}</Text>
            <Text style={styles.meta}>{formatDateTime(r.dateSoumission)}</Text>
            <Text style={styles.body}>{r.contenu}</Text>
            <DocumentsList documents={r.documents} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
  author: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
});
