import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { changePassword, logout, updateMe } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, SectionTitle } from '@/components/ui';
import { useActualiserCompte } from '@/hooks/useActualiserCompte';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme';

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{valeur || '—'}</Text>
    </View>
  );
}

type Message = { type: 'success' | 'error'; texte: string } | null;

export default function Profil() {
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
      setInfos({ type: 'success', texte: 'Profil mis à jour.' });
    },
    onError: (e) => setInfos({ type: 'error', texte: getErrorMessage(e) }),
  });

  const changement = useMutation({
    mutationFn: () => changePassword(mdp.actuel, mdp.nouveau, mdp.confirmation),
    onSuccess: () => {
      setMdp({ actuel: '', nouveau: '', confirmation: '' });
      setMessageMdp({ type: 'success', texte: 'Mot de passe modifié avec succès.' });
    },
    onError: (e) => setMessageMdp({ type: 'error', texte: getErrorMessage(e) }),
  });

  function enregistrer() {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      setInfos({ type: 'error', texte: 'Le nom, le prénom et l\'email sont obligatoires.' });
      return;
    }
    setInfos(null);
    enregistrement.mutate();
  }

  function changerMotDePasse() {
    if (!mdp.actuel || !mdp.nouveau) {
      setMessageMdp({ type: 'error', texte: 'Saisissez votre mot de passe actuel et le nouveau.' });
      return;
    }
    setMessageMdp(null);
    changement.mutate();
  }

  function confirmerDeconnexion() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
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
    ]);
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
    <Screen withTopInset title="Mon Profil" refreshing={refreshing} onRefresh={() => void actualiserProfil()}>
      <Text style={styles.name}>
        {user.prenom} {user.nom}
      </Text>

      <Card style={{ gap: spacing.md }}>
        <Info label="Email" valeur={user.email} />
        {!!user.type && <Info label="Type de compte" valeur={user.type} />}
        {estUtilisateur && <Info label="Matricule" valeur={user.matricule ?? ''} />}
        <Info label="Incubateur" valeur={user.incubateur?.nom ?? 'Tous les incubateurs'} />
        {estUtilisateur && <Info label="Projet" valeur={user.projet_nom ?? 'Aucun projet'} />}
      </Card>

      {estSuperAdmin ? (
        <Banner
          type="info"
          message="Le nom, le prénom et l'email d'un Super Admin se modifient depuis « Les Super-Admins »."
        />
      ) : (
        <>
          <SectionTitle icon="user-edit">Modifier mes informations</SectionTitle>
          {infos && <Banner type={infos.type} message={infos.texte} />}
          <Field label="Nom" icon="user" value={form.nom} onChangeText={majForm('nom')} autoCapitalize="words" />
          <Field label="Prénom" icon="user" value={form.prenom} onChangeText={majForm('prenom')} autoCapitalize="words" />
          <Field
            label="Email"
            icon="envelope"
            value={form.email}
            onChangeText={majForm('email')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {estUtilisateur && (
            <>
              <Field label="Département" value={form.departement} onChangeText={majForm('departement')} />
              <Field label="Faculté" value={form.faculte} onChangeText={majForm('faculte')} />
            </>
          )}
          <Button title="Enregistrer" onPress={enregistrer} loading={enregistrement.isPending} />
        </>
      )}

      <SectionTitle icon="lock">Changer le mot de passe</SectionTitle>
      {messageMdp && <Banner type={messageMdp.type} message={messageMdp.texte} />}
      <Field
        label="Mot de passe actuel"
        icon="lock"
        value={mdp.actuel}
        onChangeText={majMdp('actuel')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label="Nouveau mot de passe"
        icon="key"
        value={mdp.nouveau}
        onChangeText={majMdp('nouveau')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label="Confirmer le nouveau mot de passe"
        icon="key"
        value={mdp.confirmation}
        onChangeText={majMdp('confirmation')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={styles.regle}>
        8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.
      </Text>
      <Button title="Changer le mot de passe" variant="secondary" onPress={changerMotDePasse} loading={changement.isPending} />

      <Button title="Se déconnecter" variant="danger" onPress={confirmerDeconnexion} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  infoLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 16, color: colors.text },
  regle: { fontSize: 12, color: colors.textMuted, marginTop: -4 },
});
