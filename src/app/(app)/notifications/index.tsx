import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchNotifications, markAllNotificationsRead } from '@/api/endpoints';
import { Chips } from '@/components/Chips';
import { NotificationRow } from '@/components/rows';
import { Screen } from '@/components/Screen';
import { Banner, Button, ErrorState, Field, Loading } from '@/components/ui';
import { colors } from '@/theme';

// Mêmes onglets que la page Notifications du site.
const TYPES = [
  { value: 'all', label: 'Toutes' },
  { value: 'requete', label: 'Requêtes' },
  { value: 'evenement', label: 'Événements' },
  { value: 'incubateur', label: 'Incubateur' },
  { value: 'article', label: 'Articles' },
  { value: 'systeme', label: 'Système' },
];

export default function Notifications() {
  const queryClient = useQueryClient();
  const [type, setType] = useState('all');
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['notifications', type, recherche],
    queryFn: () => fetchNotifications(type, recherche),
  });

  const toutLire = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['compteurs'] });
      await queryClient.invalidateQueries({ queryKey: ['accueil'] });
    },
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const nonLues = data.filter((n) => !n.read).length;

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      {toutLire.isError && <Banner message={getErrorMessage(toutLire.error)} />}

      <Field
        label="Rechercher"
        icon="search"
        value={saisie}
        onChangeText={setSaisie}
        onSubmitEditing={() => setRecherche(saisie.trim())}
        returnKeyType="search"
        placeholder="Titre ou message..."
      />
      <Chips options={TYPES} value={type} onChange={setType} />

      {nonLues > 0 && (
        <Button
          title={`Tout marquer comme lu (${nonLues})`}
          variant="secondary"
          loading={toutLire.isPending}
          onPress={() => toutLire.mutate()}
        />
      )}

      {data.length === 0 ? (
        <Text style={styles.empty}>Aucune notification.</Text>
      ) : (
        data.map((n) => <NotificationRow key={n.id} notification={n} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
});
