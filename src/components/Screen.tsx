import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

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
  return (
    <SafeAreaView style={styles.safe} edges={withTopInset ? ['top'] : []}>
      {!!title && (
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>{title}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topbar: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topbarTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
});
