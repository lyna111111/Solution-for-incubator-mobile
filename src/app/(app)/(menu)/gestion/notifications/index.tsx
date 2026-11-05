
import { adminGet } from '@/admin/api';
import { Compteurs, LigneListe, ListeAdmin } from '@/admin/ui';
import { useOuvrir } from '@/hooks/useOuvrir';
import { useT } from '@/i18n';
import { formatDateTime } from '@/utils/format';

export default function GestionNotifications() {
  const t = useT();
  const ouvrir = useOuvrir();
  return (
    <ListeAdmin
      titre="Gestion des Notifications"
      queryKey={['admin', 'notifications', 'liste']}
      charger={({ page, recherche, filtres }) =>
        adminGet('notifications/', { page, mode: filtres.mode, ...(recherche ? { search: recherche } : {}) })}
      extraire={(r) => ({ items: r.notifications, pagination: r.pagination })}
      placeholderRecherche="Titre, message ou destinataire..."
      filtres={[{ param: 'mode', defaut: 'broadcast', options: [
        { value: 'broadcast', label: 'Diffusions' }, { value: 'unicast', label: 'Personnelles' }] }]}
      entete={(r, ctx) => (
        <Compteurs ctx={ctx} valeurs={[
          { label: 'Diffusions', valeur: r.compteurs.broadcast_total, filtre: { mode: 'broadcast' } },
          { label: 'Personnelles', valeur: r.compteurs.unicast_total, filtre: { mode: 'unicast' } },
          { label: "Aujourd'hui", valeur: r.compteurs.broadcast_jour + r.compteurs.unicast_jour },
          { label: 'Cette semaine', valeur: r.compteurs.broadcast_semaine + r.compteurs.unicast_semaine },
        ]} />
      )}
      action={{ titre: t('Nouvelle notification'), onPress: () => ouvrir('/gestion/notifications/nouveau') }}
      vide="Aucune notification à afficher."
      renderItem={(n) => (
        <LigneListe
          key={n.id}
          titre={n.titre}
          sousTitre={`${n.destinataire ? `${t('Pour {nom}', { nom: n.destinataire })} · ` : ''}${formatDateTime(n.created_at)}\n${n.message ?? ''}`}
          onPress={() => ouvrir(`/gestion/notifications/${n.id}`)}
        />
      )}
    />
  );
}
