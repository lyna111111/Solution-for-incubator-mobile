import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { ouvrirDocument } from '@/api/endpoints';
import type { DocumentJoint } from '@/types';
import { colors, radius, spacing } from '@/theme';

/** Ligne « pièce jointe » : télécharge le fichier avec le jeton (droits vérifiés par le serveur). */
export function DocumentLink({ document }: { document: DocumentJoint }) {
  const [chargement, setChargement] = useState(false);

  async function ouvrir() {
    setChargement(true);
    try {
      await ouvrirDocument(document);
    } catch (e) {
      Alert.alert('Téléchargement impossible', getErrorMessage(e));
    } finally {
      setChargement(false);
    }
  }

  return (
    <Pressable onPress={() => void ouvrir()} disabled={chargement} style={styles.row}>
      <FontAwesome5 name="paperclip" size={14} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.titre} numberOfLines={1}>
          {document.titre}
        </Text>
        {!!document.type && <Text style={styles.type}>{document.type}</Text>}
      </View>
      {chargement ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FontAwesome5 name="download" size={14} color={colors.primary} />
      )}
    </Pressable>
  );
}

export function DocumentsList({ documents }: { documents: DocumentJoint[] | undefined }) {
  if (!documents?.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      {documents.map((d) => (
        <DocumentLink key={d.id} document={d} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  titre: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
  type: { fontSize: 12, color: colors.textMuted },
});
