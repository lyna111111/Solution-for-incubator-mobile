import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adminGet } from '@/admin/api';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useAuthStore } from '@/store/auth';
import { type Palette, spacing, useColors, useStyles } from '@/theme';
import { formatDate, formatDateTime } from '@/utils/format';

import { Pastilles, SectionCarte } from './DashboardUi';
import { StatutBadge } from './rows';
import { Badge } from './ui';

/** Nombre de lignes affichées dans chaque liste de l'accueil (la liste complète est derrière « Voir plus »). */
const MAX = 5;

/** Clé commune : le tirer-pour-actualiser de l'accueil recharge toutes ces sections d'un coup. */
export const CLE_SECTIONS = ['admin', 'accueil'] as const;

/** Vrai si le type d'administrateur donne accès à ce module (sinon la section n'est pas affichée). */
function useAcces(module: string): boolean {
  return useAuthStore((s) => !!s.user?.modules?.includes(module));
}

/** Une ligne cliquable d'une liste de l'accueil : titre, détail, élément à droite et flèche. */
function Ligne({ titre, detail, droite, onPress }: { titre: string; detail?: string; droite?: React.ReactNode; onPress: () => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={styles.ligne}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.ligneTitre} numberOfLines={2}>{titre}</Text>
        {!!detail && <Text style={styles.ligneDetail} numberOfLines={1}>{detail}</Text>}
      </View>
      {droite}
      <FontAwesome5 name="angle-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function Vide({ message }: { message: string }) {
  const styles = useStyles(createStyles);
  return <Text style={styles.vide}>{message}</Text>;
}

function SousTitre({ children }: { children: string }) {
  const styles = useStyles(createStyles);
  return <Text style={styles.sousTitre}>{children}</Text>;
}

/** Requêtes : répartition par statut et dernières requêtes reçues. */
export function SectionRequetes() {
  const ouvrir = useOuvrir();
  const colors = useColors();
  const acces = useAcces('requetes');
  const { data } = useQuery({ queryKey: [...CLE_SECTIONS, 'requetes'], queryFn: () => adminGet('requetes/'), enabled: acces });
  if (!acces || !data) return null;
  const c = data.compteurs;
  return (
    <SectionCarte icone="tasks" couleur={colors.info} titre="Requêtes" route="/gestion/requetes">
      <Pastilles valeurs={[
        { label: 'En attente', valeur: c.en_attente, icone: 'hourglass-half', couleur: colors.warning, fond: colors.warningSoft },
        { label: 'Traitées', valeur: c.traitees, icone: 'check-circle', couleur: colors.success, fond: colors.successSoft },
        { label: 'Rejetées', valeur: c.rejetees, icone: 'times-circle', couleur: colors.danger, fond: colors.dangerSoft },
      ]} />
      <SousTitre>Dernières requêtes reçues</SousTitre>
      {data.requetes.length === 0 && <Vide message="Aucune requête reçue." />}
      {data.requetes.slice(0, MAX).map((r: any) => (
        <Ligne key={r.id} titre={r.objet}
          detail={`${r.utilisateur?.nom ?? 'Utilisateur supprimé'} · ${formatDate(r.dateSoumission)}`}
          droite={<StatutBadge statut={r.statut} />} onPress={() => ouvrir(`/gestion/requetes/${r.id}`)} />
      ))}
    </SectionCarte>
  );
}

