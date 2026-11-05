import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelecteurLangue } from '@/components/SelecteurLangue';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useRetourMenuLateral } from '@/hooks/useReculer';
import { _t, useEstRTL, useT } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import { useMenuStore } from '@/store/menu';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';

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

/**
 * Menu : tiroir qui glisse depuis la droite par-dessus la page affichée (le reste de l'écran est assombri ; un appui
 * dessus le ferme). La même liste pour tous les rôles, seules les entrées proposées changent.
 */
export function MenuLateral() {
  const t = useT();
  const rtl = useEstRTL();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { width } = useWindowDimensions();
  const ouvert = useMenuStore((s) => s.ouvert);
  const fermer = useMenuStore((s) => s.fermer);
  const role = useAuthStore((s) => s.user?.role);
  // Le sélecteur ne doit pas fabriquer de nouveau tableau (`?? []`) : il relancerait le rendu à l'infini.
  const modulesBruts = useAuthStore((s) => s.user?.modules);

  // `monte` : le tiroir reste affiché pendant son animation de fermeture.
  const [monte, setMonte] = useState(false);
  if (ouvert && !monte) setMonte(true);
  const [progression] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (ouvert) {
      Animated.timing(progression, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(progression, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMonte(false);
      });
    }
  }, [ouvert, progression]);
  useRetourMenuLateral(ouvert, fermer);

  if (!monte) return null;

  const entrees =
    role === 'superadmin' ? MENU_SUPERADMIN
      : role === 'admin' ? MENU_ADMIN.filter((m) => (modulesBruts ?? []).includes(m.module ?? ''))
        : MENU_UTILISATEUR;
  const largeur = Math.min(width * 0.78, 340);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.fond, { opacity: progression }]}>
        <Pressable accessibilityLabel={t('Fermer le menu')} style={StyleSheet.absoluteFill} onPress={fermer} />
      </Animated.View>
      <Animated.View
        style={[
          styles.tiroir,
          // Le tiroir glisse du côté du burger : la droite, ou la gauche en arabe (écriture de droite à gauche).
          rtl ? { left: 0 } : { right: 0 },
          { width: largeur, transform: [{ translateX: progression.interpolate({ inputRange: [0, 1], outputRange: [rtl ? -largeur : largeur, 0] }) }] },
        ]}
      >
        <SafeAreaView style={styles.contenu} edges={['top', 'bottom']}>
          <View style={styles.entete}>
            <Text style={styles.enteteTitre}>{t('Menu')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Fermer le menu')} hitSlop={10} onPress={fermer} style={styles.fermer}>
              <FontAwesome5 name="times" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.langue}><SelecteurLangue /></View>
          <ScrollView contentContainerStyle={styles.liste}>
            {entrees.map((m) => (
              <Pressable
                key={m.route}
                style={({ pressed }) => [styles.ligne, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  fermer();
                  ouvrir(m.route as never);
                }}
              >
                <View style={styles.icone}><FontAwesome5 name={m.icone} size={16} color={colors.primary} /></View>
                <Text style={styles.titre}>{t(m.titre)}</Text>
                <FontAwesome5 name={rtl ? 'angle-left' : 'angle-right'} size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  fond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  tiroir: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  contenu: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  enteteTitre: { fontSize: 20, fontWeight: '700', color: colors.text },
  langue: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  fermer: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  liste: { padding: spacing.md, gap: spacing.sm },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icone: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  titre: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});
