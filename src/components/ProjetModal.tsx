import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ProjetUtilisateur } from '@/types';
import { gradient, type Palette, radius, spacing, useColors, useStyles } from '@/theme';

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{valeur || '—'}</Text>
    </View>
  );
}

/** Détails du projet de l'utilisateur (équivalent de la fenêtre « Voir les détails » du site). */
export function ProjetModal({
  projet, chargement, visible, onClose,
}: { projet: ProjetUtilisateur | undefined; chargement?: boolean; visible: boolean; onClose: () => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.header}>
            <Text style={styles.title}>Détails du projet</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fermer">
              <FontAwesome5 name="times" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {chargement && <ActivityIndicator color={colors.primary} />}
          {projet && (
            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
              <Ligne label="Intitulé" valeur={projet.intitule} />
              <Ligne label="Thème" valeur={projet.theme} />
              <Ligne label="Description" valeur={projet.description} />
              <Ligne label="Chef de projet" valeur={projet.chef_projet} />
              <Ligne label="Membres" valeur={projet.membres.join(', ')} />
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Progression</Text>
                <View style={styles.track}>
                  <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 12, width: `${Math.min(100, projet.progression)}%` }} />
                </View>
                <Text style={styles.value}>{projet.progression}%</Text>
              </View>
              <Ligne label="Créé le" valeur={projet.created_at} />
              <Ligne label="Dernière mise à jour" valeur={projet.updated_at} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 16, color: colors.text, lineHeight: 22 },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
});
