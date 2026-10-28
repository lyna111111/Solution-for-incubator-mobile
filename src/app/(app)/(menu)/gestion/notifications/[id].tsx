import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { adminEnvoyer, adminGet } from '@/admin/api';
import type { ChampDef } from '@/admin/types';
import { FormulaireAdmin } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { Dialogue } from '@/components/Dialogue';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, ErrorState, Loading } from '@/components/ui';
import { type Palette, spacing, useStyles } from '@/theme';

export default function DetailNotificationAdmin() {
  const styles = useStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: n, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'notifications', 'detail', id],
    queryFn: () => adminGet(`notifications/${id}/`),
  });

  if (isLoading) return <Loading />;
  if (error || !n) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  // Seules les notifications « Incubateur » se modifient (celles créées depuis l'écran de gestion).
  const modifiable = n.type === 'Incubateur' && (n.mode === 'Broadcast' || n.mode === 'Unicast');
  const unicast = n.mode === 'Unicast';
  const champs: ChampDef[] = [
    { nom: 'titre', label: 'Titre', type: 'text', requis: true },
    { nom: 'message', label: 'Message', type: 'textarea', requis: true },
    ...(unicast ? [{ nom: 'destinataire', label: 'Destinataire', type: 'utilisateur', source: 'notifications/destinataires/', requis: true } as ChampDef] : []),
  ];

  async function apres() {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function enregistrer(valeurs: Record<string, any>) {
    await adminEnvoyer('put', `notifications/${unicast ? 'unicast' : 'broadcast'}/${id}/`, valeurs);
    await apres();
    router.back();
  }

  function supprimer() {
    Dialogue.alert('Suppression', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await adminEnvoyer('delete', `notifications/${id}/`); await apres(); router.back(); }
        catch (e) { Dialogue.alert('Suppression impossible', getErrorMessage(e)); }
      } },
    ], { ton: 'danger', icone: 'trash-alt' });
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: 'Notification' }} />
      <Text style={styles.meta}>{n.type} · {n.mode}{n.destinataire ? ` · ${n.destinataire}` : ''} · {n.created_at}</Text>
      {typeof n.read_percentage === 'number' && (
        <Text style={styles.meta}>Lue par {n.views} utilisateur(s) ({n.read_percentage} %)</Text>
      )}
      {modifiable ? (
        <FormulaireAdmin
          champs={champs}
          mode="modification"
          libelle="Enregistrer"
          valeursInitiales={{ titre: n.titre, message: n.message ?? '', destinataire: n.destinataire_id ?? '' }}
          onSubmit={enregistrer}
        />
      ) : (
        <>
          <Banner type="info" message="Cette notification est automatique : elle ne peut pas être modifiée, seulement supprimée." />
          <Card>
            <Text style={styles.titre}>{n.titre}</Text>
            <Text style={styles.corps}>{n.message}</Text>
          </Card>
        </>
      )}
      <Button title="Supprimer" variant="danger" onPress={supprimer} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  meta: { fontSize: 13, color: colors.textMuted },
  titre: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  corps: { fontSize: 16, color: colors.text, lineHeight: 24 },
});
