import type { FontAwesome5 } from '@expo/vector-icons';
import type { ReactNode } from 'react';

export type IconeChamp = React.ComponentProps<typeof FontAwesome5>['name'];

/** Fichier choisi sur le téléphone, envoyé en multipart sous le nom de champ `champ`. */
export interface Fichier {
  champ: string;
  uri: string;
  name: string;
  mimeType?: string;
}

export type TypeChamp =
  | 'text'
  | 'textarea'
  | 'password'
  | 'choix'
  | 'date'
  | 'time'
  | 'nombre'
  | 'fichiers'
  | 'utilisateur'
  | 'utilisateurs'
  | 'reference'
  | 'couleur';

export interface ChampDef {
  nom: string;
  label: string;
  type: TypeChamp;
  options?: string[];
  /** choix : texte affiché pour chaque valeur (ex. { cheque: 'Chèque' }). */
  libelles?: Record<string, string>;
  /** reference : clé de la liste dans la réponse de `source`, et texte affiché pour chaque élément. */
  cleListe?: string;
  libelleOption?: (x: any) => string;
  requis?: boolean;
  /** Affiché seulement à la création / seulement à la modification. */
  creation?: boolean;
  modification?: boolean;
  aide?: string;
  placeholder?: string;
  /** Icône devant le champ ; sinon une icône par défaut selon le type du champ. */
  icone?: IconeChamp;
  /** fichiers : plusieurs fichiers possibles. */
  multiple?: boolean;
  /** utilisateur(s) : chemin (sous /mobile/admin/) de la liste des utilisateurs à choisir. */
  source?: string;
}

/** Ce que la liste donne à son en-tête : filtres actifs et moyen d'en changer un. */
export interface ContexteListe {
  filtres: Record<string, string>;
  choisirFiltre: (param: string, valeur: string) => void;
}

export interface FiltreDef {
  param: string;
  options: { value: string; label: string }[];
  defaut?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- les réponses de l'API admin sont décrites par la config de chaque module */
export interface ModuleDef {
  cle: string;
  /** Espace de l'API : 'admin' par défaut, 'superadmin' pour les modules du Super Admin. */
  base?: 'admin' | 'superadmin';
  titre: string;
  titreSingulier: string;
  /** Nom féminin (« Nouvelle offre », « Aucune offre ») ; sinon masculin (« Nouveau projet », « Nouvel incubateur »). */
  feminin?: boolean;
  icone: string;
  /** Clé de permissions du backend (ADMIN_MODULES). */
  module: string;
  liste: {
    chemin: string;
    cle: string;
    recherche?: string;
    placeholder?: string;
    filtres?: FiltreDef[];
    /** Filtres reçus seulement par l'adresse (ex. `?plan=pro`, `?mois=2026-10` depuis un graphique du tableau de bord). */
    parametresUrl?: { param: string; libelle: string }[];
    titre: (x: any) => string;
    sousTitre: (x: any) => string;
    badge?: (x: any) => string | null;
    entete?: (reponse: any, ctx: ContexteListe) => ReactNode;
    actions?: (x: any, rafraichir: () => void) => ReactNode;
  };
  detail: { chemin: (id: string) => string; cle?: string };
  champs: ChampDef[];
  /** Formulaire présenté comme une carte d'identité (photo à gauche, informations à droite puis vers le bas). */
  carteIdentite?: boolean;
  valeursInitiales: (item: any) => Record<string, any>;
  /** Valeurs proposées à l'ouverture du formulaire de création (ex. date du jour). */
  valeursCreation?: () => Record<string, any>;
  creer: string;
  modifier: (id: string) => string;
  supprimer?: (id: string) => string;
  messageSuppression: string;
}
