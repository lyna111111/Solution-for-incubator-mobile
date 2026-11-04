import type { FontAwesome5 } from '@expo/vector-icons';

export type IconeLibelle = React.ComponentProps<typeof FontAwesome5>['name'];

// Mot-clé du libellé -> icône. Le premier mot-clé trouvé gagne, donc les plus précis sont en tête.
const REGLES: [string, IconeLibelle][] = [
  ['mot de passe', 'lock'],
  ['email', 'envelope'],
  ['e-mail', 'envelope'],
  ['telephone', 'phone'],
  ['adresse', 'map-marker-alt'],
  ['matricule', 'id-badge'],
  ['prenom', 'user'],
  ['chef de projet', 'user-tie'],
  ['administrateur', 'user-shield'],
  ['type de compte', 'user-tag'],
  ['participants', 'users'],
  ['membres', 'users'],
  ['incubateur', 'building'],
  ['departement', 'building'],
  ['faculte', 'university'],
  ['limite', 'sliders-h'],
  ['projet', 'rocket'],
  ['theme', 'tag'],
  ['intitule', 'rocket'],
  ['sujet', 'heading'],
  ['objet', 'heading'],
  ['titre', 'heading'],
  ['auteur', 'user-edit'],
  ['description', 'align-left'],
  ['contenu', 'align-left'],
  ['message', 'comment-dots'],
  ['notes', 'sticky-note'],
  ['horaire', 'clock'],
  ['heure', 'clock'],
  ['date', 'calendar-alt'],
  ['lieu', 'map-marker-alt'],
  ['statut', 'info-circle'],
  ['etat', 'user-check'],
  ['progression', 'percentage'],
  ['prix', 'money-bill-wave'],
  ['paiement', 'credit-card'],
  ['montant', 'money-bill-wave'],
  ['methode', 'credit-card'],
  ['offre', 'tags'],
  ['plan', 'tags'],
  ['abonnement', 'file-contract'],
  ['couleur', 'palette'],
  ['icone', 'icons'],
  ['fonctionnalites', 'list-ul'],
  ['document', 'paperclip'],
  ['piece', 'paperclip'],
  ['type', 'tag'],
  ['identifiant', 'link'],
  ['nom', 'user'],
];

const ACCENTS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

/** Icône qui convient à un libellé de champ ou d'information (« Email » -> enveloppe, « Date » -> calendrier...). */
export function iconeLibelle(libelle: string, defaut: IconeLibelle = 'pen'): IconeLibelle {
  const texte = libelle.normalize('NFD').replace(ACCENTS, '').toLowerCase();
  return REGLES.find(([mot]) => texte.includes(mot))?.[1] ?? defaut;
}
