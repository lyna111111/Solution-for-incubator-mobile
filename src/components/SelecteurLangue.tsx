import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LANGUES, useLangStore, useT } from '@/i18n';
import { type Palette, radius, useColors, useStyles } from '@/theme';

/**
 * Choix de la langue : une icône (globe) sur laquelle on appuie pour faire glisser, juste à côté d'elle, les trois
 * langues (Français / English / عربية). Appuyer sur une langue la choisit et referme le tout. Pas de fenêtre modale.
 * Avec `avecLibelle`, la langue courante est écrite à côté de l'icône tant que le choix est fermé (page Profil).
 */
/** Barre du haut d'une page : largeur fixe des trois langues, pour que leur place soit connue d'avance (voir `flottant`). */
const LARGEUR_LANGUE = 72;
const ECART = 6;
/** Place prise par les langues à côté de l'icône : l'écart avec l'icône + trois langues + deux écarts entre elles. */
const LARGEUR_LANGUES = ECART + 3 * LARGEUR_LANGUE + 2 * ECART;

export function SelecteurLangue({ couleur, avecLibelle = false, style, onOuvrirChange, flottant = false }: {
  couleur?: string; avecLibelle?: boolean; style?: StyleProp<ViewStyle>;
  /**
   * Les langues s'ouvrent par-dessus ce qui suit l'icône (le titre de la page) au lieu de le pousser : elles prennent une
   * largeur connue d'avance que l'on retranche à la marge de fin, donc le reste de la barre ne bouge pas d'un pixel.
   */
  flottant?: boolean;
  /** Prévenu à l'ouverture et à la fermeture : la barre du haut libère alors la place dont les langues ont besoin. */
  onOuvrirChange?: (ouvert: boolean) => void;
}) {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const lang = useLangStore((s) => s.lang);
  const choisir = useLangStore((s) => s.choisir);
  const [ouvert, setOuvertEtat] = useState(false);
  const setOuvert = (valeur: boolean) => {
    setOuvertEtat(valeur);
    onOuvrirChange?.(valeur);
  };
  // `monte` : les langues restent affichées pendant leur animation de fermeture.
  const [monte, setMonte] = useState(false);
  if (ouvert && !monte) setMonte(true);
  const [progression] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (ouvert) {
      Animated.timing(progression, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(progression, { toValue: 0, duration: 160, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMonte(false);
      });
    }
  }, [ouvert, progression]);
  const courante = LANGUES.find((l) => l.code === lang) ?? LANGUES[0];

  return (
    <View style={[styles.rangee, style, flottant && monte && { marginEnd: -LARGEUR_LANGUES }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Langue')}
        accessibilityState={{ expanded: ouvert }}
        hitSlop={10}
        onPress={() => setOuvert(!ouvert)}
        style={[styles.bouton, avecLibelle && !monte && styles.boutonLibelle, monte && { backgroundColor: colors.primarySoft }]}
      >
        <FontAwesome5 name="globe" size={18} color={couleur ?? colors.primary} />
        {avecLibelle && !monte && <Text style={styles.libelle}>{courante.libelle}</Text>}
      </Pressable>

      {monte && (
        <Animated.View
          style={[
            styles.langues,
            {
              opacity: progression,
              // Les langues glissent depuis l'icône (vers l'avant de la ligne : droite, ou gauche en arabe).
              transform: [{ translateX: progression.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          {LANGUES.map((l) => {
            const actif = l.code === lang;
            return (
              <Pressable
                key={l.code}
                accessibilityRole="button"
                accessibilityLabel={l.libelle}
                accessibilityState={{ selected: actif }}
                onPress={() => {
                  setOuvert(false);
                  void choisir(l.code);
                }}
                style={[styles.langue, flottant && styles.langueFixe, actif && styles.langueActive]}
              >
                <Text style={[styles.langueTexte, actif && styles.langueTexteActive]}>{l.libelle}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  rangee: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: ECART },
  bouton: { minWidth: 38, height: 38, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  boutonLibelle: { gap: 8, paddingHorizontal: 14, backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  libelle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  langues: { flexDirection: 'row', alignItems: 'center', gap: ECART },
  langue: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  langueFixe: { width: LARGEUR_LANGUE, alignItems: 'center', paddingHorizontal: 0 },
  langueActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langueTexte: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  langueTexteActive: { color: '#fff' },
});
