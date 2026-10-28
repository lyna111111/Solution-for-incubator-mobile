import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { fetchIncubateurs } from '@/api/endpoints';
import { AuthShell } from '@/components/AuthShell';
import { Card, ErrorState, Loading } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme';
import type { Tenant } from '@/types';

export default function ChoixIncubateur() {
  const setTenant = useAuthStore((s) => s.setTenant);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['incubateurs'],
    queryFn: fetchIncubateurs,
  });

  async function choisir(tenant: Tenant) {
    await setTenant(tenant);
    router.replace('/login');
  }

  return (
    <AuthShell title="Votre incubateur" subtitle="Choisissez l'incubateur auquel vous appartenez pour continuer.">
      {isLoading ? (
        <View style={{ height: 160 }}>
          <Loading />
        </View>
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <View style={{ gap: spacing.md }}>
          {(data ?? []).map((inc) => (
            <Pressable key={inc.slug} onPress={() => void choisir(inc)}>
              <Card style={styles.item}>
                <Text style={styles.name}>{inc.nom}</Text>
                <Text style={styles.chevron}>›</Text>
              </Card>
            </Pressable>
          ))}
          {data?.length === 0 && <Text style={styles.empty}>Aucun incubateur actif pour le moment.</Text>}

          {/* Le Super Admin gère tous les incubateurs : aucun incubateur n'est annoncé au serveur. */}
          <Pressable onPress={() => void choisir({ nom: 'Super Admin', slug: '' })} style={styles.superAdmin}>
            <Text style={styles.superAdminText}>Espace Super Admin</Text>
          </Pressable>
        </View>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 24, color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center' },
  superAdmin: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  superAdminText: { color: colors.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
