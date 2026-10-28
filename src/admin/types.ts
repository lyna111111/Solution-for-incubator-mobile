import type { ReactNode } from 'react';

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
  | 'reference';

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
  /** fichiers : plusieurs fichiers possibles. */
  multiple?: boolean;
  /** utilisateur(s) : chemin (sous /mobile/admin/) de la liste des utilisateurs à choisir. */
  source?: string;
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
  icone: string;
  /** Clé de permissions du backend (ADMIN_MODULES). */
  module: string;
  liste: {
    chemin: string;
    cle: string;
    recherche?: string;
    placeholder?: string;
    filtres?: FiltreDef[];
    titre: (x: any) => string;
    sousTitre: (x: any) => string;
    badge?: (x: any) => string | null;
    entete?: (reponse: any) => ReactNode;
    actions?: (x: any, rafraichir: () => void) => ReactNode;
  };
  detail: { chemin: (id: string) => string; cle?: string };
  champs: ChampDef[];
  valeursInitiales: (item: any) => Record<string, any>;
  /** Valeurs proposées à l'ouverture du formulaire de création (ex. date du jour). */
  valeursCreation?: () => Record<string, any>;
  creer: string;
  modifier: (id: string) => string;
  supprimer?: (id: string) => string;
  messageSuppression: string;
}
