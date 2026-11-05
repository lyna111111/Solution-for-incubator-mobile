import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated, Dimensions, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelecteurLangue } from '@/components/SelecteurLangue';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useRetourMenuLateral } from '@/hooks/useReculer';
import { _t, useEstRTL, useLangStore, useT } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import { useMenuStore } from '@/store/menu';
import { gradient, type Palette, radius, spacing, useColors, useStyles } from '@/theme';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

interface Entree {
  titre: string;
  icone: IconName;
  route: string;
  /** Module requis (administrateur uniquement) : selon le type d'administrateur. */
  module?: string;
}

// Utilisateur : son espace (ses notifications et ses requêtes sont dans la barre du bas, pas ici).
const MENU_UTILISATEUR: Entree[] = [
  { titre: _t('Événements'), icone: 'calendar-alt', route: '/evenements' },
  { titre: _t('Articles'), icone: 'newspaper', route: '/articles' },
];

// Administrateur : mêmes intitulés et icônes, dans le même ordre, que la barre latérale du site
// (la gestion des requêtes est dans la barre du bas).
const MENU_ADMIN: Entree[] = [
  { module: 'utilisateurs', titre: _t('Gestion des Utilisateurs'), icone: 'users', route: '/gestion/utilisateurs' },
  { module: 'evenements', titre: _t('Gestion des Événements'), icone: 'calendar-alt', route: '/gestion/evenements' },
  { module: 'projets', titre: _t('Gestion des Projets'), icone: 'project-diagram', route: '/gestion/projets' },
  { module: 'articles', titre: _t('Gestion des Articles'), icone: 'newspaper', route: '/gestion/articles' },
  { module: 'statistiques', titre: _t('Statistiques Global'), icone: 'chart-pie', route: '/gestion/statistiques' },
  { module: 'documents', titre: _t('Feedback des Documents'), icone: 'file-alt', route: '/gestion/documents' },
  { module: 'notifications', titre: _t('Gestion des Notifications'), icone: 'bell', route: '/gestion/notifications' },
  { module: 'administrateurs', titre: _t('Administrateurs'), icone: 'user-shield', route: '/gestion/administrateurs' },
];

// Super Admin : mêmes pages que la barre latérale Super Admin du site.
const MENU_SUPERADMIN: Entree[] = [
  { titre: _t('Incubateurs'), icone: 'building', route: '/incubateurs' },
  { titre: _t('Offres'), icone: 'tags', route: '/offres' },
  { titre: _t('Abonnements'), icone: 'sync-alt', route: '/abonnements' },
  { titre: _t('Paiements'), icone: 'credit-card', route: '/paiements' },
  { titre: _t('Administrateurs'), icone: 'user-shield', route: '/superadmins' },
];

/** Largeur du tiroir : 78 % de l'écran, 340 au plus. */
const largeurMenu = (largeurEcran: number) => Math.min(largeurEcran * 0.78, 340);

/** Partie du tiroir qui dépasse hors de l'écran : cache le léger rebond du ressort à l'ouverture. */
const DEBORD = 56;

