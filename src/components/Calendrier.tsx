import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface CalendrierProps {
  annee: number;
  mois: number; // 0-11
  /** Jours du mois (1-31) qui ont au moins un événement. */
  joursAvecEvenement: Set<number>;
  jourSelectionne: number | null;
  onChangerMois: (delta: number) => void;
  onSelectionnerJour: (jour: number | null) => void;
}

/** Calendrier mensuel : un point sous les jours qui ont un événement. */
export function Calendrier({
  annee,
  mois,
  joursAvecEvenement,
  jourSelectionne,
  onChangerMois,
  onSelectionnerJour,
}: CalendrierProps) {
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  // getDay(): 0 = dimanche ; on veut lundi = 0.
  const decalage = (new Date(annee, mois, 1).getDay() + 6) % 7;

  const cases: (number | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];
  while (cases.length % 7 !== 0) cases.push(null);

  const lignes: (number | null)[][] = [];
  for (let i = 0; i < cases.length; i += 7) lignes.push(cases.slice(i, i + 7));

  const aujourdhui = new Date();
  const estAujourdhui = (j: number) =>
    aujourdhui.getFullYear() === annee && aujourdhui.getMonth() === mois && aujourdhui.getDate() === j;

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Pressable onPress={() => onChangerMois(-1)} hitSlop={12} accessibilityLabel="Mois précédent">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>
          {MOIS[mois]} {annee}
        </Text>
        <Pressable onPress={() => onChangerMois(1)} hitSlop={12} accessibilityLabel="Mois suivant">
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {JOURS.map((j, i) => (
          <Text key={i} style={styles.weekday}>
            {j}
          </Text>
        ))}
      </View>

      {lignes.map((ligne, i) => (
        <View key={i} style={styles.row}>
          {ligne.map((jour, k) =>
            jour === null ? (
              <View key={k} style={styles.cell} />
            ) : (
              <Pressable
                key={k}
                style={styles.cell}
                onPress={() => onSelectionnerJour(jour === jourSelectionne ? null : jour)}
              >
                <View
                  style={[
                    styles.day,
                    estAujourdhui(jour) && styles.today,
                    jour === jourSelectionne && styles.selected,
                  ]}
                >
                  <Text style={[styles.dayText, jour === jourSelectionne && { color: '#fff', fontWeight: '700' }]}>
                    {jour}
                  </Text>
                </View>
                <View style={[styles.dot, joursAvecEvenement.has(jour) && styles.dotOn]} />
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12, paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2, minHeight: 40 },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1, borderColor: colors.primary },
  selected: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 14 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.primary },
});
