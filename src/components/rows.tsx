import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Evenement, Notification, RequeteResume } from '@/types';
import { colors, spacing } from '@/theme';
import { COULEUR_STATUT, formatDate, formatDateTime, LIBELLE_STATUT } from '@/utils/format';

import { Badge, Card } from './ui';

function Chevron() {
  return <FontAwesome5 name="angle-right" size={18} color={colors.textMuted} />;
}

export function EvenementRow({ evenement }: { evenement: Evenement }) {
  const horaire = [evenement.heure_debut, evenement.heure_fin].filter(Boolean).join(' - ');
  return (
    <Pressable onPress={() => router.push(`/evenements/${evenement.id}`)}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title}>{evenement.titre}</Text>
          <Text style={styles.meta}>
            {formatDate(evenement.date)}
            {horaire ? ` · ${horaire}` : ''}
          </Text>
          {!!evenement.lieu && <Text style={styles.meta}>{evenement.lieu}</Text>}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
            <Badge label={evenement.type} fond={colors.primarySoft} texte={colors.primaryDark} />
            {evenement.places_restantes !== null && (
              <Badge
                label={evenement.places_restantes === 0 ? 'Complet' : `${evenement.places_restantes} places`}
                fond={evenement.places_restantes === 0 ? colors.dangerSoft : colors.successSoft}
                texte={evenement.places_restantes === 0 ? colors.danger : colors.success}
              />
            )}
          </View>
        </View>
        <Chevron />
      </Card>
    </Pressable>
  );
}

export function StatutBadge({ statut }: { statut: RequeteResume['statut'] }) {
  return <Badge label={LIBELLE_STATUT[statut]} fond={COULEUR_STATUT[statut].fond} texte={COULEUR_STATUT[statut].texte} />;
}

export function RequeteRow({ requete }: { requete: RequeteResume }) {
  return (
    <Pressable onPress={() => router.push(`/requetes/${requete.id}`)}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title} numberOfLines={2}>
            {requete.objet}
          </Text>
          <Text style={styles.meta}>
            {requete.type_requete} · {formatDate(requete.dateSoumission)}
          </Text>
          <View style={{ marginTop: 4 }}>
            <StatutBadge statut={requete.statut} />
          </View>
        </View>
        <Chevron />
      </Card>
    </Pressable>
  );
}

export function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <Pressable onPress={() => router.push(`/notifications/${notification.id}`)}>
      <Card style={styles.card}>
        <View style={[styles.dot, { backgroundColor: notification.read ? 'transparent' : colors.unread }]} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, !notification.read && { fontWeight: '800' }]} numberOfLines={2}>
            {notification.titre}
          </Text>
          <Text style={styles.meta}>
            {notification.type} · {formatDateTime(notification.created_at)}
          </Text>
        </View>
        <Chevron />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
