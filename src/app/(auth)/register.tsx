import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchIncubateurs, register } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Banner, Button, Field } from '@/components/ui';
import { useRemplacer } from '@/hooks/useOuvrir';
import { useReculer } from '@/hooks/useReculer';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

// Types de compte acceptés par le backend (Utilisateur.TYPE_CHOICES).
const TYPES = [
  'Etudiant',
  'PorteurDeProjet',
  'Encadrant',
  'MembreComitéScientifique',
  'MembreConseilCoordination',
  'MembreCommissionTechnique',
];

// Le formulaire est découpé en 3 étapes courtes.
const ETAPES = [
  { titre: 'Qui êtes-vous ?', sousTitre: 'Vos informations personnelles' },
  { titre: 'Votre profil', sousTitre: 'Incubateur et type de compte' },
  { titre: 'Sécurité', sousTitre: 'Choisissez votre mot de passe' },
];

export default function Inscription() {
  const [etape, setEtape] = useState(0);
  // Le retour (flèche, bouton Android) revient d'abord à l'étape précédente avant de quitter la page.
  const reculer = useReculer({
    secours: '/login',
    android: true,
    avant: () => {
      if (etape === 0) return false;
      setErreur('');
      setEtape(etape - 1);
      return true;
    },
  });
  const remplacer = useRemplacer();
  const styles = useStyles(createStyles);
  const colors = useColors();
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

  /** Vérifie les champs de l'étape affichée ; renvoie le message d'erreur, ou '' si tout est bon. */
  function verifier(numero: number) {
    if (numero === 0 && (!form.nom.trim() || !form.prenom.trim() || !form.email.trim())) {
      return 'Nom, prénom et email sont obligatoires.';
    }
    if (numero === 1 && !incubateurId) return 'Choisissez votre incubateur.';
    if (numero === 2) {
      if (form.mdp.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
      if (form.mdp !== form.mdp_confirmation) return 'Les mots de passe ne correspondent pas.';
    }
    return '';
  }

  function suivant() {
    const probleme = verifier(etape);
    setErreur(probleme);
    if (!probleme) setEtape(etape + 1);
  }

  async function sInscrire() {
    for (let i = 0; i < ETAPES.length; i++) {
      const probleme = verifier(i);
      if (probleme) {
        setEtape(i);
        setErreur(probleme);
        return;
      }
    }
    if (!incubateurId) return;
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
        <Button title="Retour à la connexion" onPress={() => remplacer('/login')} />
      </AuthShell>
    );
  }

  const derniere = etape === ETAPES.length - 1;

  return (
    <AuthShell title={ETAPES[etape].titre} subtitle={ETAPES[etape].sousTitre}>
      <View style={styles.progression}>
        <View style={styles.barres}>
          {ETAPES.map((e, i) => (
            <View key={e.titre} style={[styles.barre, i <= etape && styles.barreActive]} />
          ))}
        </View>
        <Text style={styles.progressionTexte}>
          Étape {etape + 1} sur {ETAPES.length}
        </Text>
      </View>

      {!!erreur && <Banner message={erreur} />}

      {etape === 0 && (
        <>
          <Field
            label="Nom *"
            icon="user"
            value={form.nom}
            onChangeText={maj('nom')}
            autoCapitalize="words"
            placeholder="Votre nom"
          />
          <Field
            label="Prénom *"
            icon="user"
            value={form.prenom}
            onChangeText={maj('prenom')}
            autoCapitalize="words"
            placeholder="Votre prénom"
          />
          <Field
            label="Email *"
            icon="envelope"
            value={form.email}
            onChangeText={maj('email')}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="votre@email.com"
          />
        </>
      )}

      {etape === 1 && (
        <>
          <Text style={styles.label}>Incubateur *</Text>
          <Text style={[styles.aide, { marginBottom: spacing.sm }]}>
            L&apos;administrateur de l&apos;incubateur choisi validera votre inscription.
          </Text>
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
            label="Matricule"
            icon="id-card"
            value={form.matricule}
            onChangeText={maj('matricule')}
            autoCapitalize="characters"
            placeholder="Ex : 20231234"
          />
          <Field
            label="Département"
            value={form.departement}
            onChangeText={maj('departement')}
            placeholder="Ex : Informatique"
          />
          <Field label="Faculté" value={form.faculte} onChangeText={maj('faculte')} placeholder="Ex : Sciences et technologies" />
        </>
      )}

      {etape === 2 && (
        <>
          <Field
            label="Mot de passe * (8 caractères minimum)"
            icon="lock"
            value={form.mdp}
            onChangeText={maj('mdp')}
            secureTextEntry
            autoCapitalize="none"
            placeholder="••••••••"
          />
          <Field
            label="Confirmer le mot de passe *"
            icon="lock"
            value={form.mdp_confirmation}
            onChangeText={maj('mdp_confirmation')}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Retapez le mot de passe"
            onSubmitEditing={() => void sInscrire()}
          />
        </>
      )}

      <Button
        pill
        icon={derniere ? 'check' : 'arrow-right'}
        title={derniere ? "S'inscrire" : 'Suivant'}
        onPress={derniere ? () => void sInscrire() : suivant}
        loading={chargement}
      />
      {etape > 0 && (
        <Pressable onPress={reculer} style={{ alignItems: 'center', paddingTop: spacing.lg }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Retour</Text>
        </Pressable>
      )}
      {etape === 0 && (
        <Pressable onPress={reculer} style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 }}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      )}
    </AuthShell>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  progression: { marginBottom: spacing.lg, gap: 6 },
  barres: { flexDirection: 'row', gap: 6 },
  barre: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  barreActive: { backgroundColor: colors.primary },
  progressionTexte: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
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
