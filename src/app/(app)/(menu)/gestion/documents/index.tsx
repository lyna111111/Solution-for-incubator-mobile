import { adminGet } from '@/admin/api';
import { Compteurs, LigneListe, ListeAdmin } from '@/admin/ui';
import { DocumentLink } from '@/components/DocumentLink';
import { useT } from '@/i18n';

/** Filtre « type de document » (paramètre `label` de l'API) appliqué par une carte de chiffres. */
const parType = (valeur: string) => ({ ['label']: valeur });

export default function GestionDocuments() {
  const t = useT();
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
      entete={(r, ctx) => (
        <Compteurs ctx={ctx} valeurs={[
          { label: 'Total', valeur: r.compteurs.total, filtre: parType('') },
          { label: 'Événements', valeur: r.compteurs.evenement, filtre: parType('Evenement') },
          { label: 'Requêtes', valeur: r.compteurs.requete, filtre: parType('Requete') },
          { label: 'Réponses', valeur: r.compteurs.reponse, filtre: parType('Reponse') },
          { label: 'Articles', valeur: r.compteurs.article, filtre: parType('Article') },
        ]} />
      )}
      vide="Aucun document à afficher."
      renderItem={(d) => (
        <LigneListe
          key={d.id}
          titre={d.titre}
          sousTitre={`${t(d.label)} · ${t(d.type)} · ${String(d.created_at).slice(0, 10)}`}
          pied={<DocumentLink document={d} />}
        />
      )}
    />
  );
}
