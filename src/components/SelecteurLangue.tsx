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
export function SelecteurLangue({ couleur, avecLibelle = false, style }: {
  couleur?: string; avecLibelle?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const lang = useLangStore((s) => s.lang);
  const choisir = useLangStore((s) => s.choisir);
  const [ouvert, setOuvert] = useState(false);
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
    <View style={[styles.rangee, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Langue')}
        accessibilityState={{ expanded: ouvert }}
        hitSlop={10}
        onPress={() => setOuvert((o) => !o)}
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
                style={[styles.langue, actif && styles.langueActive]}
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
  rangee: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  bouton: { minWidth: 38, height: 38, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  boutonLibelle: { gap: 8, paddingHorizontal: 14, backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  libelle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  langues: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langue: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  langueActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langueTexte: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  langueTexteActive: { color: '#fff' },
});
