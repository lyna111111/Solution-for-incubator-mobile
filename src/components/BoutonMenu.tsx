import { FontAwesome5 } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNonLues } from '@/hooks/useNotifications';
import { useAllerOnglet } from '@/hooks/useOuvrir';
import { useReculer } from '@/hooks/useReculer';
import { type Palette, useColors, useStyles } from '@/theme';

/**
 * Burger en haut à droite (tous les rôles) : ouvre la liste du Menu, dont les entrées dépendent du rôle.
 * La pastille indique les notifications non lues (utilisateur uniquement).
 */
export function BoutonMenu() {
  const colors = useColors();
  const styles = useStyles(createStyles);
  const nonLues = useNonLues();
  const chemin = usePathname();
  const allerOnglet = useAllerOnglet();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Menu"
      hitSlop={10}
      onPress={() => {
        if (chemin !== '/menu') allerOnglet('/menu');
      }}
      style={styles.bouton}
    >
      <FontAwesome5 name="bars" size={20} color={colors.primary} />
      {nonLues > 0 && (
        <View style={styles.pastille}>
          <Text style={styles.pastilleTexte}>{nonLues > 99 ? '99+' : nonLues}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Sur la liste du Menu elle-même, le burger devient une croix qui ramène à la page d'où l'on vient. */
export function BoutonFermerMenu() {
  const colors = useColors();
  const styles = useStyles(createStyles);
  const reculer = useReculer();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" hitSlop={10} onPress={reculer} style={styles.bouton}>
      <FontAwesome5 name="times" size={22} color={colors.primary} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  bouton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pastille: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.unread,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleTexte: { fontSize: 10, fontWeight: '700', color: colors.text },
});
