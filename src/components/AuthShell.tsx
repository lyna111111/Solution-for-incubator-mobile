import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/theme';

/**
 * Habillage commun des écrans de connexion, inscription et mot de passe oublié.
 * Reprend la carte « auth-card-saas » du site : carte blanche arrondie (24 px),
 * titre violet, fond doux teinté de violet.
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <LinearGradient colors={['#efe5ff', '#f8fafc', '#e6f8ff']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.header}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="cover" />
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 21 },
});
