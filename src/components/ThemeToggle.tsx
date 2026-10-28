import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { useThemeStore } from '@/store/theme';
import { useColors } from '@/theme';

/** Bouton clair / sombre (soleil / lune), présent sur toutes les pages comme dans la barre du site. */
export function ThemeToggle({ couleur, style }: { couleur?: string; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const mode = useThemeStore((s) => s.mode);
  const basculer = useThemeStore((s) => s.basculer);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mode === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      onPress={() => void basculer()}
      hitSlop={10}
      style={[{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <FontAwesome5 name={mode === 'dark' ? 'sun' : 'moon'} size={18} solid color={couleur ?? colors.primary} />
    </Pressable>
  );
}
