import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { gradient, type Palette, radius, shadow, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// ── Bouton ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Forme « pilule » avec dégradé violet : boutons de connexion/inscription du site. */
  pill?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', pill, icon, style }: ButtonProps) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const inactif = disabled || loading;
  const clair = variant === 'secondary';
  const contenu = loading ? (
    <ActivityIndicator color={clair ? colors.primary : '#fff'} />
  ) : (
    <View style={styles.buttonRow}>
      <Text style={[styles.buttonText, clair && { color: colors.primary }]}>{title}</Text>
      {!!icon && <FontAwesome5 name={icon} size={14} color={clair ? colors.primary : '#fff'} />}
    </View>
  );
  const forme = pill ? radius.pill : radius.sm;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactif}
      style={({ pressed }) => [{ opacity: inactif ? 0.55 : pressed ? 0.85 : 1 }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={pill ? gradient.button : [colors.primary, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { borderRadius: forme }]}
        >
          {contenu}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            { borderRadius: forme },
            clair
              ? { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary }
              : { backgroundColor: colors.danger },
          ]}
        >
          {contenu}
        </View>
      )}
    </Pressable>
  );
}

// ── Champ de saisie ──────────────────────────────────────────────────────────

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Icône à gauche du champ (comme les champs de connexion du site). */
  icon?: IconName;
}

export function Field({ label, error, icon, secureTextEntry, style, ...props }: FieldProps) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  // Œil afficher/masquer, comme sur la page de connexion du site.
  const [masque, setMasque] = useState(true);
  const estMotDePasse = !!secureTextEntry;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, !!error && { borderColor: colors.danger }, props.multiline && { alignItems: 'flex-start' }]}>
        {!!icon && <FontAwesome5 name={icon} size={15} color={colors.textMuted} style={styles.inputIcon} />}
        <TextInput
          placeholderTextColor="#94a3b8"
          {...props}
          secureTextEntry={estMotDePasse && masque}
          style={[styles.input, props.multiline && styles.inputMulti, style]}
        />
        {estMotDePasse && (
          <Pressable onPress={() => setMasque((m) => !m)} hitSlop={10} accessibilityLabel="Afficher ou masquer le mot de passe">
            <FontAwesome5 name={masque ? 'eye' : 'eye-slash'} size={15} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Carte, pastille, titres ──────────────────────────────────────────────────

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, fond, texte }: { label: string; fond: string; texte: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.badge, { backgroundColor: fond }]}>
      <Text style={[styles.badgeText, { color: texte }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: IconName }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={styles.sectionRow}>
      {!!icon && <FontAwesome5 name={icon} size={15} color={colors.primary} />}
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

// ── États : chargement, erreur, liste vide ───────────────────────────────────

export function Loading() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <Button title="Réessayer" variant="secondary" onPress={onRetry} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function Banner({ message, type = 'error' }: { message: string; type?: 'error' | 'success' | 'info' }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const palette =
    type === 'success'
      ? { fond: colors.successSoft, texte: colors.successText, icone: 'check-circle' as const }
      : type === 'info'
        ? { fond: colors.primarySoft, texte: colors.primaryDark, icone: 'info-circle' as const }
        : { fond: colors.dangerSoft, texte: colors.dangerText, icone: 'exclamation-circle' as const };
  return (
    <View style={[styles.banner, { backgroundColor: palette.fond }]}>
      <FontAwesome5 name={palette.icone} size={15} color={palette.texte} style={{ marginTop: 2 }} />
      <Text style={{ color: palette.texte, fontSize: 14, lineHeight: 20, flex: 1 }}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  inputIcon: { marginRight: 10, width: 18, textAlign: 'center' },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12 },
  inputMulti: { minHeight: 110, textAlignVertical: 'top' },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow,
  },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { color: colors.danger, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
