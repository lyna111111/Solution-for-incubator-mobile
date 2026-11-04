import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adminEnvoyer, adminGet } from '@/admin/api';
import { FormulaireAdmin, ChoixPuces } from '@/admin/ui';
import { TYPES_DOCUMENT } from '@/admin/modules';
import { getErrorMessage } from '@/api/client';
import { useReculer } from '@/hooks/useReculer';
import { DocumentsList } from '@/components/DocumentLink';
import { StatutBadge } from '@/components/rows';
import { Dialogue } from '@/components/Dialogue';
import { Screen } from '@/components/Screen';
import { Badge, Banner, Button, Card, ErrorState, Loading, SectionTitle } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';
import { formatDateTime } from '@/utils/format';

const STATUTS = ['Traitée', 'Rejetée', 'En attente'];

/** « Lyes Amrani » -> « LA » (pastille de l'expéditeur). */
function initiales(nom: string): string {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase() || '?';
}

export default function DetailRequeteAdmin() {
  const reculer = useReculer();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const estPrincipal = useAuthStore((s) => s.user?.type === 'Admin principal');
  const [message, setMessage] = useState('');
  // Le formulaire de réponse n'apparaît qu'après un clic sur « Répondre ».
  const [reponseOuverte, setReponseOuverte] = useState(false);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'requetes', 'detail', id],
    queryFn: () => adminGet(`requetes/${id}/`),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const r = data.requete;
  const expediteur: string = r.utilisateur?.nom ?? 'Visiteur non inscrit';

  async function apres() {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function repondre(valeurs: Record<string, any>, fichiers: any[]) {
    await adminEnvoyer('post', `requetes/${id}/repondre/`, valeurs, fichiers);
    await apres();
    setMessage('Réponse envoyée.');
    setReponseOuverte(false);
  }

  async function changerStatut(statut: string) {
    try {
      await adminEnvoyer('post', `requetes/${id}/statut/`, { status: statut });
      await apres();
    } catch (e) {
      Dialogue.alert('Changement impossible', getErrorMessage(e));
    }
  }

  function supprimer() {
    Dialogue.alert('Suppression', 'Supprimer cette requête et ses réponses ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await adminEnvoyer('delete', `requetes/${id}/`); await apres(); reculer(); }
        catch (e) { Dialogue.alert('Suppression impossible', getErrorMessage(e)); }
      } },
    ], { ton: 'danger', icone: 'trash-alt' });
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: 'Détail de la requête' }} />

      {/* Le message tel que la personne l'a envoyé : qui, quand, sujet puis texte dans une bulle lisible. */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.expediteur}>
          <View style={styles.avatar}><Text style={styles.avatarTexte}>{initiales(expediteur)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.auteur} numberOfLines={1}>{expediteur}</Text>
            <Text style={styles.meta} numberOfLines={1}>{r.utilisateur?.email ?? 'Pas de compte dans l\'application'}</Text>
          </View>
          <StatutBadge statut={r.statut} />
        </View>

        <View style={styles.separateur} />

        <Text style={styles.etiquette}>Objet</Text>
        <Text style={styles.titre}>{r.objet}</Text>
        <View style={styles.ligne}>
          <Badge label={r.type_requete} fond={colors.primarySoft} texte={colors.primaryDark} />
          <View style={styles.date}>
            <FontAwesome5 name="clock" size={12} color={colors.textMuted} />
            <Text style={styles.meta}>Reçue le {formatDateTime(r.dateSoumission)}</Text>
          </View>
        </View>

        <Text style={styles.etiquette}>Message</Text>
        <View style={styles.bulle}>
          <Text style={styles.corps} selectable>{r.contenu}</Text>
        </View>
        <DocumentsList documents={r.documents} />
      </Card>

      {!!message && <Banner type="success" message={message} />}

      {r.utilisateur ? (
        reponseOuverte ? (
          <>
            <SectionTitle icon="paper-plane">Votre réponse à {expediteur}</SectionTitle>
            <FormulaireAdmin
              key={r.reponses.length}
              mode="creation"
              libelle="Envoyer la réponse"
              champs={[
                { nom: 'contenu', label: 'Votre réponse', type: 'textarea', requis: true, icone: 'comment-dots' },
                { nom: 'status', label: 'Nouveau statut', type: 'choix', options: STATUTS },
                { nom: 'document_type', label: 'Type du document joint', type: 'choix', options: TYPES_DOCUMENT },
                { nom: 'attachments', label: 'Pièces jointes', type: 'fichiers', multiple: true },
              ]}
              valeursInitiales={{ status: 'Traitée' }}
              onSubmit={repondre}
            />
            <Button title="Annuler" variant="secondary" icon="times" onPress={() => setReponseOuverte(false)} />
          </>
        ) : (
          <Button title="Répondre" icon="reply" onPress={() => { setMessage(''); setReponseOuverte(true); }} />
        )
      ) : (
        <Banner type="info" message="Cette personne n'a pas de compte : on ne peut pas lui répondre depuis l'application." />
      )}

      <SectionTitle icon="reply">Réponses ({r.reponses.length})</SectionTitle>
      {r.reponses.length === 0 && <Text style={styles.meta}>Aucune réponse pour le moment.</Text>}
      {r.reponses.map((rep: any) => (
        <Card key={rep.id} style={{ backgroundColor: colors.primarySoft, gap: spacing.sm }}>
          <Text style={styles.auteur}>{rep.administrateur}</Text>
          <Text style={styles.meta}>{formatDateTime(rep.dateSoumission)}</Text>
          <Text style={styles.corps}>{rep.contenu}</Text>
          <DocumentsList documents={rep.documents} />
        </Card>
      ))}

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

const createStyles = (colors: Palette) => StyleSheet.create({
  titre: { fontSize: 20, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: colors.textMuted },
  corps: { fontSize: 16, color: colors.text, lineHeight: 24 },
  auteur: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  expediteur: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { fontSize: 15, fontWeight: '800', color: colors.primary },
  separateur: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  etiquette: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: -spacing.sm },
  bulle: { backgroundColor: colors.background, borderLeftWidth: 4, borderLeftColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
});
