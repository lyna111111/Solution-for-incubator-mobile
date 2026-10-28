import { router } from 'expo-router';

import { adminGet } from '@/admin/api';
import { Compteurs, LigneListe, ListeAdmin } from '@/admin/ui';
import { formatDateTime } from '@/utils/format';

export default function GestionNotifications() {
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
      entete={(r) => (
        <Compteurs valeurs={[
          { label: 'Diffusions', valeur: r.compteurs.broadcast_total }, { label: 'Personnelles', valeur: r.compteurs.unicast_total },
          { label: "Aujourd'hui", valeur: r.compteurs.broadcast_jour + r.compteurs.unicast_jour },
          { label: 'Cette semaine', valeur: r.compteurs.broadcast_semaine + r.compteurs.unicast_semaine },
        ]} />
      )}
      action={{ titre: 'Nouvelle notification', onPress: () => router.push('/gestion/notifications/nouveau') }}
      vide="Aucune notification à afficher."
      renderItem={(n) => (
        <LigneListe
          key={n.id}
          titre={n.titre}
          sousTitre={`${n.destinataire ? `Pour ${n.destinataire} · ` : ''}${formatDateTime(n.created_at)}\n${n.message ?? ''}`}
          onPress={() => router.push(`/gestion/notifications/${n.id}`)}
        />
      )}
    />
  );
}
