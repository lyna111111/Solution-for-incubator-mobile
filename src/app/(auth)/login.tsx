import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { login } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Banner, Button, Field } from '@/components/ui';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import { type Palette, spacing, useStyles } from '@/theme';

export default function Connexion() {
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function seConnecter() {
    if (!email.trim() || !mdp) {
      setErreur(t('Saisissez votre email et votre mot de passe.'));
      return;
    }
    setErreur('');
    setChargement(true);
    try {
      const { access, refresh, user } = await login(email, mdp);
      await signIn(access, refresh, user);
      // La navigation vers l'espace connecté est automatique (Stack.Protected).
    } catch (e) {
      setErreur(getErrorMessage(e));
      setChargement(false);
    }
  }

  return (
    <AuthShell title={t('Connexion')} subtitle={t('Heureux de vous revoir sur la plateforme')}>
      {!!erreur && <Banner message={erreur} />}

      <Field
        label={t('Email')}
        icon="envelope"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder={t('votre@email.com')}
      />
      <Field
        label={t('Mot de passe')}
        icon="lock"
        value={mdp}
        onChangeText={setMdp}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        placeholder="••••••••"
        onSubmitEditing={() => void seConnecter()}
      />

      <Button pill title={t('Se connecter')} icon="arrow-right" onPress={() => void seConnecter()} loading={chargement} />

      <View style={styles.footer}>
        <Pressable onPress={() => ouvrir('/register')}>
          <Text style={styles.footerText}>
            {t('Pas encore de compte ?')} <Text style={styles.footerStrong}>{t("S'inscrire")}</Text>
          </Text>
        </Pressable>
        <Pressable onPress={() => ouvrir('/forgot-password')}>
          <Text style={styles.link}>{t('Mot de passe oublié ?')}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  footer: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: 15 },
  footerStrong: { color: colors.primary, fontWeight: '700' },
  link: { color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});
