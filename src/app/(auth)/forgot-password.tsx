import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { requestPasswordReset } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Banner, Button, Field } from '@/components/ui';
import { useReculer } from '@/hooks/useReculer';
import { useT } from '@/i18n';
import { type Palette, spacing, useStyles } from '@/theme';

export default function MotDePasseOublie() {
  const t = useT();
  const reculer = useReculer({ secours: '/login', android: true });
  const styles = useStyles(createStyles);
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function envoyer() {
    if (!email.trim()) {
      setErreur(t('Saisissez votre adresse email.'));
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
      title={t('Mot de passe oublié')}
      subtitle={t('Réinitialisez votre accès en quelques secondes')}
    >
      {!!erreur && <Banner message={erreur} />}
      {envoye ? (
        <Banner
          type="success"
          message={t("Si un compte existe pour cette adresse, un email contenant un nouveau mot de passe vient d'être envoyé.")}
        />
      ) : (
        <>
          <Field
            label={t('Email professionnel')}
            icon="envelope"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={t('votre@email.com')}
          />
          <Button pill icon="paper-plane" title={t('Envoyer un mot de passe temporaire')} onPress={() => void envoyer()} loading={chargement} />
        </>
      )}
      <Pressable onPress={reculer} style={styles.link}>
        <Text style={styles.linkText}>{t('Retour à la connexion')}</Text>
      </Pressable>
    </AuthShell>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  link: { alignItems: 'center', paddingVertical: spacing.lg },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
