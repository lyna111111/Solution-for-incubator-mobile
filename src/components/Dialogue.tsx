import { FontAwesome5 } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

export type Ton = 'success' | 'danger' | 'warning' | 'info' | 'primary';

export interface BoutonDialogue {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface OptionsDialogue {
  ton?: Ton;
  icone?: IconName;
}

interface DialogueActif extends Required<OptionsDialogue> {
  titre: string;
  message?: string;
  boutons: BoutonDialogue[];
}

/** `actif` : dialogue ouvert ; `dernier` : dernier dialogue ouvert, conservé pour l'animation de fermeture. */
const useDialogueStore = create<{ actif: DialogueActif | null; dernier: DialogueActif | null }>(() => ({
  actif: null,
  dernier: null,
}));

/**
 * Modales de l'application, au style de celles du site (static/css/alert-modal.css, variante « pro ») :
 * fond assombri, carte arrondie, titre coloré avec icône, croix de fermeture, bouton d'action teinté.
 * Remplace `Alert.alert` (même signature) : `Dialogue.alert(titre, message, [{ text, style, onPress }])`.
 */
export const Dialogue = {
  alert(titre: string, message?: string, boutons?: BoutonDialogue[], options: OptionsDialogue = {}) {
    const liste = boutons?.length ? boutons : [{ text: 'OK' }];
    const destructif = liste.some((b) => b.style === 'destructive');
    const erreur = /impossible|erreur/i.test(titre);
    // Sans précision : rouge pour une suppression ou une erreur, violet pour une confirmation, bleu pour une info.
    const ton: Ton = options.ton ?? (destructif || erreur ? 'danger' : liste.length > 1 ? 'primary' : 'info');
    const icone: IconName = options.icone
      ?? (erreur ? 'times-circle' : destructif ? 'exclamation-triangle' : liste.length > 1 ? 'question-circle' : 'info-circle');
    const dialogue = { titre, message, boutons: liste, ton, icone };
    useDialogueStore.setState({ actif: dialogue, dernier: dialogue });
  },
};

/** À monter une fois à la racine de l'application. */
export function DialogueHost() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const courant = useDialogueStore((s) => s.actif);
  // Pendant le fondu de fermeture, la carte garde le contenu du dernier dialogue.
  const actif = useDialogueStore((s) => s.dernier);

  const couleurs: Record<Ton, string> = {
    success: colors.success, danger: colors.danger, warning: colors.warning, info: colors.info, primary: colors.primary,
  };
  const teinte = couleurs[actif?.ton ?? 'primary'];

  /** Ferme la modale, puis lance l'action du bouton choisi (comme `Alert.alert`). */
  function choisir(bouton?: BoutonDialogue) {
    // Déjà fermée (fondu en cours) : un second appui ne doit pas relancer l'action.
    if (!useDialogueStore.getState().actif) return;
    useDialogueStore.setState({ actif: null });
    void bouton?.onPress?.();
  }
  // Croix, toucher à côté et bouton « retour » d'Android : équivalent du bouton « Annuler » s'il existe.
  const fermer = () => choisir(courant?.boutons.find((b) => b.style === 'cancel'));

  return (
    <Modal visible={!!courant} transparent animationType="fade" statusBarTranslucent onRequestClose={fermer}>
      <View style={styles.fond}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fermer} accessibilityLabel="Fermer" />
        {actif && (
          <View style={styles.carte}>
            <View style={styles.entete}>
              <View style={styles.titreWrap}>
                <FontAwesome5 name={actif.icone} size={17} color={teinte} solid />
                <Text style={[styles.titre, { color: teinte }]}>{actif.titre}</Text>
              </View>
              <Pressable onPress={fermer} hitSlop={8} style={styles.croix} accessibilityLabel="Fermer">
                <FontAwesome5 name="times" size={15} color={colors.textMuted} />
              </Pressable>
            </View>

            {!!actif.message && <Text style={styles.message}>{actif.message}</Text>}

            <View style={styles.pied}>
              {actif.boutons.map((b, i) => {
                const secondaire = b.style === 'cancel';
                return (
                  <Pressable
                    key={`${b.text}${i}`}
                    onPress={() => choisir(b)}
                    style={({ pressed }) => [
                      styles.bouton,
                      secondaire
                        ? { backgroundColor: colors.border }
                        // Même teinte que le site : fond à 18 %, bordure à 45 % de la couleur du ton.
                        : { backgroundColor: `${teinte}2E`, borderColor: `${teinte}73`, borderWidth: 1 },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.boutonTexte, { color: secondaire ? colors.text : teinte }]}>{b.text}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(8, 10, 25, 0.62)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  carte: {
    width: '100%', maxWidth: 460, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 4 },
  titreWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { flexShrink: 1, fontSize: 17, fontWeight: '700' },
  croix: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  message: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  pied: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 22, paddingBottom: 20, paddingTop: 4 },
  bouton: { borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 10, minWidth: 96, alignItems: 'center' },
  boutonTexte: { fontSize: 14, fontWeight: '700' },
});
