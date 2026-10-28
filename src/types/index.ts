// Types alignés sur les serializers du backend Django (main/api/serializers/).

export interface Tenant {
  id?: number;
  nom: string;
  /** Vide pour l'espace Super Admin (aucun incubateur annoncé au serveur). */
  slug: string;
  couleur_primaire?: string;
  couleur_secondaire?: string;
  logo?: string | null;
}

export type Role = 'utilisateur' | 'admin' | 'superadmin';

/** Compte connecté, tel que renvoyé par /api/mobile/auth/ (les 3 rôles). */
export interface Compte {
  role: Role;
  id: number;
  nom: string;
  prenom: string;
  email: string;
  // Utilisateur
  matricule?: string | null;
  departement?: string;
  faculte?: string;
  etat?: string;
  id_projet?: number | null;
  projet_nom?: string | null;
  // Utilisateur et administrateur : type de compte
  type?: string;
  // Administrateur : modules auxquels son type donne accès
  modules?: string[];
  incubateur: Tenant | null;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: string | null;
  departement: string;
  faculte: string;
  type: string;
  etat: string;
  email_confirme: boolean;
  id_projet: number | null;
  projet_nom: string | null;
  created_at: string;
  updated_at: string;
  incubateur: number;
}

export interface LoginResponse {
  success: true;
  access: string;
  refresh: string;
  role: Role;
  user: Compte;
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  matricule?: string;
  departement?: string;
  faculte?: string;
  type: string;
  mdp: string;
  mdp_confirmation: string;
  incubateur: number;
}

/** Document : jamais d'URL directe, seulement le téléchargement protégé par jeton. */
export interface DocumentJoint {
  id: number;
  titre: string;
  type: string;
  label: string;
  download_url: string;
}

export interface Evenement {
  id: number;
  titre: string;
  type: string;
  date: string; // AAAA-MM-JJ
  heure_debut: string | null; // HH:MM
  heure_fin: string | null;
  lieu: string | null;
  description: string | null;
  max_participants: number | null;
  participants_actuels: number;
  places_restantes: number | null;
  documents?: DocumentJoint[];
}

export interface EvenementsDuMois {
  annee: number;
  mois: number;
  type: string;
  nb_jours: number;
  /** Jours du mois ayant des événements -> types. */
  jours: Record<string, string[]>;
  evenements: Evenement[];
}

export type CategorieStatut = 'attente' | 'traitee' | 'rejetee';

export interface RequeteResume {
  id: number;
  objet: string;
  type_requete: string;
  status: string;
  statut: CategorieStatut;
  dateSoumission: string;
  nb_reponses: number | null;
}

export interface ReponseRequete {
  id: number;
  contenu: string | null;
  administrateur: string;
  dateSoumission: string;
  documents: DocumentJoint[];
}

export interface RequeteDetail extends RequeteResume {
  contenu: string;
  documents: DocumentJoint[];
  reponses: ReponseRequete[];
}

export interface Pagination {
  page: number;
  nb_pages: number;
  total: number;
  a_precedent: boolean;
  a_suivant: boolean;
}

export interface ListeRequetes {
  requetes: RequeteResume[];
  compteurs: { total: number; en_attente: number; traitees: number; rejetees: number };
  filtre: string;
  recherche: string;
  pagination: Pagination;
}

export interface PieceJointe {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface NouvelleRequete {
  objet: string;
  contenu: string;
  type_requete: string;
  document_type?: string;
  piece?: PieceJointe;
}

export interface Notification {
  id: number;
  titre: string;
  message: string | null;
  type: string;
  mode: string;
  read: boolean;
  created_at: string;
}

export interface CompteursNotifications {
  total: number;
  requete: number;
  evenement: number;
  incubateur: number;
  article: number;
  systeme: number;
}

export interface ArticleResume {
  id: number;
  titre: string;
  auteur: string;
  created_at: string;
}

export interface ListeArticles {
  articles: ArticleResume[];
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  currentPage: number;
  lastPage: number;
}

export interface Article {
  id: number;
  titre: string;
  auteur: string;
  contenu: string;
  created_at: string;
  updated_at: string;
  document: DocumentJoint | null;
}

export interface ProjetUtilisateur {
  id: number;
  intitule: string;
  theme: string;
  description: string;
  chef_projet: string;
  membres: string[];
  progression: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeProjet {
  id: number;
  intitule: string;
  theme: string;
  progression: number;
}

export interface AccueilUtilisateur {
  utilisateur: Compte;
  evenements_a_venir_total: number;
  evenements_a_venir: Evenement[];
  requetes_total: number;
  requetes_en_attente: number;
  requetes_recentes: RequeteResume[];
  notifications_non_lues: number;
  notifications_recentes: Notification[];
  projet: ResumeProjet | null;
}
