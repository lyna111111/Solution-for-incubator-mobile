import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { type Palette, spacing, useColors, useStyles } from '@/theme';

// Les deux graphiques du tableau de bord Super Admin du site (Chart.js : anneau « plans » et histogramme « revenus »).

export interface PartAnneau { cle: string; label: string; valeur: number; couleur: string }

/** Anneau (Chart.js `doughnut`, trou de 62 %) : un secteur par plan, légende en bas ; toucher un secteur ou un nom l'ouvre. */
export function Anneau({ parts, onSelect }: { parts: PartAnneau[]; onSelect: (part: PartAnneau) => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const taille = 200;
  const epaisseur = taille / 2 * 0.38; // trou = 62 % du rayon
  const rayon = taille / 2 - epaisseur / 2;
  const circonference = 2 * Math.PI * rayon;
  const total = parts.reduce((s, p) => s + p.valeur, 0);

  const longueurs = parts.map((p) => (total > 0 ? (p.valeur / total) * circonference : 0));
  return (
    <View style={styles.centre}>
      <Svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}>
        <G rotation={-90} origin={`${taille / 2}, ${taille / 2}`}>
          {parts.map((p, i) => {
            const longueur = longueurs[i];
            const decalage = -longueurs.slice(0, i).reduce((a, b) => a + b, 0);
            return (
              <Circle
                key={p.cle}
                cx={taille / 2}
                cy={taille / 2}
                r={rayon}
                fill="none"
                stroke={p.couleur}
                strokeWidth={epaisseur}
                strokeDasharray={`${longueur} ${circonference - longueur}`}
                strokeDashoffset={decalage}
                onPress={() => onSelect(p)}
              />
            );
          })}
        </G>
        <SvgText x={taille / 2} y={taille / 2 + 8} fontSize={24} fontWeight="800" fill={colors.text} textAnchor="middle">
          {String(total)}
        </SvgText>
      </Svg>
      <View style={styles.legende}>
        {parts.map((p) => (
          <Pressable key={p.cle} onPress={() => onSelect(p)} style={styles.legendeItem} hitSlop={6}>
            <View style={[styles.carre, { backgroundColor: p.couleur }]} />
            <Text style={styles.legendeTexte}>{p.label} ({p.valeur})</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export interface BarreHisto { cle: string; label: string; valeur: number }

/** Plus petit pas « rond » (1, 2, 2,5, 5 × 10ⁿ) qui couvre `maxi` en `nb` graduations, comme l'axe de Chart.js. */
function graduations(maxi: number, nb = 5): number[] {
  const brut = (maxi > 0 ? maxi : 1000) / nb;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut) ?? brut;
  const nombre = Math.ceil((maxi > 0 ? maxi : 1000) / pas);
  return Array.from({ length: nombre + 1 }, (_, i) => i * pas);
}

const nombre = (n: number) => String(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Histogramme (Chart.js `bar`) : barres violettes, axe en DA ; toucher la colonne d'un mois l'ouvre. */
export function Histogramme({ barres, unite = 'DA', onSelect }: {
  barres: BarreHisto[]; unite?: string; onSelect: (barre: BarreHisto) => void;
}) {
  const colors = useColors();
  const [largeur, setLargeur] = useState(0);
  const hauteur = 260;
  const marge = { haut: 10, bas: 28, gauche: 78, droite: 8 };

  const ticks = graduations(Math.max(0, ...barres.map((b) => b.valeur)));
  const sommet = ticks[ticks.length - 1];
  const zoneL = Math.max(0, largeur - marge.gauche - marge.droite);
  const zoneH = hauteur - marge.haut - marge.bas;
  const colonne = barres.length ? zoneL / barres.length : 0;
  const y = (v: number) => marge.haut + zoneH - (v / sommet) * zoneH;

  return (
    <View style={{ height: hauteur }} onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
      {largeur > 0 && (
        <Svg width={largeur} height={hauteur}>
          {ticks.map((t) => (
            <G key={t}>
              <Line x1={marge.gauche} x2={largeur - marge.droite} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={marge.gauche - 8} y={y(t) + 4} fontSize={11} fill={colors.textMuted} textAnchor="end">
                {`${nombre(t)} ${unite}`}
              </SvgText>
            </G>
          ))}
          {barres.map((b, i) => {
            const x0 = marge.gauche + i * colonne;
            const largeurBarre = colonne * 0.64;
            const haut = y(b.valeur);
            return (
              <G key={b.cle}>
                {b.valeur > 0 && (
                  <Rect x={x0 + (colonne - largeurBarre) / 2} y={haut} width={largeurBarre} height={y(0) - haut} rx={6}
                    fill="rgba(138,63,252,0.6)" stroke="#8a3ffc" strokeWidth={1} />
                )}
                <SvgText x={x0 + colonne / 2} y={hauteur - 8} fontSize={11} fill={colors.textMuted} textAnchor="middle">
                  {b.label}
                </SvgText>
                {/* Toute la colonne, étiquette du mois comprise, est cliquable (comme sur le site). */}
                <Rect x={x0} y={marge.haut} width={colonne} height={hauteur - marge.haut} fill="transparent" onPress={() => onSelect(b)} />
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  centre: { alignItems: 'center', gap: spacing.md },
  legende: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  carre: { width: 12, height: 12, borderRadius: 3 },
  legendeTexte: { fontSize: 12, color: colors.text },
});
