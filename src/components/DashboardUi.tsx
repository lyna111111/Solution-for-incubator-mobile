import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { type Palette, spacing, useStyles } from '@/theme';

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

/** Titre d'une carte de graphique : icône colorée, titre et, si besoin, une phrase d'aide. */
export function TitreGraphique({ icone, couleur, titre, indice }: { icone: IconName; couleur: string; titre: string; indice?: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.titreLigne}>
        <FontAwesome5 name={icone} size={15} color={couleur} />
        <Text style={styles.titre}>{titre}</Text>
      </View>
      {!!indice && <Text style={styles.indice}>{indice}</Text>}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  kpi: { width: '47.5%', flexGrow: 1 },
  kpiContenu: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  kpiIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValeur: { fontSize: 24, fontWeight: '700', color: colors.text },
  kpiUnite: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  indice: { fontSize: 12, color: colors.textMuted },
});
