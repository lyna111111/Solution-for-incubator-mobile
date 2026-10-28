import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { requestPasswordReset } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Banner, Button, Field } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function envoyer() {
    if (!email.trim()) {
      setErreur('Saisissez votre adresse email.');
      return;
    }
    setErreur('');
    setChargement(true);
    try {
      await requestPasswordReset(email);
      setEnvoye(true);
    } catch (e) {
      setErreur(getErrorMessage(e));
    } finally {
      setChargement(false);
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Réinitialisez votre accès en quelques secondes"
    >
      {!!erreur && <Banner message={erreur} />}
      {envoye ? (
        <Banner
          type="success"
          message="Si un compte existe pour cette adresse, un email contenant un nouveau mot de passe vient d'être envoyé."
        />
      ) : (
        <>
          <Field
            label="Email professionnel"
            icon="envelope"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="votre@email.com"
          />
          <Button pill icon="paper-plane" title="Envoyer un mot de passe temporaire" onPress={() => void envoyer()} loading={chargement} />
        </>
      )}
      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>Retour à la connexion</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: 'center', paddingVertical: spacing.lg },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
