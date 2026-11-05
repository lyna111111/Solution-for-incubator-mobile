import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchEvenement } from '@/api/endpoints';
import { DocumentsList } from '@/components/DocumentLink';
import { iconeLibelle } from '@/components/iconeLibelle';
import { Screen } from '@/components/Screen';
import { Badge, Card, ErrorState, Loading, SectionTitle } from '@/components/ui';
import { useT } from '@/i18n';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formatDate } from '@/utils/format';

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={styles.line}>
      <View style={styles.lineEntete}>
        <FontAwesome5 name={iconeLibelle(label)} size={12} color={colors.primary} style={{ width: 16, textAlign: 'center' }} />
        <Text style={styles.lineLabel}>{label}</Text>
      </View>
      <Text style={styles.lineValue}>{valeur}</Text>
    </View>
  );
}

export default function DetailEvenement() {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['evenement', id],
    queryFn: () => fetchEvenement(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const horaire = [data.heure_debut, data.heure_fin].filter(Boolean).join(' - ');

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title}>{data.titre}</Text>
      <Badge label={t(data.type)} fond={colors.primarySoft} texte={colors.primaryDark} />

      <Card style={{ gap: spacing.md }}>
        <Ligne label={t('Date')} valeur={formatDate(data.date)} />
        {!!horaire && <Ligne label={t('Horaire')} valeur={horaire} />}
        {!!data.lieu && <Ligne label={t('Lieu')} valeur={data.lieu} />}
        {data.max_participants !== null && (
          <Ligne
            label={t('Participants')}
            valeur={`${data.participants_actuels} / ${data.max_participants}` +
              (data.places_restantes !== null ? ` (${t('{n} places restantes', { n: data.places_restantes })})` : '')}
          />
        )}
      </Card>

      {!!data.description && (
        <Card>
          <View style={[styles.lineEntete, { marginBottom: 6 }]}>
            <FontAwesome5 name="align-left" size={12} color={colors.primary} style={{ width: 16, textAlign: 'center' }} />
            <Text style={styles.lineLabel}>{t('Description')}</Text>
          </View>
          <Text style={styles.body}>{data.description}</Text>
        </Card>
      )}

      {!!data.documents?.length && (
        <>
          <SectionTitle icon="paperclip">{t('Documents')}</SectionTitle>
          <DocumentsList documents={data.documents} />
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  line: { gap: 2 },
  lineEntete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  lineValue: { fontSize: 16, color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
});
