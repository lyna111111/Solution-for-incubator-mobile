import { FontAwesome5 } from '@expo/vector-icons';
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

/** Bandeau de bienvenue des tableaux de bord : rôle du compte connecté et son nom. */
export function BandeauBienvenue({ titre, nom, detail }: { titre: string; nom: string; detail?: string | null }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Card style={styles.hero}>
      <View style={styles.heroIcone}><FontAwesome5 name="rocket" size={20} color={colors.primary} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.heroPetit}>Bienvenue</Text>
        <Text style={styles.heroTitre} numberOfLines={2}>{titre}</Text>
        <Text style={styles.heroSous} numberOfLines={2}>{detail ? `${nom} · ${detail}` : nom}</Text>
      </View>
    </Card>
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
  const colors = useColors();
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.titreLigne}>
        <FontAwesome5 name={icone} size={15} color={couleur} />
        <Text style={styles.titre}>{titre}</Text>
        {!!route && (
          <Pressable accessibilityRole="button" onPress={() => ouvrir(route)} style={styles.voirPlus} hitSlop={8}>
            <Text style={styles.voirPlusTexte}>Voir plus</Text>
            <FontAwesome5 name="arrow-right" size={11} color={colors.text} />
          </Pressable>
        )}
      </View>
      {!!indice && <Text style={styles.indice}>{indice}</Text>}
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
});
