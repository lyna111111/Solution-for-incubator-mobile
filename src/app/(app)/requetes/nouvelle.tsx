import { FontAwesome5 } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { createRequete } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field } from '@/components/ui';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';
import type { PieceJointe } from '@/types';

// Mêmes valeurs que le formulaire du site.
const TYPES = ["Demande d'information", 'Assistance technique', 'Demande de rendez-vous', 'Réclamation', 'Autre'];
const TYPES_DOCUMENT = ['Formulaire', 'Arrêté', 'Attestation', 'Rapport', 'Article', 'Autre'];

// Ce que le site accepte pour une requête : le serveur revérifie extension, contenu et taille.
const MIME_AUTORISES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo, comme le serveur

function Choix({ options, valeur, onChoisir }: { options: string[]; valeur: string; onChoisir: (v: string) => void }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChoisir(o)} style={[styles.chip, valeur === o && styles.chipActive]}>
          <Text style={[styles.chipText, valeur === o && styles.chipTextActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NouvelleRequete() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const queryClient = useQueryClient();
  const [objet, setObjet] = useState('');
  const [type, setType] = useState('');
  const [contenu, setContenu] = useState('');
  const [piece, setPiece] = useState<(PieceJointe & { size?: number }) | null>(null);
  const [typeDocument, setTypeDocument] = useState('');
  const [erreur, setErreur] = useState('');

  const envoi = useMutation({
    mutationFn: createRequete,
    onSuccess: async (requete) => {
      await queryClient.invalidateQueries({ queryKey: ['requetes'] });
      await queryClient.invalidateQueries({ queryKey: ['accueil'] });
      router.replace(`/requetes/${requete.id}`);
    },
    onError: (e) => setErreur(getErrorMessage(e)),
  });

  async function choisirFichier() {
    const resultat = await DocumentPicker.getDocumentAsync({ type: MIME_AUTORISES, copyToCacheDirectory: true });
    if (resultat.canceled || !resultat.assets[0]) return;
    const f = resultat.assets[0];
    if (f.size && f.size > TAILLE_MAX) {
      setErreur('Le fichier est trop volumineux (10 Mo maximum).');
      return;
    }
    setErreur('');
    setPiece({ uri: f.uri, name: f.name, mimeType: f.mimeType, size: f.size });
  }

  function envoyer() {
    if (!objet.trim() || !type || !contenu.trim()) {
      setErreur('Renseignez le sujet, le type et le message.');
      return;
    }
    if (piece && !typeDocument) {
      setErreur('Précisez le type du document joint.');
      return;
    }
    setErreur('');
    envoi.mutate({
      objet: objet.trim(),
      type_requete: type,
      contenu: contenu.trim(),
      ...(piece ? { piece, document_type: typeDocument } : {}),
    });
  }

  return (
    <Screen>
      {!!erreur && <Banner message={erreur} />}

      <Field label="Sujet *" value={objet} onChangeText={setObjet} maxLength={200} placeholder="Sujet de votre requête" />

      <View>
        <Text style={styles.label}>Type de requête *</Text>
        <Choix options={TYPES} valeur={type} onChoisir={setType} />
      </View>

      <Field
        label="Message *"
        value={contenu}
        onChangeText={setContenu}
        multiline
        placeholder="Décrivez votre requête en détail..."
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.label}>Pièce jointe (optionnelle)</Text>
        {piece ? (
          <View style={styles.piece}>
            <FontAwesome5 name="paperclip" size={14} color={colors.primary} />
            <Text style={styles.pieceNom} numberOfLines={1}>{piece.name}</Text>
            <Pressable onPress={() => { setPiece(null); setTypeDocument(''); }} hitSlop={10}>
              <FontAwesome5 name="times" size={16} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <Button title="Joindre un fichier" icon="paperclip" variant="secondary" onPress={() => void choisirFichier()} />
        )}
        <Text style={styles.aide}>PDF, Word, Excel, JPG, PNG ou GIF — 10 Mo maximum.</Text>
        {piece && (
          <View>
            <Text style={styles.label}>Type du document *</Text>
            <Choix options={TYPES_DOCUMENT} valeur={typeDocument} onChoisir={setTypeDocument} />
          </View>
        )}
      </View>

      <Button pill title="Envoyer la requête" icon="paper-plane" onPress={envoyer} loading={envoi.isPending} />
    </Screen>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  aide: { fontSize: 12, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  piece: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft,
    borderRadius: radius.md, padding: spacing.md },
  pieceNom: { flex: 1, color: colors.primaryDark, fontWeight: '600' },
});
