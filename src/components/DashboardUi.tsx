import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

import { Card } from './ui';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

/** Carte de chiffre des tableaux de bord (`.sa-kpi-card` du site) : mène à la page concernée si `route` est donnée. */
export function Kpi({ icone, couleur, fond, label, valeur, unite, route }: {
  icone: IconName; couleur: string; fond: string; label: string; valeur: string | number; unite?: string; route?: string;
}) {
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  return (
    <Pressable disabled={!route} onPress={() => route && ouvrir(route)} style={styles.kpi}>
      <Card style={styles.kpiContenu}>
        <View style={[styles.kpiIcone, { backgroundColor: fond }]}><FontAwesome5 name={icone} size={20} color={couleur} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kpiLabel} numberOfLines={2}>{label}</Text>
          <Text style={styles.kpiValeur} adjustsFontSizeToFit numberOfLines={1}>
            {valeur}{unite ? <Text style={styles.kpiUnite}> {unite}</Text> : null}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

/** Bandeau de bienvenue des tableaux de bord : rôle du compte connecté et son nom. Toucher le bandeau ouvre le Profil. */
export function BandeauBienvenue({ titre, nom, detail }: { titre: string; nom: string; detail?: string | null }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    // Le Profil est un onglet : on y passe directement, sans l'empiler sur l'Accueil.
    <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir mon profil" onPress={() => router.navigate('/profil')}>
      <Card style={styles.hero}>
        <View style={styles.heroIcone}><FontAwesome5 name="rocket" size={20} color={colors.primary} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.heroPetit}>Bienvenue</Text>
          <Text style={styles.heroTitre} numberOfLines={2}>{titre}</Text>
          <Text style={styles.heroSous} numberOfLines={2}>{detail ? `${nom} · ${detail}` : nom}</Text>
        </View>
        <FontAwesome5 name="angle-right" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

/** Bouton « Voir plus » commun à tous les accueils (administrateurs, Super Admin, utilisateurs). */
export function VoirPlus({ onPress }: { onPress: () => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.voirPlus} hitSlop={8}>
      <Text style={styles.voirPlusTexte}>Voir plus</Text>
      <FontAwesome5 name="arrow-right" size={11} color={colors.text} />
    </Pressable>
  );
}

/**
 * Titre d'une carte de graphique : icône colorée, titre et, si besoin, une phrase d'aide. Avec `route`, un bouton
 * « Voir plus » mène à la page qui détaille ces chiffres (à ne donner que si cette page existe et est accessible).
 */
export function TitreGraphique({ icone, couleur, titre, indice, route }: {
  icone: IconName; couleur: string; titre: string; indice?: string; route?: string;
}) {
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.titreLigne}>
        <FontAwesome5 name={icone} size={15} color={couleur} />
        <Text style={styles.titre}>{titre}</Text>
        {!!route && <VoirPlus onPress={() => ouvrir(route)} />}
      </View>
      {!!indice && <Text style={styles.indice}>{indice}</Text>}
    </View>
  );
}

/**
 * Section d'un tableau de bord : le titre (icône, titre, « Voir plus ») est à l'extérieur, au-dessus de la carte
 * qui contient le contenu. « Voir plus » n'apparaît que si `route` est donnée.
 */
export function SectionCarte({ icone, couleur, titre, indice, route, children }: {
  icone: IconName; couleur: string; titre: string; indice?: string; route?: string; children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <TitreGraphique icone={icone} couleur={couleur} titre={titre} indice={indice} route={route} />
      <Card style={{ gap: spacing.md }}>{children}</Card>
    </View>
  );
}

/** Rangée de petites pastilles de chiffres (icône, valeur, libellé) à l'intérieur d'une carte de section. */
export function Pastilles({ valeurs }: {
  valeurs: { label: string; valeur: number; icone: IconName; couleur: string; fond: string }[];
}) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.pastilles}>
      {valeurs.map((d) => (
        <View key={d.label} style={styles.pastille}>
          <View style={[styles.pastilleIcone, { backgroundColor: d.fond }]}><FontAwesome5 name={d.icone} size={14} color={d.couleur} /></View>
          <Text style={styles.pastilleValeur}>{d.valeur}</Text>
          <Text style={styles.pastilleLabel} numberOfLines={1}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  // Toutes les cartes ont la même taille : deux par ligne à largeur égale, même hauteur (la carte remplit son bouton).
  kpi: { flexBasis: '47.5%', flexGrow: 1, flexShrink: 0 },
  kpiContenu: { flex: 1, minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  kpiIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValeur: { fontSize: 24, fontWeight: '700', color: colors.text },
  kpiUnite: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  heroIcone: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroPetit: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroTitre: { fontSize: 20, fontWeight: '800', color: colors.text },
  heroSous: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  voirPlus: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6,
  },
  voirPlusTexte: { fontSize: 12, fontWeight: '600', color: colors.text },
  indice: { fontSize: 12, color: colors.textMuted },
  pastilles: { flexDirection: 'row', gap: spacing.sm },
  pastille: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: 4 },
  pastilleIcone: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pastilleValeur: { fontSize: 20, fontWeight: '700', color: colors.text },
  pastilleLabel: { fontSize: 11, color: colors.textMuted },
});
