import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adminEnvoyer, adminGet } from '@/admin/api';
import { SelecteurReference } from '@/admin/ui';
import { getErrorMessage } from '@/api/client';
import { useReculer } from '@/hooks/useReculer';
import { Dialogue } from '@/components/Dialogue';
import { Screen } from '@/components/Screen';
import { Badge, Banner, Button, Card, ErrorState, Field, Loading, SectionTitle, Libelle, LigneIcone } from '@/components/ui';
import { useT } from '@/i18n';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formaterDA, formatDate } from '@/utils/format';

const ACTIONS: Record<string, { titre: string; message: string; libelle: string; destructif: boolean }> = {
  suspendre: { titre: "Suspendre l'abonnement", message: "L'incubateur sera désactivé : ses utilisateurs ne pourront plus se connecter.", libelle: 'Suspendre', destructif: true },
  reactiver: { titre: "Réactiver l'abonnement", message: "L'abonnement redevient actif et l'incubateur est réactivé.", libelle: 'Réactiver', destructif: false },
  resilier: { titre: "Résilier l'abonnement", message: "L'abonnement sera annulé et l'incubateur désactivé.", libelle: 'Résilier', destructif: true },
};

/** Fiche d'un abonnement : informations, paiements, suspension / réactivation / résiliation, renouvellement. */
export default function AbonnementFiche() {
  const t = useT();
  const reculer = useReculer();
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
    Dialogue.alert(t(def.titre), t(def.message), [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t(def.libelle),
        style: def.destructif ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await adminEnvoyer('post', `abonnements/${id}/action/`, { action }, [], 'superadmin');
            await apres();
          } catch (e) {
            Dialogue.alert(t('Action impossible'), getErrorMessage(e));
          }
        },
      },
    ]);
  }

  async function renouveler() {
    if (!dateFin.trim()) {
      setErreur(t('Indiquez la nouvelle date de fin (AAAA-MM-JJ).'));
      return;
    }
    setErreur('');
    setEnvoi(true);
    try {
      await adminEnvoyer('post', `abonnements/${id}/renouveler/`,
        { nouvelle_date_fin: dateFin.trim(), ...(offreId ? { nouvelle_offre_id: offreId } : {}) }, [], 'superadmin');
      await apres();
      reculer();
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
          <Badge label={t(a.statut_display)} fond={colors.primarySoft} texte={colors.primaryDark} />
        </View>
        <LigneIcone icone="tags">{t('Plan')} : {t(a.plan_display)} ({a.type === 'essai' ? t("période d'essai") : t('annuel')})</LigneIcone>
        <LigneIcone icone="calendar-alt">{t('Du {debut} au {fin}', { debut: formatDate(a.date_debut), fin: formatDate(a.date_fin) })}</LigneIcone>
        <LigneIcone icone="hourglass-half">
          {a.jours_restants >= 0 ? t('{n} jour(s) restant(s)', { n: a.jours_restants }) : t('Expiré depuis {n} jour(s)', { n: -a.jours_restants })}
        </LigneIcone>
        <LigneIcone icone="money-bill-wave">{t('Montant annuel')} : {formaterDA(a.montant_annuel)}</LigneIcone>
        {!!a.notes && <LigneIcone icone="sticky-note">{t('Notes')} : {a.notes}</LigneIcone>}
      </Card>

      <View style={styles.actions}>
        {a.statut === 'suspendu' || a.statut === 'annule'
          ? <Button title={t('Réactiver')} style={{ flex: 1 }} onPress={() => agir('reactiver')} />
          : <Button title={t('Suspendre')} variant="secondary" style={{ flex: 1 }} onPress={() => agir('suspendre')} />}
        {a.statut !== 'annule' && <Button title={t('Résilier')} variant="danger" style={{ flex: 1 }} onPress={() => agir('resilier')} />}
      </View>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle icon="sync-alt">{t('Renouveler')}</SectionTitle>
        {!!erreur && <Banner message={erreur} />}
        <Field label={t('Nouvelle date de fin *')} value={dateFin} onChangeText={setDateFin} placeholder={t('AAAA-MM-JJ')} />
        <Libelle>{t("Changer d'offre (facultatif)")}</Libelle>
        <SelecteurReference base="superadmin" source={`abonnements/${id}/`} cleListe="offres"
          libelle={(o) => `${o.nom} — ${formaterDA(o.prix)}${t('/an')}`} valeur={offreId} onChange={setOffreId} />
        <Button title={t('Renouveler')} onPress={() => void renouveler()} loading={envoi} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle icon="credit-card">{t('Paiements')}</SectionTitle>
        {data.paiements.length === 0 && <Text style={styles.ligne}>{t('Aucun paiement enregistré.')}</Text>}
        {data.paiements.map((p: any) => (
          <LigneIcone key={p.id} icone="receipt">
            {p.reference} · {formaterDA(p.montant)} · {t(p.methode_display)} · {formatDate(p.date_paiement)} · {t(p.statut_display)}
          </LigneIcone>
        ))}
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titre: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  ligne: { fontSize: 14, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
