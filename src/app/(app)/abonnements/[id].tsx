import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { adminEnvoyer, adminGet } from '@/admin/api';
import { SelecteurReference } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { Screen } from '@/components/Screen';
import { Badge, Banner, Button, Card, ErrorState, Field, Loading, SectionTitle } from '@/components/ui';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formaterDA, formatDate } from '@/utils/format';

const ACTIONS: Record<string, { titre: string; message: string; libelle: string; destructif: boolean }> = {
  suspendre: { titre: "Suspendre l'abonnement", message: "L'incubateur sera désactivé : ses utilisateurs ne pourront plus se connecter.", libelle: 'Suspendre', destructif: true },
  reactiver: { titre: "Réactiver l'abonnement", message: "L'abonnement redevient actif et l'incubateur est réactivé.", libelle: 'Réactiver', destructif: false },
  resilier: { titre: "Résilier l'abonnement", message: "L'abonnement sera annulé et l'incubateur désactivé.", libelle: 'Résilier', destructif: true },
};

/** Fiche d'un abonnement : informations, paiements, suspension / réactivation / résiliation, renouvellement. */
export default function AbonnementFiche() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [dateFin, setDateFin] = useState('');
  const [offreId, setOffreId] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', 'abonnements', 'detail', id],
    queryFn: () => adminGet(`abonnements/${id}/`, undefined, 'superadmin'),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const a = data.abonnement;

  async function apres() {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  function agir(action: keyof typeof ACTIONS) {
    const def = ACTIONS[action];
    Alert.alert(def.titre, def.message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: def.libelle,
        style: def.destructif ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await adminEnvoyer('post', `abonnements/${id}/action/`, { action }, [], 'superadmin');
            await apres();
          } catch (e) {
            Alert.alert('Action impossible', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  async function renouveler() {
    if (!dateFin.trim()) {
      setErreur('Indiquez la nouvelle date de fin (AAAA-MM-JJ).');
      return;
    }
    setErreur('');
    setEnvoi(true);
    try {
      await adminEnvoyer('post', `abonnements/${id}/renouveler/`,
        { nouvelle_date_fin: dateFin.trim(), ...(offreId ? { nouvelle_offre_id: offreId } : {}) }, [], 'superadmin');
      await apres();
      router.back();
    } catch (e) {
      setErreur(getErrorMessage(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: a.incubateur }} />

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.entete}>
          <Text style={styles.titre}>{a.incubateur}</Text>
          <Badge label={a.statut_display} fond={colors.primarySoft} texte={colors.primaryDark} />
        </View>
        <Text style={styles.ligne}>Plan : {a.plan_display} ({a.type === 'essai' ? "période d'essai" : 'annuel'})</Text>
        <Text style={styles.ligne}>Du {formatDate(a.date_debut)} au {formatDate(a.date_fin)}</Text>
        <Text style={styles.ligne}>
          {a.jours_restants >= 0 ? `${a.jours_restants} jour(s) restant(s)` : `Expiré depuis ${-a.jours_restants} jour(s)`}
        </Text>
        <Text style={styles.ligne}>Montant annuel : {formaterDA(a.montant_annuel)}</Text>
        {!!a.notes && <Text style={styles.ligne}>Notes : {a.notes}</Text>}
      </Card>

      <View style={styles.actions}>
        {a.statut === 'suspendu' || a.statut === 'annule'
          ? <Button title="Réactiver" style={{ flex: 1 }} onPress={() => agir('reactiver')} />
          : <Button title="Suspendre" variant="secondary" style={{ flex: 1 }} onPress={() => agir('suspendre')} />}
        {a.statut !== 'annule' && <Button title="Résilier" variant="danger" style={{ flex: 1 }} onPress={() => agir('resilier')} />}
      </View>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle icon="sync-alt">Renouveler</SectionTitle>
        {!!erreur && <Banner message={erreur} />}
        <Field label="Nouvelle date de fin *" value={dateFin} onChangeText={setDateFin} placeholder="AAAA-MM-JJ" />
        <Text style={styles.label}>{"Changer d'offre (facultatif)"}</Text>
        <SelecteurReference base="superadmin" source={`abonnements/${id}/`} cleListe="offres"
          libelle={(o) => `${o.nom} — ${formaterDA(o.prix)}/an`} valeur={offreId} onChange={setOffreId} />
        <Button title="Renouveler" onPress={() => void renouveler()} loading={envoi} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle icon="credit-card">Paiements</SectionTitle>
        {data.paiements.length === 0 && <Text style={styles.ligne}>Aucun paiement enregistré.</Text>}
        {data.paiements.map((p: any) => (
          <Text key={p.id} style={styles.ligne}>
            {p.reference} · {formaterDA(p.montant)} · {p.methode_display} · {formatDate(p.date_paiement)} · {p.statut_display}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titre: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  ligne: { fontSize: 14, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
