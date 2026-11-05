import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { ouvrirDocument, voirDocument } from '@/api/endpoints';
import { Dialogue } from '@/components/Dialogue';
import { useT } from '@/i18n';
import type { DocumentJoint } from '@/types';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

/** Ligne « pièce jointe » : télécharge le fichier avec le jeton (droits vérifiés par le serveur). */
export function DocumentLink({ document }: { document: DocumentJoint }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const [action, setAction] = useState<'voir' | 'telecharger' | null>(null);

  // D'abord on peut regarder le document ; le téléchargement est un second choix, à part.
  async function voir() {
    setAction('voir');
    try {
      const affiche = await voirDocument(document);
      if (!affiche) {
        Dialogue.alert(t('Aperçu impossible'), t('Aucune application du téléphone ne peut afficher ce document. Vous pouvez le télécharger.'));
      }
    } catch (e) {
      Dialogue.alert(t('Aperçu impossible'), getErrorMessage(e));
    } finally {
      setAction(null);
    }
  }

  async function telecharger() {
    setAction('telecharger');
    try {
      await ouvrirDocument(document);
    } catch (e) {
      Dialogue.alert(t('Téléchargement impossible'), getErrorMessage(e));
    } finally {
      setAction(null);
    }
  }

  return (
    <View style={styles.row}>
      <FontAwesome5 name="paperclip" size={14} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.titre} numberOfLines={2}>
          {document.titre}
        </Text>
        {!!document.type && <Text style={styles.type}>{t(document.type)}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('Voir')} ${document.titre}`}
        onPress={() => void voir()}
        disabled={action !== null}
        style={[styles.bouton, { backgroundColor: colors.primary }]}
      >
        {action === 'voir' ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome5 name="eye" size={13} color="#fff" />}
        <Text style={[styles.boutonTexte, { color: '#fff' }]}>{t('Voir')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('Télécharger')} ${document.titre}`}
        onPress={() => void telecharger()}
        disabled={action !== null}
        style={[styles.bouton, { backgroundColor: colors.card }]}
      >
        {action === 'telecharger'
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <FontAwesome5 name="download" size={13} color={colors.primaryDark} />}
      </Pressable>
    </View>
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

const createStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 36, minWidth: 36, paddingHorizontal: 12, borderRadius: radius.pill },
  boutonTexte: { fontSize: 13, fontWeight: '700' },
  titre: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
  type: { fontSize: 12, color: colors.textMuted },
});
