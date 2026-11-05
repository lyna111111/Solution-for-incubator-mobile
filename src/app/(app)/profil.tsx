import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { changePassword, logout, updateMe } from '@/api/endpoints';
import { Dialogue } from '@/components/Dialogue';
import { Screen } from '@/components/Screen';
import { FontAwesome5 } from '@expo/vector-icons';
import { iconeLibelle } from '@/components/iconeLibelle';
import { Banner, Button, Card, Field, SectionTitle } from '@/components/ui';
import { useActualiserCompte } from '@/hooks/useActualiserCompte';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

function Info({ label, valeur }: { label: string; valeur: string }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={{ gap: 2 }}>
      <View style={styles.infoEntete}>
        <FontAwesome5 name={iconeLibelle(label)} size={12} color={colors.primary} style={{ width: 16, textAlign: 'center' }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{valeur || '—'}</Text>
    </View>
  );
}

type Message = { type: 'success' | 'error'; texte: string } | null;

export default function Profil() {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const queryClient = useQueryClient();
  const { refreshing, actualiser } = useActualiserCompte();

  const estUtilisateur = user?.role === 'utilisateur';
  const estSuperAdmin = user?.role === 'superadmin';

  const [form, setForm] = useState({
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    email: user?.email ?? '',
    departement: user?.departement ?? '',
    faculte: user?.faculte ?? '',
  });
  const [infos, setInfos] = useState<Message>(null);
  // Comme les pages de modification : le profil s'ouvre en consultation, le stylo en haut ouvre la modification.
  const [edition, setEdition] = useState(false);
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [messageMdp, setMessageMdp] = useState<Message>(null);

  const majForm = (champ: keyof typeof form) => (valeur: string) => setForm((f) => ({ ...f, [champ]: valeur }));
  const majMdp = (champ: keyof typeof mdp) => (valeur: string) => setMdp((m) => ({ ...m, [champ]: valeur }));

  const enregistrement = useMutation({
    mutationFn: () =>
      updateMe({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        ...(estUtilisateur ? { departement: form.departement.trim(), faculte: form.faculte.trim() } : {}),
      }),
    onSuccess: async (moi) => {
      await setUser(moi);
      setInfos({ type: 'success', texte: t('Profil mis à jour.') });
      setEdition(false);
    },
    onError: (e) => setInfos({ type: 'error', texte: getErrorMessage(e) }),
  });

  const changement = useMutation({
    mutationFn: () => changePassword(mdp.actuel, mdp.nouveau, mdp.confirmation),
    onSuccess: () => {
      setMdp({ actuel: '', nouveau: '', confirmation: '' });
      setMessageMdp({ type: 'success', texte: t('Mot de passe modifié avec succès.') });
    },
    onError: (e) => setMessageMdp({ type: 'error', texte: getErrorMessage(e) }),
  });

  function enregistrer() {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      setInfos({ type: 'error', texte: t("Le nom, le prénom et l'email sont obligatoires.") });
      return;
    }
    setInfos(null);
    enregistrement.mutate();
  }

  function changerMotDePasse() {
    if (!mdp.actuel || !mdp.nouveau) {
      setMessageMdp({ type: 'error', texte: t('Saisissez votre mot de passe actuel et le nouveau.') });
      return;
    }
    setMessageMdp(null);
    changement.mutate();
  }

  function basculerEdition() {
    // Annuler remet les informations d'origine.
    if (edition) {
      setForm({
        nom: user?.nom ?? '',
        prenom: user?.prenom ?? '',
        email: user?.email ?? '',
        departement: user?.departement ?? '',
        faculte: user?.faculte ?? '',
      });
      setInfos(null);
    }
    setEdition(!edition);
  }

  function confirmerDeconnexion() {
    Dialogue.alert(t('Déconnexion'), t('Voulez-vous vraiment vous déconnecter ?'), [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Se déconnecter'),
        style: 'destructive',
        onPress: async () => {
          // On invalide le jeton côté serveur, mais on se déconnecte même s'il est injoignable.
          try {
            await logout(refreshToken);
          } catch {
            // ignoré volontairement
          }
          queryClient.clear();
          await signOut();
        },
      },
    ], { ton: 'danger', icone: 'sign-out-alt' });
  }

  // Recharge le compte depuis le serveur et remet les champs à jour.
  async function actualiserProfil() {
    const moi = await actualiser();
    if (!moi) return;
    setForm({
      nom: moi.nom ?? '',
      prenom: moi.prenom ?? '',
      email: moi.email ?? '',
      departement: moi.departement ?? '',
      faculte: moi.faculte ?? '',
    });
  }

  if (!user) return null;

  return (
    <Screen withTopInset title={t('Mon Profil')} refreshing={refreshing} onRefresh={() => void actualiserProfil()}>
      {!estSuperAdmin && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={edition ? t('Annuler la modification') : t('Modifier mes informations')}
          onPress={basculerEdition}
          style={[styles.stylo, edition && { backgroundColor: colors.dangerSoft }]}
        >
          <FontAwesome5 name={edition ? 'times' : 'pen'} size={14} color={edition ? colors.dangerText : colors.primary} />
          <Text style={[styles.styloTexte, edition && { color: colors.dangerText }]}>{edition ? t('Annuler') : t('Modifier')}</Text>
        </Pressable>
      )}
      <Text style={styles.name}>
        {user.prenom} {user.nom}
      </Text>

      <Card style={{ gap: spacing.md }}>
        <Info label={t('Email')} valeur={user.email} />
        {!!user.type && <Info label={t('Type de compte')} valeur={t(user.type)} />}
        {estUtilisateur && <Info label={t('Matricule')} valeur={user.matricule ?? ''} />}
        <Info label={t('Incubateur')} valeur={user.incubateur?.nom ?? t('Tous les incubateurs')} />
        {estUtilisateur && <Info label={t('Projet')} valeur={user.projet_nom ?? t('Aucun projet')} />}
      </Card>

      {estSuperAdmin ? (
        <Banner
          type="info"
          message={t("Le nom, le prénom et l'email d'un Super Admin se modifient depuis « Les Super-Admins ».")}
        />
      ) : (
        <>
          <SectionTitle icon="user-edit">{t('Modifier mes informations')}</SectionTitle>
          {infos && <Banner type={infos.type} message={infos.texte} />}
          <View pointerEvents={edition ? 'auto' : 'none'}>
            <Field label={t('Nom')} icon="user" editable={edition} value={form.nom} onChangeText={majForm('nom')} autoCapitalize="words" />
            <Field label={t('Prénom')} icon="user" editable={edition} value={form.prenom} onChangeText={majForm('prenom')} autoCapitalize="words" />
            <Field
              label={t('Email')}
              editable={edition}
              icon="envelope"
              value={form.email}
              onChangeText={majForm('email')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {estUtilisateur && (
              <>
                <Field label={t('Département')} editable={edition} value={form.departement} onChangeText={majForm('departement')} />
                <Field label={t('Faculté')} editable={edition} value={form.faculte} onChangeText={majForm('faculte')} />
              </>
            )}
          </View>
          {edition && <Button title={t('Enregistrer')} onPress={enregistrer} loading={enregistrement.isPending} />}
        </>
      )}

      <SectionTitle icon="lock">{t('Changer le mot de passe')}</SectionTitle>
      {messageMdp && <Banner type={messageMdp.type} message={messageMdp.texte} />}
      <Field
        label={t('Mot de passe actuel')}
        icon="lock"
        value={mdp.actuel}
        onChangeText={majMdp('actuel')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label={t('Nouveau mot de passe')}
        icon="key"
        value={mdp.nouveau}
        onChangeText={majMdp('nouveau')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label={t('Confirmer le nouveau mot de passe')}
        icon="key"
        value={mdp.confirmation}
        onChangeText={majMdp('confirmation')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={styles.regle}>
        {t('8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.')}
      </Text>
      <Button title={t('Changer le mot de passe')} variant="secondary" onPress={changerMotDePasse} loading={changement.isPending} />

      <Button title={t('Se déconnecter')} variant="danger" onPress={confirmerDeconnexion} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  stylo: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 8, backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  styloTexte: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  infoEntete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 16, color: colors.text },
  regle: { fontSize: 12, color: colors.textMuted, marginTop: -4 },
});
