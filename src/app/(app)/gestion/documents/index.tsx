import { adminGet } from '@/admin/api';
import { Compteurs, LigneListe, ListeAdmin } from '@/admin/ui';
import { DocumentLink } from '@/components/DocumentLink';

export default function GestionDocuments() {
  return (
    <ListeAdmin
      titre="Feedback des Documents"
      queryKey={['admin', 'documents', 'liste']}
      charger={({ page, recherche, filtres }) =>
        adminGet('documents/', { page, ...(filtres.label ? { label: filtres.label } : {}), ...(recherche ? { query: recherche } : {}) })}
      extraire={(r) => ({ items: r.documents, pagination: r.pagination })}
      placeholderRecherche="Titre du document..."
      filtres={[{ param: 'label', defaut: '', options: [
        { value: '', label: 'Tous' }, { value: 'Evenement', label: 'Événements' }, { value: 'Requete', label: 'Requêtes' },
        { value: 'Reponse', label: 'Réponses' }, { value: 'Article', label: 'Articles' }] }]}
      entete={(r) => (
        <Compteurs valeurs={[
          { label: 'Total', valeur: r.compteurs.total }, { label: 'Événements', valeur: r.compteurs.evenement },
          { label: 'Requêtes', valeur: r.compteurs.requete }, { label: 'Réponses', valeur: r.compteurs.reponse },
          { label: 'Articles', valeur: r.compteurs.article },
        ]} />
      )}
      vide="Aucun document à afficher."
      renderItem={(d) => (
        <LigneListe
          key={d.id}
          titre={d.titre}
          sousTitre={`${d.label} · ${d.type} · ${String(d.created_at).slice(0, 10)}`}
          pied={<DocumentLink document={d} />}
        />
      )}
    />
  );
}