/** Événements : à venir / aujourd'hui / passés et prochains événements. */
export function SectionEvenements() {
  const ouvrir = useOuvrir();
  const colors = useColors();
  const acces = useAcces('evenements');
  const { data } = useQuery({
    queryKey: [...CLE_SECTIONS, 'evenements'], queryFn: () => adminGet('evenements/', { periode: 'avenir' }), enabled: acces,
  });
  if (!acces || !data) return null;
  const c = data.compteurs;
  return (
    <SectionCarte icone="calendar-alt" couleur={colors.success} titre="Prochains événements" route="/gestion/evenements">
      <Pastilles valeurs={[
        { label: 'À venir', valeur: c.a_venir, icone: 'calendar-plus', couleur: colors.info, fond: colors.infoSoft },
        { label: "Aujourd'hui", valeur: c.aujourdhui, icone: 'calendar-day', couleur: colors.success, fond: colors.successSoft },
        { label: 'Passés', valeur: c.passes, icone: 'history', couleur: colors.textMuted, fond: colors.background },
      ]} />
      {data.evenements.length === 0 && <Vide message="Aucun événement à venir." />}
      {data.evenements.slice(0, MAX).map((e: any) => (
        <Ligne key={e.id} titre={e.titre}
          detail={[formatDate(e.date), e.heure_debut, e.lieu].filter(Boolean).join(' · ')}
          droite={<Badge label={e.type} fond={colors.primarySoft} texte={colors.primaryDark} />}
          onPress={() => ouvrir(`/gestion/evenements/${e.id}`)} />
      ))}
    </SectionCarte>
  );
}

/** Demandes d'inscription en attente d'une réponse. */
export function SectionDemandes() {
  const ouvrir = useOuvrir();
  const colors = useColors();
  const acces = useAcces('utilisateurs');
  const { data } = useQuery({
    queryKey: [...CLE_SECTIONS, 'demandes'], queryFn: () => adminGet('utilisateurs/', { etat: 'En attente' }), enabled: acces,
  });
  if (!acces || !data) return null;
  const demandes: any[] = data.utilisateurs ?? [];
  return (
    <SectionCarte icone="user-clock" couleur={colors.warning} titre="Demandes d'inscription" route="/gestion/utilisateurs">
      <Pastilles valeurs={[
        { label: 'En attente', valeur: data.compteurs?.demandes ?? demandes.length, icone: 'user-clock', couleur: colors.warning, fond: colors.warningSoft },
        { label: 'Inscrits', valeur: data.compteurs?.total ?? 0, icone: 'users', couleur: colors.primary, fond: colors.primarySoft },
      ]} />
      {demandes.length === 0 && <Vide message="Aucune demande en attente." />}
      {demandes.slice(0, MAX).map((u) => (
        <Ligne key={u.id} titre={`${u.prenom} ${u.nom}`} detail={u.email}
          droite={u.type ? <Badge label={u.type} fond={colors.primarySoft} texte={colors.primaryDark} /> : undefined}
          onPress={() => ouvrir(`/gestion/utilisateurs/${u.id}`)} />
      ))}
    </SectionCarte>
  );
}

/** Notifications envoyées par l'incubateur (accessible à tous les types d'administrateur). */
export function SectionNotifications() {
  const ouvrir = useOuvrir();
  const colors = useColors();
  const acces = useAcces('notifications');
  const { data } = useQuery({ queryKey: [...CLE_SECTIONS, 'notifications'], queryFn: () => adminGet('notifications/'), enabled: acces });
  if (!acces || !data) return null;
  const c = data.compteurs;
  return (
    <SectionCarte icone="bell" couleur={colors.danger} titre="Notifications envoyées" route="/gestion/notifications">
      <Pastilles valeurs={[
        { label: 'Diffusées', valeur: c.broadcast_total, icone: 'bullhorn', couleur: colors.primary, fond: colors.primarySoft },
        { label: 'Individuelles', valeur: c.unicast_total, icone: 'user', couleur: colors.info, fond: colors.infoSoft },
        { label: 'Cette semaine', valeur: c.broadcast_semaine + c.unicast_semaine, icone: 'calendar-week', couleur: colors.success, fond: colors.successSoft },
      ]} />
      <SousTitre>Dernières diffusions</SousTitre>
      {data.notifications.length === 0 && <Vide message="Aucune notification envoyée." />}
      {data.notifications.slice(0, MAX).map((n: any) => (
        <Ligne key={n.id} titre={n.titre} detail={formatDateTime(n.created_at)} onPress={() => ouvrir(`/gestion/notifications/${n.id}`)} />
      ))}
    </SectionCarte>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  ligneTitre: { fontSize: 14, fontWeight: '600', color: colors.text },
  ligneDetail: { fontSize: 12, color: colors.textMuted },
  sousTitre: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vide: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
});
