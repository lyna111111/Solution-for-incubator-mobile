import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

// Les six atouts présentés sur la page d'accueil du site.
const ATOUTS: { icon: IconName; label: string }[] = [
  { icon: 'lightbulb', label: 'Projets' },
  { icon: 'users', label: 'Utilisateurs' },
  { icon: 'calendar-alt', label: 'Événements' },
  { icon: 'comments', label: 'Requêtes' },
  { icon: 'file-alt', label: 'Documents' },
  { icon: 'chart-line', label: 'Statistiques' },
];

/** Page de bienvenue, avant la connexion : logo, présentation de la plateforme, puis accès à la connexion. */
export default function Bienvenue() {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // Tout tient sur un écran, sans défilement : sur les petits téléphones on retire la phrase de présentation.
  const court = useWindowDimensions().height < 720;

  // Apparition en douceur, puis léger flottement du logo.
  const [apparition] = useState(() => new Animated.Value(0));
  const [flottement] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(apparition, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(flottement, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flottement, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [apparition, flottement]);

  const monte = {
    opacity: apparition,
    transform: [{ translateY: apparition.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  };
  const logoFlotte = { transform: [{ translateY: flottement.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] };

  return (
    <LinearGradient colors={[colors.navy, '#2b1366', colors.primaryDark]} style={styles.root}>
      <StatusBar style="light" />
      <ThemeToggle couleur="#fff" style={[styles.theme, { top: insets.top + 8 }]} />
      <View style={styles.content}>
        {/* Halos décoratifs aux couleurs de la marque */}
        <View pointerEvents="none" style={[styles.halo, styles.haloViolet]} />
        <View pointerEvents="none" style={[styles.halo, styles.haloCyan]} />

        <Animated.View style={[styles.hero, { paddingTop: insets.top + spacing.lg }, monte]}>
          <Animated.View style={[styles.logoCadre, logoFlotte]}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="cover" />
          </Animated.View>

          <Text style={styles.brand}>Solution</Text>
          <Text style={styles.brandSub}>for Incubator</Text>

          <Text style={styles.headline}>
            Transformez votre{'\n'}
            <Text style={styles.headlineAccent}>incubateur</Text> 🚀
          </Text>
          {!court && (
            <Text style={styles.lead}>
              Suivez vos projets, participez aux événements et échangez avec votre équipe d&apos;accompagnement, où que
              vous soyez.
            </Text>
          )}

          <View style={styles.atouts}>
            {ATOUTS.map((a) => (
              <View key={a.label} style={styles.atout}>
                <View style={styles.atoutIcon}>
                  <FontAwesome5 name={a.icon} size={17} color="#fff" />
                </View>
                <Text style={styles.atoutLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, monte]}>
          <View style={styles.grip} />
          <Text style={styles.sheetTitle}>Bienvenue !</Text>
          <Text style={styles.sheetSub}>Connectez-vous pour accéder à votre espace.</Text>

          <Button pill title="Se connecter" icon="arrow-right" onPress={() => router.push('/login')} />
          <Pressable onPress={() => router.push('/register')} style={styles.inscription}>
            <Text style={styles.inscriptionTexte}>
              Pas encore de compte ? <Text style={styles.inscriptionAccent}>S&apos;inscrire</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  theme: { position: 'absolute', right: 12, zIndex: 10 },
  root: { flex: 1 },
  content: { flex: 1 },

  halo: { position: 'absolute', borderRadius: 999 },
  haloViolet: { width: 340, height: 340, top: -100, right: -120, backgroundColor: 'rgba(138,63,252,0.35)' },
  haloCyan: { width: 240, height: 240, top: 220, left: -120, backgroundColor: 'rgba(0,194,255,0.18)' },

  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  logoCadre: {
    padding: 6,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: spacing.md,
  },
  logo: { width: 88, height: 88, borderRadius: 24 },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 32 },
  brandSub: { color: colors.secondary, fontSize: 15, fontWeight: '700', letterSpacing: 0.6, marginBottom: spacing.lg },

  headline: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 35, textAlign: 'center' },
  headlineAccent: { color: colors.secondary },
  lead: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: spacing.md },

  atouts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  atout: { width: '28%', alignItems: 'center', gap: spacing.sm },
  atoutIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  atoutLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },

  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  grip: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: colors.border },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.sm },
  inscription: { alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md },
  inscriptionTexte: { color: colors.textMuted, fontSize: 15 },
  inscriptionAccent: { color: colors.primary, fontWeight: '700' },
});
