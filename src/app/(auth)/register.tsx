import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchIncubateurs, register } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Banner, Button, Field } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

// Types de compte acceptés par le backend (Utilisateur.TYPE_CHOICES).
const TYPES = [
  'Etudiant',
  'PorteurDeProjet',
  'Encadrant',
  'MembreComitéScientifique',
  'MembreConseilCoordination',
  'MembreCommissionTechnique',
];

export default function Inscription() {
  const incubateurs = useQuery({ queryKey: ['incubateurs'], queryFn: fetchIncubateurs });
  const [incubateurId, setIncubateurId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    matricule: '',
    departement: '',
    faculte: '',
    type: 'Etudiant',
    mdp: '',
    mdp_confirmation: '',
  });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [chargement, setChargement] = useState(false);

  const maj = (champ: keyof typeof form) => (valeur: string) => setForm((f) => ({ ...f, [champ]: valeur }));

  async function sInscrire() {
    if (!incubateurId) {
      setErreur('Choisissez votre incubateur.');
      return;
    }
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      setErreur('Nom, prénom et email sont obligatoires.');
      return;
    }
    if (form.mdp.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (form.mdp !== form.mdp_confirmation) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }
    setErreur('');
    setChargement(true);
    try {
      const message = await register({
        ...form,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        matricule: form.matricule.trim() || undefined,
        incubateur: incubateurId,
      });
      setSucces(message);
    } catch (e) {
      setErreur(getErrorMessage(e));
    } finally {
      setChargement(false);
    }
  }

  if (succes) {
    return (
      <AuthShell title="Inscription envoyée">
        <Banner type="success" message={succes} />
        <Banner
          type="info"
          message={
            "Étapes suivantes :\n1. Ouvrez l'email reçu et cliquez sur le lien de confirmation.\n" +
            "2. Attendez que votre compte soit approuvé par un administrateur de l'incubateur.\n" +
            '3. Connectez-vous ensuite avec votre email et votre mot de passe.'
          }
        />
        <Button title="Retour à la connexion" onPress={() => router.replace('/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Inscription" subtitle="Rejoignez la plateforme">
      {!!erreur && <Banner message={erreur} />}

      <Field label="Nom *" icon="user" value={form.nom} onChangeText={maj('nom')} autoCapitalize="words" />
      <Field label="Prénom *" icon="user" value={form.prenom} onChangeText={maj('prenom')} autoCapitalize="words" />
      <Field
        label="Email *"
        icon="envelope"
        value={form.email}
        onChangeText={maj('email')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <Field label="Matricule" icon="id-card" value={form.matricule} onChangeText={maj('matricule')} autoCapitalize="characters" />
      <Field label="Département" value={form.departement} onChangeText={maj('departement')} />
      <Field label="Faculté" value={form.faculte} onChangeText={maj('faculte')} />

      <Text style={styles.label}>Incubateur *</Text>
      <View style={styles.chips}>
        {incubateurs.isLoading && <Text style={styles.aide}>Chargement des incubateurs...</Text>}
        {!!incubateurs.error && (
          <Pressable onPress={() => void incubateurs.refetch()}>
            <Text style={styles.aide}>{getErrorMessage(incubateurs.error)} Appuyez pour réessayer.</Text>
          </Pressable>
        )}
        {(incubateurs.data ?? []).map((inc) => (
          <Pressable
            key={inc.slug}
            onPress={() => setIncubateurId(inc.id ?? null)}
            style={[styles.chip, incubateurId === inc.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, incubateurId === inc.id && styles.chipTextActive]}>{inc.nom}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Type de compte *</Text>
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => maj('type')(t)}
            style={[styles.chip, form.type === t && styles.chipActive]}
          >
            <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Field
        label="Mot de passe * (8 caractères minimum)"
        icon="lock"
        value={form.mdp}
        onChangeText={maj('mdp')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label="Confirmer le mot de passe *"
        icon="lock"
        value={form.mdp_confirmation}
        onChangeText={maj('mdp_confirmation')}
        secureTextEntry
        autoCapitalize="none"
      />

      <Button pill icon="arrow-right" title="S'inscrire" onPress={() => void sInscrire()} loading={chargement} />
      <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 }}>Déjà un compte ? Se connecter</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  aide: { color: colors.textMuted, fontSize: 13 },
});
