import { Alert, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui';
import { spacing } from '@/theme';

import { adminEnvoyer } from './api';
import type { ModuleDef } from './types';
import { Compteurs } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any -- chaque module décrit la forme de ses données */

// Valeurs acceptées par le backend (mêmes choix que les formulaires du site).
export const TYPES_UTILISATEUR = ['Etudiant', 'PorteurDeProjet', 'Encadrant', 'MembreComitéScientifique', 'MembreConseilCoordination', 'MembreCommissionTechnique'];
export const TYPES_ADMIN = ['Admin principal', "Planificateur d'événement", 'Chargé suivi de requête', 'Secrétaire'];
export const TYPES_EVENEMENT = ['Workshop', 'Conference', 'Seminaire', 'Formation', 'Autre'];
export const TYPES_DOCUMENT = ['Formulaire', 'Arrêté', 'Attestation', 'Rapport', 'Article', 'Autre'];

const tous = (liste: string[]) => [{ value: '', label: 'Tous' }, ...liste.map((t) => ({ value: t, label: t }))];

/** Boutons Accepter / Refuser d'une demande d'inscription (routes demandes/<id>/approuver|refuser). */
function ActionsDemande({ item, rafraichir }: { item: any; rafraichir: () => void }) {
  if (item.etat !== 'En attente') return null;

  function agir(action: 'approuver' | 'refuser') {
    const libelle = action === 'approuver' ? 'accepter' : 'refuser';
    Alert.alert('Demande d\'inscription', `Voulez-vous ${libelle} la demande de ${item.prenom} ${item.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: libelle.charAt(0).toUpperCase() + libelle.slice(1),
        style: action === 'refuser' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await adminEnvoyer('post', `demandes/${item.id}/${action}/`);
            rafraichir();
          } catch (e) {
            Alert.alert('Action impossible', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.actions}>
      <Button title="Accepter" onPress={() => agir('approuver')} style={{ flex: 1 }} />
      <Button title="Refuser" variant="danger" onPress={() => agir('refuser')} style={{ flex: 1 }} />
    </View>
  );
}

export const MODULES: Record<string, ModuleDef> = {
  utilisateurs: {
    cle: 'utilisateurs',
    titre: 'Gestion des Utilisateurs',
    titreSingulier: 'utilisateur',
    icone: 'users',
    module: 'utilisateurs',
    liste: {
      chemin: 'utilisateurs/',
      cle: 'utilisateurs',
      recherche: 'q',
      placeholder: 'Nom, email ou matricule...',
      filtres: [
        { param: 'etat', options: [{ value: 'Actif', label: 'Actifs' }, { value: 'En attente', label: "Demandes d'inscription" }] },
        { param: 'type', options: tous(TYPES_UTILISATEUR), defaut: '' },
      ],
      titre: (u) => `${u.prenom} ${u.nom}`,
      sousTitre: (u) => `${u.email}${u.matricule ? ` · ${u.matricule}` : ''}`,
      badge: (u) => u.type,
      entete: (r) => (
        <Compteurs valeurs={[
          { label: 'Total', valeur: r.compteurs.total }, { label: 'Étudiants', valeur: r.compteurs.etudiants },
          { label: 'Porteurs', valeur: r.compteurs.porteurs_de_projet }, { label: 'Demandes', valeur: r.compteurs.demandes },
        ]} />
      ),
      actions: (u, rafraichir) => <ActionsDemande item={u} rafraichir={rafraichir} />,
    },
    detail: { chemin: (id) => `utilisateurs/${id}/` },
    champs: [
      { nom: 'nom', label: 'Nom', type: 'text', requis: true },
      { nom: 'prenom', label: 'Prénom', type: 'text', requis: true },
      { nom: 'email', label: 'Email', type: 'text', requis: true },
      { nom: 'matricule', label: 'Matricule', type: 'text' },
      { nom: 'departement', label: 'Département', type: 'text' },
      { nom: 'faculte', label: 'Faculté', type: 'text' },
      { nom: 'type', label: 'Type de compte', type: 'choix', options: TYPES_UTILISATEUR, requis: true },
      { nom: 'etat', label: 'État', type: 'choix', options: ['Actif', 'En attente'], requis: true },
      { nom: 'mdp', label: 'Mot de passe', type: 'password', requis: true, creation: true,
        aide: '8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.' },
      { nom: 'mdp_confirm', label: 'Confirmer le mot de passe', type: 'password', requis: true, creation: true },
    ],
    valeursInitiales: (u) => ({ nom: u.nom, prenom: u.prenom, email: u.email, matricule: u.matricule ?? '',
      departement: u.departement ?? '', faculte: u.faculte ?? '', type: u.type, etat: u.etat }),
    creer: 'utilisateurs/',
    modifier: (id) => `utilisateurs/${id}/`,
    supprimer: (id) => `utilisateurs/${id}/`,
    messageSuppression: 'Supprimer définitivement cet utilisateur (et ses requêtes) ?',
  },

  administrateurs: {
    cle: 'administrateurs',
    titre: 'Administrateurs',
    titreSingulier: 'administrateur',
    icone: 'user-shield',
    module: 'administrateurs',
    liste: {
      chemin: 'administrateurs/',
      cle: 'administrateurs',
      recherche: 'q',
      placeholder: 'Nom ou email...',
      filtres: [{ param: 'type', options: tous(TYPES_ADMIN), defaut: '' }],
      titre: (a) => `${a.prenom} ${a.nom}`,
      sousTitre: (a) => a.email,
      badge: (a) => a.type,
    },
    detail: { chemin: (id) => `administrateurs/${id}/` },
    champs: [
      { nom: 'nom', label: 'Nom', type: 'text', requis: true },
      { nom: 'prenom', label: 'Prénom', type: 'text', requis: true },
      { nom: 'email', label: 'Email', type: 'text', requis: true },
      { nom: 'type', label: "Type d'administrateur", type: 'choix', options: TYPES_ADMIN, requis: true },
      { nom: 'mdp', label: 'Mot de passe', type: 'password', requis: true, creation: true,
        aide: '8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.' },
      { nom: 'mdp_confirm', label: 'Confirmer le mot de passe', type: 'password', requis: true, creation: true },
    ],
    valeursInitiales: (a) => ({ nom: a.nom, prenom: a.prenom, email: a.email, type: a.type }),
    creer: 'administrateurs/',
    modifier: (id) => `administrateurs/${id}/`,
    supprimer: (id) => `administrateurs/${id}/`,
    messageSuppression: 'Supprimer cet administrateur ?',
  },

  projets: {
    cle: 'projets',
    titre: 'Gestion des Projets',
    titreSingulier: 'projet',
    icone: 'project-diagram',
    module: 'projets',
    liste: {
      chemin: 'projets/',
      cle: 'projets',
      recherche: 'q',
      placeholder: 'Intitulé, thème ou chef de projet...',
      titre: (p) => p.intitule,
      sousTitre: (p) => `${p.theme} · ${p.chef_projet} · ${p.membres_count ?? 0} membre(s)`,
      badge: (p) => `${p.progression}%`,
      entete: (r) => (
        <Compteurs valeurs={[{ label: 'Projets', valeur: r.compteurs.total }, { label: 'Progression moyenne', valeur: `${r.compteurs.progression_moyenne}%` }]} />
      ),
    },
    detail: { chemin: (id) => `projets/${id}/` },
    champs: [
      { nom: 'intitule', label: 'Intitulé', type: 'text', requis: true },
      { nom: 'theme', label: 'Thème', type: 'text', requis: true },
      { nom: 'description', label: 'Description', type: 'textarea', requis: true },
      { nom: 'progression', label: 'Progression (0 à 100)', type: 'nombre', modification: true },
      { nom: 'chef_projet_id', label: 'Chef de projet', type: 'utilisateur', source: 'projets/utilisateurs-actifs/', requis: true },
      { nom: 'membres', label: 'Membres', type: 'utilisateurs', source: 'projets/utilisateurs-actifs/' },
    ],
    valeursInitiales: (p) => ({ intitule: p.intitule, theme: p.theme, description: p.description,
      progression: String(p.progression ?? 0), chef_projet_id: p.chef_projet_id,
      membres: (p.membres_details ?? []).map((m: any) => m.id) }),
    creer: 'projets/',
    modifier: (id) => `projets/${id}/`,
    supprimer: (id) => `projets/${id}/`,
    messageSuppression: 'Supprimer ce projet ? Ses membres seront détachés.',
  },

  evenements: {
    cle: 'evenements',
    titre: 'Gestion des Événements',
    titreSingulier: 'événement',
    icone: 'calendar-alt',
    module: 'evenements',
    liste: {
      chemin: 'evenements/',
      cle: 'evenements',
      recherche: 'search',
      placeholder: 'Titre, lieu, type ou EVT-numéro...',
      filtres: [{ param: 'periode', defaut: '', options: [
        { value: '', label: 'Tous' }, { value: 'avenir', label: 'À venir' },
        { value: 'aujourdhui', label: "Aujourd'hui" }, { value: 'passes', label: 'Passés' }] }],
      titre: (e) => e.titre,
      sousTitre: (e) => `${e.date}${e.heure_debut ? ` · ${e.heure_debut}` : ''}${e.lieu ? ` · ${e.lieu}` : ''}`,
      badge: (e) => e.type,
      entete: (r) => (
        <Compteurs valeurs={[
          { label: 'Total', valeur: r.compteurs.total }, { label: 'À venir', valeur: r.compteurs.a_venir },
          { label: "Aujourd'hui", valeur: r.compteurs.aujourdhui }, { label: 'Passés', valeur: r.compteurs.passes },
        ]} />
      ),
    },
    detail: { chemin: (id) => `evenements/${id}/`, cle: 'evenement' },
    champs: [
      { nom: 'titre', label: 'Titre', type: 'text', requis: true },
      { nom: 'date', label: 'Date', type: 'date', requis: true },
      { nom: 'heure_debut', label: 'Heure de début', type: 'time' },
      { nom: 'heure_fin', label: 'Heure de fin', type: 'time' },
      { nom: 'lieu', label: 'Lieu', type: 'text' },
      { nom: 'type', label: "Type d'événement", type: 'choix', options: TYPES_EVENEMENT, requis: true },
      { nom: 'description', label: 'Description', type: 'textarea' },
      { nom: 'document_type', label: 'Type des documents joints', type: 'choix', options: TYPES_DOCUMENT },
      { nom: 'attachments', label: 'Documents (en modification, ils remplacent les anciens)', type: 'fichiers', multiple: true },
    ],
    valeursInitiales: (e) => ({ titre: e.titre, date: e.date, heure_debut: e.heure_debut ?? '', heure_fin: e.heure_fin ?? '',
      lieu: e.lieu ?? '', type: e.type, description: e.description ?? '' }),
    creer: 'evenements/',
    modifier: (id) => `evenements/${id}/`,
    supprimer: (id) => `evenements/${id}/`,
    messageSuppression: 'Supprimer cet événement et ses documents ?',
  },

  articles: {
    cle: 'articles',
    titre: 'Gestion des Articles',
    titreSingulier: 'article',
    icone: 'newspaper',
    module: 'articles',
    liste: {
      chemin: 'articles/',
      cle: 'articles',
      recherche: 'q',
      placeholder: 'Titre ou auteur...',
      titre: (a) => a.titre,
      sousTitre: (a) => `${a.auteur} · ${String(a.created_at).slice(0, 10)}`,
    },
    detail: { chemin: (id) => `articles/${id}/`, cle: 'article' },
    champs: [
      { nom: 'titre', label: 'Titre', type: 'text', requis: true },
      { nom: 'auteur', label: 'Auteur', type: 'text', requis: true },
      { nom: 'contenu', label: 'Contenu', type: 'textarea', requis: true },
      { nom: 'type', label: 'Type du document joint', type: 'choix', options: TYPES_DOCUMENT },
      { nom: 'attachment', label: 'Document joint (obligatoire à la création)', type: 'fichiers' },
    ],
    valeursInitiales: (a) => ({ titre: a.titre, auteur: a.auteur, contenu: a.contenu }),
    creer: 'articles/',
    modifier: (id) => `articles/${id}/`,
    supprimer: (id) => `articles/${id}/`,
    messageSuppression: 'Supprimer cet article ?',
  },
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
});
