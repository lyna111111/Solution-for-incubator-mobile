import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { useEstRTL, useT } from '@/i18n';
import type { Evenement, Notification, RequeteResume } from '@/types';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { couleurStatut, formatDate, formatDateTime, LIBELLE_STATUT } from '@/utils/format';

import { Badge, Card } from './ui';

function Chevron() {
  const colors = useColors();
  const rtl = useEstRTL();
  return <FontAwesome5 name={rtl ? 'angle-left' : 'angle-right'} size={18} color={colors.textMuted} />;
}

export function EvenementRow({ evenement }: { evenement: Evenement }) {
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  const horaire = [evenement.heure_debut, evenement.heure_fin].filter(Boolean).join(' - ');
  return (
    <Pressable onPress={() => ouvrir(`/evenements/${evenement.id}`)}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title}>{evenement.titre}</Text>
          <Text style={styles.meta}>
            {formatDate(evenement.date)}
            {horaire ? ` · ${horaire}` : ''}
          </Text>
          {!!evenement.lieu && <Text style={styles.meta}>{evenement.lieu}</Text>}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
            <Badge label={t(evenement.type)} fond={colors.primarySoft} texte={colors.primaryDark} />
            {evenement.places_restantes !== null && (
              <Badge
                label={evenement.places_restantes === 0 ? t('Complet') : t('{n} places', { n: evenement.places_restantes })}
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
  const t = useT();
  const { fond, texte } = couleurStatut(useColors())[statut];
  return <Badge label={t(LIBELLE_STATUT[statut])} fond={fond} texte={texte} />;
}

export function RequeteRow({ requete }: { requete: RequeteResume }) {
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  return (
    <Pressable onPress={() => ouvrir(`/requetes/${requete.id}`)}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title} numberOfLines={2}>
            {requete.objet}
          </Text>
          <Text style={styles.meta}>
            {t(requete.type_requete)} · {formatDate(requete.dateSoumission)}
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
  const t = useT();
  const ouvrir = useOuvrir();
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable onPress={() => ouvrir(`/notifications/${notification.id}`)}>
      <Card style={[styles.card, !notification.read && styles.nonLue]}>
        <View style={[styles.dot, { backgroundColor: notification.read ? 'transparent' : colors.unread }]} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, !notification.read && { fontWeight: '800' }]} numberOfLines={2}>
            {notification.titre}
          </Text>
          <Text style={[styles.meta, !notification.read && { color: colors.text }]}>
            {t(notification.type)} · {formatDateTime(notification.created_at)}
          </Text>
        </View>
        <Chevron />
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5 },
  nonLue: { backgroundColor: colors.unreadFond, borderColor: colors.primary },
});
