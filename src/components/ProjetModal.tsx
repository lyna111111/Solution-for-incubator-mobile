import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui';
import type { ProjetUtilisateur } from '@/types';
import { gradient, type Palette, radius, spacing, useColors, useStyles } from '@/theme';
import { formatDate } from '@/utils/format';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

/** « Lyes Amrani » -> « LA » (avatar d'une personne). */
const initiales = (nom: string) =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('') || '?';

/** Bloc d'information : titre avec icône colorée puis contenu, comme les cartes des tableaux de bord. */
function Bloc({ icone, titre, children }: { icone: IconName; titre: string; children: React.ReactNode }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={styles.bloc}>
      <View style={styles.blocTitre}>
        <View style={styles.blocIcone}><FontAwesome5 name={icone} size={12} color={colors.primary} /></View>
        <Text style={styles.blocLabel}>{titre}</Text>
      </View>
      {children}
    </View>
  );
}

function Personne({ nom, chef }: { nom: string; chef?: boolean }) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.personne, chef && styles.personneChef]}>
      <View style={[styles.avatar, chef && styles.avatarChef]}>
        <Text style={[styles.avatarTexte, chef && { color: '#fff' }]}>{initiales(nom)}</Text>
      </View>
      <Text style={styles.personneNom} numberOfLines={1}>{nom}</Text>
    </View>
  );
}

/** Détails du projet de l'utilisateur (équivalent de la fenêtre « Voir les détails » du site). */
export function ProjetModal({
  projet, chargement, visible, onClose,
}: { projet: ProjetUtilisateur | undefined; chargement?: boolean; visible: boolean; onClose: () => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const progression = Math.max(0, Math.min(100, projet?.progression ?? 0));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Toucher le fond ferme la fenêtre ; la fenêtre elle-même n'est pas dans ce bouton, pour que le défilement fonctionne. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.sheet}>
          {/* En-tête comme les autres fenêtres de l'application : titre violet, fermer, puis intitulé et thème. */}
          <View style={styles.entete}>
            <View style={styles.enteteLigne}>
              <Text style={styles.petit}>Détails du projet</Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
                <FontAwesome5 name="times" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.intitule} numberOfLines={3}>{projet?.intitule ?? ' '}</Text>
            {!!projet?.theme && <Badge label={projet.theme} fond={colors.primarySoft} texte={colors.primaryDark} />}
          </View>

          {chargement && <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />}
          {projet && (
            <ScrollView style={styles.defilement} contentContainerStyle={styles.corps} showsVerticalScrollIndicator={false}
              nestedScrollEnabled>
              <View style={styles.bloc}>
                <View style={styles.progressionLigne}>
                  <View style={styles.blocTitre}>
                    <View style={styles.blocIcone}><FontAwesome5 name="chart-line" size={12} color={colors.primary} /></View>
                    <Text style={styles.blocLabel}>Progression</Text>
                  </View>
                  <Text style={styles.pourcentage}>{progression}%</Text>
                </View>
                <View style={styles.piste}>
                  <LinearGradient colors={gradient.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 12, width: `${progression}%` }} />
                </View>
              </View>

              <Bloc icone="align-left" titre="Description">
                <Text style={styles.texte}>{projet.description || 'Aucune description.'}</Text>
              </Bloc>

              <Bloc icone="user-tie" titre="Chef de projet">
                {projet.chef_projet ? <Personne nom={projet.chef_projet} chef /> : <Text style={styles.texte}>—</Text>}
              </Bloc>

              <Bloc icone="users" titre={`Membres (${projet.membres.length})`}>
                {projet.membres.length === 0
                  ? <Text style={styles.texte}>Aucun membre pour le moment.</Text>
                  : <View style={styles.membres}>{projet.membres.map((m, i) => <Personne key={`${m}-${i}`} nom={m} />)}</View>}
              </Bloc>

              <View style={styles.dates}>
                <View style={styles.date}>
                  <FontAwesome5 name="calendar-plus" size={14} color={colors.primary} />
                  <Text style={styles.dateLabel}>Créé le</Text>
                  <Text style={styles.dateValeur}>{formatDate(projet.created_at) || '—'}</Text>
                </View>
                <View style={styles.date}>
                  <FontAwesome5 name="sync-alt" size={14} color={colors.primary} />
                  <Text style={styles.dateLabel}>Dernière mise à jour</Text>
                  <Text style={styles.dateValeur}>{formatDate(projet.updated_at) || '—'}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '90%', overflow: 'hidden' },
  entete: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm,
    alignItems: 'flex-start' },
  enteteLigne: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petit: { fontSize: 20, fontWeight: '800', color: colors.primary },
  intitule: { fontSize: 22, fontWeight: '800', color: colors.text },
  defilement: { flexGrow: 0, flexShrink: 1 },
  corps: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  bloc: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, gap: spacing.md },
  blocTitre: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blocIcone: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center' },
  blocLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  texte: { fontSize: 15, color: colors.text, lineHeight: 22 },
  progressionLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pourcentage: { fontSize: 24, fontWeight: '800', color: colors.primary },
  piste: { height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
  membres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  personne: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.background,
    borderRadius: 999, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, maxWidth: '100%' },
  personneChef: { backgroundColor: colors.primarySoft },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center' },
  avatarChef: { backgroundColor: colors.primary },
  avatarTexte: { fontSize: 11, fontWeight: '800', color: colors.primary },
  personneNom: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 },
  dates: { flexDirection: 'row', gap: spacing.md },
  date: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: 4 },
  dateLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  dateValeur: { fontSize: 14, fontWeight: '700', color: colors.text },
});
