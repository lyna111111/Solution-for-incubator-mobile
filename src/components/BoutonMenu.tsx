import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useMenuStore } from '@/store/menu';
import { type Palette, useColors, useStyles } from '@/theme';

/**
 * Burger en haut à droite (tous les rôles) : ouvre le Menu, un tiroir qui glisse par-dessus la page depuis la droite
 * (voir `MenuLateral`). Ses entrées dépendent du rôle.
 */
export function BoutonMenu() {
  const colors = useColors();
  const styles = useStyles(createStyles);
  const ouvrir = useMenuStore((s) => s.ouvrir);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Menu" hitSlop={10} onPress={ouvrir} style={styles.bouton}>
      <FontAwesome5 name="bars" size={20} color={colors.primary} />
    </Pressable>
  );
}

const createStyles = (_colors: Palette) => StyleSheet.create({
  bouton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
