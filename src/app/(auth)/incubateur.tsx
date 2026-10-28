import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { fetchIncubateurs } from '@/api/endpoints';
import { ErrorState, Loading } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { colors, gradient, radius, shadow, spacing } from '@/theme';
import type { Tenant } from '@/types';

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

const ATOUTS: { icon: IconName; label: string }[] = [
  { icon: 'lightbulb', label: 'Projets' },
  { icon: 'calendar-alt', label: 'Événements' },
  { icon: 'comments', label: 'Requêtes' },
  { icon: 'bell', label: 'Alertes' },
];

export default function ChoixIncubateur() {
  const insets = useSafeAreaInsets();
  const setTenant = useAuthStore((s) => s.setTenant);
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['incubateurs'],
    queryFn: fetchIncubateurs,
  });

  // Apparition douce du héros puis de la feuille de choix.
  const [apparition] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(apparition, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  }, [apparition]);
  const monte = {
    opacity: apparition,
    transform: [{ translateY: apparition.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  async function choisir(tenant: Tenant) {
    await setTenant(tenant);
    router.replace('/login');
  }

  return (
    <LinearGradient colors={[colors.navy, '#2b1366', colors.primaryDark]} style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#fff"
            colors={[colors.primary]}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Halos décoratifs aux couleurs de la marque */}
        <View pointerEvents="none" style={[styles.halo, styles.haloViolet]} />
        <View pointerEvents="none" style={[styles.halo, styles.haloCyan]} />

        <Animated.View style={[styles.hero, { paddingTop: insets.top + spacing.xl }, monte]}>
          <View style={styles.brandRow}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="cover" />
            <View>
              <Text style={styles.brand}>Solution</Text>
              <Text style={styles.brandSub}>for Incubator</Text>
            </View>
          </View>

          <Text style={styles.headline}>
            De l&apos;idée au succès,{'\n'}
            <Text style={styles.headlineAccent}>votre incubateur</Text> dans la poche.
          </Text>
          <Text style={styles.lead}>
            Suivez vos projets, participez aux événements et échangez avec votre équipe d&apos;accompagnement, où que vous
            soyez.
          </Text>

          <View style={styles.atouts}>
            {ATOUTS.map((a) => (
              <View key={a.label} style={styles.atout}>
                <View style={styles.atoutIcon}>
                  <FontAwesome5 name={a.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.atoutLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }, monte]}>
          <View style={styles.grip} />
          <Text style={styles.sheetTitle}>Choisissez votre incubateur</Text>
          <Text style={styles.sheetSub}>Sélectionnez la structure à laquelle vous appartenez pour vous connecter.</Text>

          {isLoading ? (
            <View style={{ height: 160 }}>
              <Loading />
            </View>
          ) : error ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          ) : (
            <View style={{ gap: spacing.md }}>
              {(data ?? []).map((inc) => (
                <Pressable
                  key={inc.slug}
                  accessibilityRole="button"
                  onPress={() => void choisir(inc)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <LinearGradient
                    colors={gradient.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{inc.nom.trim().charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {inc.nom}
                    </Text>
                    <Text style={styles.itemHint}>Accéder à mon espace</Text>
                  </View>
                  <View style={styles.go}>
                    <FontAwesome5 name="arrow-right" size={12} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
              {data?.length === 0 && <Text style={styles.empty}>Aucun incubateur actif pour le moment.</Text>}

              {/* Le Super Admin gère tous les incubateurs : aucun incubateur n'est annoncé au serveur. */}
              <Pressable
                accessibilityRole="button"
                onPress={() => void choisir({ nom: 'Super Admin', slug: '' })}
                style={styles.superAdmin}
              >
                <FontAwesome5 name="user-shield" size={13} color={colors.textMuted} />
                <Text style={styles.superAdminText}>Espace Super Admin</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },

  halo: { position: 'absolute', borderRadius: 999 },
  haloViolet: { width: 320, height: 320, top: -90, right: -110, backgroundColor: 'rgba(138,63,252,0.35)' },
  haloCyan: { width: 220, height: 220, top: 170, left: -110, backgroundColor: 'rgba(0,194,255,0.18)' },

  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl + spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl + spacing.sm },
  logo: { width: 48, height: 48, borderRadius: 14 },
  brand: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 22 },
  brandSub: { color: colors.secondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  headline: { color: '#fff', fontSize: 31, fontWeight: '800', lineHeight: 39 },
  headlineAccent: { color: colors.secondary },
  lead: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, marginTop: spacing.md },

  atouts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  atout: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  atoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  atoutLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },

  sheet: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  grip: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 4, marginBottom: spacing.xl },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
  },
  itemPressed: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  itemHint: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  go: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },

  empty: { color: colors.textMuted, textAlign: 'center' },
  superAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  superAdminText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
