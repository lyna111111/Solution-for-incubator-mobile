import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ThemeToggle';

import { gradient, type Palette, radius, spacing, useColors, useStyles } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Vrai pour les pages à la racine d'un onglet (sans en-tête de navigation). */
  withTopInset?: boolean;
  /** Titre de la barre du haut (équivalent de la « topbar » du site). */
  title?: string;
  /** Bouton flottant « + » en bas à droite (création d'un élément), comme une application mobile. */
  fab?: { titre: string; onPress: () => void };
}

/** Page défilante avec tirer-pour-actualiser. */
export function Screen({ children, refreshing = false, onRefresh, withTopInset = false, title, fab }: ScreenProps) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <SafeAreaView style={styles.safe} edges={withTopInset ? ['top'] : []}>
      {!!title && (
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>{title}</Text>
          <ThemeToggle />
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
        {!!fab && <View style={{ height: 56 }} />}
      </ScrollView>
      {!!fab && (
        <Pressable accessibilityRole="button" accessibilityLabel={fab.titre} onPress={fab.onPress}
          style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={gradient.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.fabFond, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="plus" size={13} color="#fff" />
            <Text style={styles.fabTexte} numberOfLines={1}>{fab.titre}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  // Barre très discrète : pas de fond ni de trait, titre en petit, comme une application mobile.
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 2,
  },
  topbarTitle: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    shadowColor: '#8a3ffc',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabFond: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 18, borderRadius: radius.pill },
  fabTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
});
