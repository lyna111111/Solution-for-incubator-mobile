import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { adminEnvoyer, adminGet } from '@/admin/api';
import { FormulaireAdmin, ChoixPuces } from '@/admin/ui';
import { TYPES_DOCUMENT } from '@/admin/modules';
import { getErrorMessage } from '@/api/client';
import { DocumentsList } from '@/components/DocumentLink';
import { StatutBadge } from '@/components/rows';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, ErrorState, Loading, SectionTitle } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

const STATUTS = ['Traitée', 'Rejetée', 'En attente'];

export default function DetailRequeteAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const estPrincipal = useAuthStore((s) => s.user?.type === 'Admin principal');
  const [message, setMessage] = useState('');
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'requetes', 'detail', id],
    queryFn: () => adminGet(`requetes/${id}/`),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const r = data.requete;

  async function apres() {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function repondre(valeurs: Record<string, any>, fichiers: any[]) {
    await adminEnvoyer('post', `requetes/${id}/repondre/`, valeurs, fichiers);
    await apres();
    setMessage('Réponse envoyée.');
  }

  async function changerStatut(statut: string) {
    try {
      await adminEnvoyer('post', `requetes/${id}/statut/`, { status: statut });
      await apres();
    } catch (e) {
      Alert.alert('Changement impossible', getErrorMessage(e));
    }
  }

  function supprimer() {
    Alert.alert('Suppression', 'Supprimer cette requête et ses réponses ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await adminEnvoyer('delete', `requetes/${id}/`); await apres(); router.back(); }
        catch (e) { Alert.alert('Suppression impossible', getErrorMessage(e)); }
      } },
    ]);
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: 'Détail de la requête' }} />
      <Text style={styles.titre}>{r.objet}</Text>
      <View style={styles.ligne}>
        <StatutBadge statut={r.statut} />
        <Text style={styles.meta}>{r.type_requete} · {formatDateTime(r.dateSoumission)}</Text>
      </View>
      <Text style={styles.meta}>
        De : {r.utilisateur ? `${r.utilisateur.nom} (${r.utilisateur.email})` : 'visiteur non inscrit'}
      </Text>

      <Card style={{ gap: spacing.md }}>
        <Text style={styles.corps}>{r.contenu}</Text>
        <DocumentsList documents={r.documents} />
      </Card>

      <SectionTitle icon="reply">Réponses ({r.reponses.length})</SectionTitle>
      {r.reponses.map((rep: any) => (
        <Card key={rep.id} style={{ backgroundColor: colors.primarySoft, gap: spacing.sm }}>
          <Text style={styles.auteur}>{rep.administrateur}</Text>
          <Text style={styles.meta}>{formatDateTime(rep.dateSoumission)}</Text>
          <Text style={styles.corps}>{rep.contenu}</Text>
          <DocumentsList documents={rep.documents} />
        </Card>
      ))}

      {r.utilisateur && (
        <>
          <SectionTitle icon="paper-plane">Répondre</SectionTitle>
          {!!message && <Banner type="success" message={message} />}
          <FormulaireAdmin
            key={r.reponses.length}
            mode="creation"
            libelle="Envoyer la réponse"
            champs={[
              { nom: 'contenu', label: 'Votre réponse', type: 'textarea', requis: true },
              { nom: 'status', label: 'Nouveau statut', type: 'choix', options: STATUTS },
              { nom: 'document_type', label: 'Type du document joint', type: 'choix', options: TYPES_DOCUMENT },
              { nom: 'attachments', label: 'Pièces jointes', type: 'fichiers', multiple: true },
            ]}
            valeursInitiales={{ status: 'Traitée' }}
            onSubmit={repondre}
          />
        </>
      )}

      {estPrincipal && (
        <>
          <SectionTitle icon="exchange-alt">Changer le statut (Admin principal)</SectionTitle>
          <ChoixPuces options={STATUTS} valeur={r.status} onChoisir={(s) => void changerStatut(s)} />
        </>
      )}

      <Button title="Supprimer la requête" variant="danger" onPress={supprimer} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titre: { fontSize: 22, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.textMuted },
  corps: { fontSize: 16, color: colors.text, lineHeight: 24 },
  auteur: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
});
