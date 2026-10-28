import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchEvenement } from '@/api/endpoints';
import { DocumentsList } from '@/components/DocumentLink';
import { Screen } from '@/components/Screen';
import { Badge, Card, ErrorState, Loading, SectionTitle } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{valeur}</Text>
    </View>
  );
}

export default function DetailEvenement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['evenement', id],
    queryFn: () => fetchEvenement(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const horaire = [data.heure_debut, data.heure_fin].filter(Boolean).join(' - ');

  return (
    <Screen>
      <Text style={styles.title}>{data.titre}</Text>
      <Badge label={data.type} fond={colors.primarySoft} texte={colors.primaryDark} />

      <Card style={{ gap: spacing.md }}>
        <Ligne label="Date" valeur={formatDate(data.date)} />
        {!!horaire && <Ligne label="Horaire" valeur={horaire} />}
        {!!data.lieu && <Ligne label="Lieu" valeur={data.lieu} />}
        {data.max_participants !== null && (
          <Ligne
            label="Participants"
            valeur={`${data.participants_actuels} / ${data.max_participants}` +
              (data.places_restantes !== null ? ` (${data.places_restantes} places restantes)` : '')}
          />
        )}
      </Card>

      {!!data.description && (
        <Card>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.body}>{data.description}</Text>
        </Card>
      )}

      {!!data.documents?.length && (
        <>
          <SectionTitle icon="paperclip">Documents</SectionTitle>
          <DocumentsList documents={data.documents} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  line: { gap: 2 },
  lineLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  lineValue: { fontSize: 16, color: colors.text },
  sectionLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
});
