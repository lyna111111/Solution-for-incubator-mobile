import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ThemeToggle';

import { type Palette, spacing, useColors, useStyles } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Vrai pour les pages à la racine d'un onglet (sans en-tête de navigation). */
  withTopInset?: boolean;
  /** Titre de la barre du haut (équivalent de la « topbar » du site). */
  title?: string;
}

/** Page défilante avec tirer-pour-actualiser. */
export function Screen({ children, refreshing = false, onRefresh, withTopInset = false, title }: ScreenProps) {
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
      </ScrollView>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
});
