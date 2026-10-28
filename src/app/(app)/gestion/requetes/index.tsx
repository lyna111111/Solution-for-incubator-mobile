import { router } from 'expo-router';

import { adminGet } from '@/admin/api';
import { Compteurs, LigneListe, ListeAdmin } from '@/admin/ui';
import { StatutBadge } from '@/components/rows';
import { View } from 'react-native';
import { formatDate } from '@/utils/format';

export default function GestionRequetes() {
  return (
    <ListeAdmin
      titre="Gestion des Requêtes"
      queryKey={['admin', 'requetes', 'liste']}
      charger={({ page, recherche, filtres }) =>
        adminGet('requetes/', { page, ...(filtres.status ? { status: filtres.status } : {}), ...(recherche ? { search: recherche } : {}) })}
      extraire={(r) => ({ items: r.requetes, pagination: r.pagination })}
      placeholderRecherche="Sujet de la requête..."
      filtres={[{ param: 'status', defaut: '', options: [
        { value: '', label: 'Toutes' }, { value: 'En attente', label: 'En attente' },
        { value: 'Traitee', label: 'Traitées' }, { value: 'Rejetee', label: 'Rejetées' }] }]}
      entete={(r) => (
        <Compteurs valeurs={[
          { label: 'Total', valeur: r.compteurs.total }, { label: 'En attente', valeur: r.compteurs.en_attente },
          { label: 'Traitées', valeur: r.compteurs.traitees }, { label: 'Rejetées', valeur: r.compteurs.rejetees },
        ]} />
      )}
      vide="Aucune requête à afficher."
      renderItem={(r) => (
        <LigneListe
          key={r.id}
          titre={r.objet}
          sousTitre={`${r.utilisateur?.nom ?? 'Visiteur non inscrit'} · ${r.type_requete} · ${formatDate(r.dateSoumission)}`}
          onPress={() => router.push(`/gestion/requetes/${r.id}`)}
          pied={<View style={{ flexDirection: 'row' }}><StatutBadge statut={r.statut} /></View>}
        />
      )}
    />
  );
}