/** « Lyes Amrani » -> « LA » (avatar de l'en-tête). */
const initiales = (prenom?: string, nom?: string) => `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';

/** Une entrée du menu : s'enfonce sous le doigt (ressort), l'entrée de la page affichée est mise en valeur. */
function Rangee({ entree, actif, rtl, onPress }: { entree: Entree; actif: boolean; rtl: boolean; onPress: () => void }) {
  const t = useT();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const [echelle] = useState(() => new Animated.Value(1));
  const appuyer = (vers: number) =>
    Animated.spring(echelle, { toValue: vers, speed: 40, bounciness: vers === 1 ? 9 : 0, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale: echelle }] }}>
      <Pressable
        onPressIn={() => appuyer(0.96)}
        onPressOut={() => appuyer(1)}
        onPress={onPress}
        style={[styles.ligne, actif && styles.ligneActive]}
      >
        {actif && <View style={styles.repere} />}
        <View style={[styles.icone, actif && { backgroundColor: colors.primary }]}>
          <FontAwesome5 name={entree.icone} size={16} color={actif ? '#fff' : colors.primary} />
        </View>
        <Text style={[styles.titre, actif && { color: colors.primaryDark }]}>{t(entree.titre)}</Text>
        <FontAwesome5 name={rtl ? 'angle-left' : 'angle-right'} size={16} color={actif ? colors.primary : colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Menu : tiroir qui glisse depuis le côté du burger par-dessus la page affichée. Fond plein, en-tête dégradé avec le
 * compte connecté ; ouverture à ressort puis apparition des entrées en cascade ; se ferme d'un appui sur le fond, de la
 * croix, du bouton retour d'Android ou en le tirant vers le bord. La même liste pour tous les rôles, seules les entrées
 * proposées changent.
 */
export function MenuLateral() {
  const t = useT();
  const rtl = useEstRTL();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const chemin = usePathname();
  const { width } = useWindowDimensions();
  const ouvert = useMenuStore((s) => s.ouvert);
  const fermer = useMenuStore((s) => s.fermer);
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  // Le sélecteur ne doit pas fabriquer de nouveau tableau (`?? []`) : il relancerait le rendu à l'infini.
  const modulesBruts = useAuthStore((s) => s.user?.modules);

  const largeur = largeurMenu(width);
  const sens = rtl ? -1 : 1;

  // `monte` : le tiroir reste affiché pendant son animation de fermeture.
  const [monte, setMonte] = useState(false);
  if (ouvert && !monte) setMonte(true);
  const [progression] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (ouvert) {
      // Ouverture à ressort (léger rebond, caché par le débord du tiroir) ; fermeture vive qui accélère en partant.
      Animated.spring(progression, { toValue: 1, damping: 19, stiffness: 190, mass: 0.9, useNativeDriver: true }).start();
    } else {
      Animated.timing(progression, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMonte(false);
      });
    }
  }, [ouvert, progression]);
  useRetourMenuLateral(ouvert, fermer);

  // Geste : tirer le tiroir vers le bord le suit au doigt ; lâché assez loin (ou vite), il se ferme, sinon il revient.
  // Les valeurs du moment (largeur, sens d'écriture) sont relues à chaque geste.
  const [pan] = useState(() => {
    const largeurDuTiroir = () => largeurMenu(Dimensions.get('window').width);
    const sensEcriture = () => (useLangStore.getState().lang === 'ar' ? -1 : 1);
    const tire = (dx: number) => Math.max(0, dx * sensEcriture());
    const revenir = () => Animated.spring(progression, { toValue: 1, damping: 19, stiffness: 190, useNativeDriver: true }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && g.dx * sensEcriture() > 0,
      onPanResponderGrant: () => progression.stopAnimation(),
      onPanResponderMove: (_, g) => progression.setValue(Math.max(0, 1 - tire(g.dx) / largeurDuTiroir())),
      onPanResponderRelease: (_, g) => {
        if (tire(g.dx) > largeurDuTiroir() * 0.3 || g.vx * sensEcriture() > 0.7) useMenuStore.getState().fermer();
        else revenir();
      },
      onPanResponderTerminate: revenir,
    });
  });

  if (!monte) return null;

  const entrees =
    role === 'superadmin' ? MENU_SUPERADMIN
      : role === 'admin' ? MENU_ADMIN.filter((m) => (modulesBruts ?? []).includes(m.module ?? ''))
        : MENU_UTILISATEUR;
  const libelleRole = role === 'superadmin' ? t('Super Administrateur') : t(user?.type ?? 'Utilisateur');

  /**
   * Chaque rangée apparaît l'une après l'autre : elle glisse depuis le bord, grossit un peu et sort de la transparence,
   * avec un léger retard sur la précédente (cascade). `rang` 0 = le globe de langue, puis les entrées.
   */
  const apparition = (rang: number) => {
    const debut = Math.min(0.16 + rang * 0.06, 0.62);
    const fin = Math.min(debut + 0.4, 1);
    const plage = { inputRange: [0, debut, fin, 1], extrapolate: 'clamp' as const };
    return {
      opacity: progression.interpolate({ ...plage, outputRange: [0, 0, 1, 1] }),
      transform: [
        { translateX: progression.interpolate({ ...plage, outputRange: [34 * sens, 34 * sens, 0, 0] }) },
        { scale: progression.interpolate({ ...plage, outputRange: [0.92, 0.92, 1, 1] }) },
      ],
    };
  };
  // En-tête : le texte monte légèrement et le dégradé s'éclaire avec l'ouverture.
  const entete = {
    opacity: progression.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.4, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: progression.interpolate({ inputRange: [0, 1], outputRange: [-14, 0], extrapolate: 'clamp' }) }],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.fond, { opacity: progression.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
        <Pressable accessibilityLabel={t('Fermer le menu')} style={StyleSheet.absoluteFill} onPress={fermer} />
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.tiroir,
          // Le tiroir glisse du côté du burger : la droite, ou la gauche en arabe (écriture de droite à gauche).
          rtl ? { left: -DEBORD, paddingLeft: DEBORD } : { right: -DEBORD, paddingRight: DEBORD },
          {
            width: largeur + DEBORD,
            transform: [{ translateX: progression.interpolate({ inputRange: [0, 1], outputRange: [sens * (largeur + DEBORD), 0] }) }],
          },
        ]}
      >
        <LinearGradient
          colors={gradient.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.entete, { paddingTop: insets.top + spacing.lg }]}
        >
          {/* Cercles décoratifs de l'en-tête, aux couleurs de la marque */}
          <View pointerEvents="none" style={styles.halo1} />
          <View pointerEvents="none" style={styles.halo2} />
          <Animated.View style={[styles.enteteLigne, entete]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexte}>{initiales(user?.prenom, user?.nom)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.nom} numberOfLines={1}>{`${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || t('Menu')}</Text>
              <Text style={styles.role} numberOfLines={1}>{libelleRole}</Text>
              {!!user?.incubateur?.nom && <Text style={styles.incubateur} numberOfLines={1}>{user.incubateur.nom}</Text>}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Fermer le menu')} hitSlop={10} onPress={fermer} style={styles.fermer}>
              <FontAwesome5 name="times" size={18} color="#fff" />
            </Pressable>
          </Animated.View>
        </LinearGradient>

        <ScrollView contentContainerStyle={[styles.liste, { paddingBottom: insets.bottom + spacing.lg }]} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.langue, apparition(0)]}><SelecteurLangue /></Animated.View>
          {entrees.map((m, i) => {
            const actif = chemin === m.route || chemin.startsWith(`${m.route}/`);
            return (
              <Animated.View key={m.route} style={apparition(i + 1)}>
                <Rangee
                  entree={m}
                  actif={actif}
                  rtl={rtl}
                  onPress={() => {
                    fermer();
                    ouvrir(m.route as never);
                  }}
                />
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  fond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8, 10, 25, 0.5)' },
  tiroir: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // Fond plein (blanc en thème clair) avec une ombre portée qui le détache de la page.
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  entete: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, overflow: 'hidden' },
  halo1: { position: 'absolute', width: 170, height: 170, borderRadius: 85, top: -60, right: -40, backgroundColor: 'rgba(255,255,255,0.14)' },
  halo2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, bottom: -50, left: -20, backgroundColor: 'rgba(255,255,255,0.10)' },
  enteteLigne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarTexte: { fontSize: 19, fontWeight: '800', color: '#fff' },
  nom: { fontSize: 17, fontWeight: '800', color: '#fff' },
  role: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.88)' },
  incubateur: { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  fermer: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  langue: { paddingBottom: spacing.xs },
  liste: { padding: spacing.md, gap: spacing.sm },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ligneActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  repere: { position: 'absolute', top: 10, bottom: 10, start: 0, width: 4, borderRadius: 2, backgroundColor: colors.primary },
  icone: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  titre: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});
