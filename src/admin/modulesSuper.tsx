import { useQueryClient } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Dialogue } from '@/components/Dialogue';
import { Button } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';
import { aujourdhui, formaterDA, formatDate } from '@/utils/format';

import { adminEnvoyer } from './api';
import type { ChampDef, ModuleDef } from './types';
import { Compteurs } from './ui';

// Valeurs et libellés reçus du serveur (mêmes choix que les pages Super Admin du site).
const METHODES = ['virement', 'cheque', 'especes', 'ccp'];
const LIBELLES_METHODE = { virement: 'Virement bancaire', cheque: 'Chèque', especes: 'Espèces', ccp: 'CCP' };
const STATUTS_PAIEMENT = ['pending', 'completed', 'annule'];
const LIBELLES_STATUT_PAIEMENT = { pending: 'En attente', completed: 'Complété', annule: 'Annulé' };
const STATUTS_ABONNEMENT = ['actif', 'essai', 'suspendu', 'annule'];
const LIBELLES_STATUT_ABONNEMENT = { actif: 'Actif', essai: "Période d'essai", suspendu: 'Suspendu', annule: 'Annulé' };

const MSG_MDP = '8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.';

/** Appelle une route Super Admin avec confirmation, puis recharge les listes et le tableau de bord. */
function useAction(rafraichir: () => void) {
  const queryClient = useQueryClient();
  return (titre: string, message: string, chemin: string, libelle: string, destructif = false) => {
    Dialogue.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: libelle,
        style: destructif ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const reponse = await adminEnvoyer('post', chemin, {}, [], 'superadmin');
            await queryClient.invalidateQueries({ queryKey: ['admin'] });
            rafraichir();
            if (reponse?.message) Dialogue.alert(titre, reponse.message, undefined, { ton: 'success', icone: 'check-circle' });
          } catch (e) {
            Dialogue.alert('Action impossible', getErrorMessage(e));
          }
        },
      },
    ]);
  };
}

function CompteursIncubateurs({ compteurs }: { compteurs: any }) {
  const colors = useColors();
  return (
    <Compteurs valeurs={[
      { label: 'Total', valeur: compteurs.total, couleur: colors.primary },
      { label: 'Actifs', valeur: compteurs.actifs, couleur: colors.success },
      { label: 'Inactifs', valeur: compteurs.inactifs, couleur: colors.danger },
      { label: 'En essai', valeur: compteurs.essai, couleur: colors.warning },
    ]} />
  );
}

const limite = (n: number) => (n < 0 ? '∞' : n);

/** Pied d'une carte d'incubateur : chiffres clés à gauche, interrupteur actif / inactif à droite. */
function ActionsIncubateur({ item, rafraichir }: { item: any; rafraichir: () => void }) {
  const agir = useAction(rafraichir);
  const colors = useColors();
  const actif = !!item.actif;
  return (
    <View style={styles.pied}>
      <View style={styles.chiffres}>
        <View style={[styles.puce, { backgroundColor: colors.infoSoft }]}>
          <FontAwesome5 name="users" size={11} color={colors.info} />
          <Text style={[styles.puceTexte, { color: colors.info }]}>{item.nb_utilisateurs}/{limite(item.max_utilisateurs)}</Text>
        </View>
        <View style={[styles.puce, { backgroundColor: colors.primarySoft }]}>
          <FontAwesome5 name="project-diagram" size={11} color={colors.primary} />
          <Text style={[styles.puceTexte, { color: colors.primary }]}>{item.nb_projets}/{limite(item.max_projets)}</Text>
        </View>
      </View>
      {/* Interrupteur contrôlé : il ne bascule qu'après confirmation puis rechargement de la liste. */}
      <View style={styles.interrupteur}>
        <Text style={[styles.actionTexte, { color: actif ? colors.success : colors.textMuted }]}>{actif ? 'Actif' : 'Inactif'}</Text>
        <Switch
          value={actif}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
          onValueChange={() => agir(
            actif ? "Désactiver l'incubateur" : "Activer l'incubateur",
            actif
              ? `${item.nom} sera désactivé et son abonnement suspendu. Ses utilisateurs ne pourront plus se connecter.`
              : `${item.nom} sera réactivé.`,
            `incubateurs/${item.id}/statut/`,
            actif ? 'Désactiver' : 'Activer',
            actif,
          )}
        />
      </View>
    </View>
  );
}

function ActionsSuperAdmin({ item, rafraichir }: { item: any; rafraichir: () => void }) {
  const agir = useAction(rafraichir);
  return (
    <View style={styles.actions}>
      <Button
        title="Réinitialiser le mot de passe"
        variant="secondary"
        style={{ flex: 1 }}
        onPress={() => agir(
          'Réinitialiser le mot de passe',
          `Un mot de passe temporaire sera envoyé par e-mail à ${item.email}.`,
          `superadmins/${item.id}/reinitialiser-mdp/`,
          'Envoyer',
        )}
      />
    </View>
  );
}

const optionnel = (champs: ChampDef[]) => champs.map((c) => ({ ...c, requis: false }));

const CHAMPS_INCUBATEUR: ChampDef[] = [
  { nom: 'nom', label: "Nom de l'incubateur", type: 'text', requis: true },
  { nom: 'slug', label: 'Identifiant (slug)', type: 'text', placeholder: 'généré à partir du nom si vide' },
  { nom: 'email_contact', label: 'Email de contact', type: 'text', requis: true },
  { nom: 'telephone', label: 'Téléphone', type: 'text' },
  { nom: 'adresse', label: 'Adresse', type: 'textarea' },
  { nom: 'offre_id', label: 'Offre', type: 'reference', source: 'offres/', cleListe: 'offres',
    libelleOption: (o) => `${o.nom} — ${formaterDA(o.prix)}/an` },
  { nom: 'couleur_primaire', label: 'Couleur principale', type: 'text', placeholder: '#8a3ffc' },
  { nom: 'couleur_secondaire', label: 'Couleur secondaire', type: 'text', placeholder: '#00c2ff' },
  { nom: 'max_projets', label: 'Limite de projets', type: 'nombre', placeholder: '-1 = illimité' },
  { nom: 'max_utilisateurs', label: "Limite d'utilisateurs", type: 'nombre', placeholder: '-1 = illimité' },
  { nom: 'admin_nom', label: "Nom de l'administrateur principal", type: 'text', placeholder: 'Prénom Nom' },
  { nom: 'admin_email', label: "Email de l'administrateur principal", type: 'text' },
  { nom: 'admin_password', label: 'Mot de passe', type: 'password', creation: true, requis: true, aide: MSG_MDP },
  { nom: 'admin_password_confirm', label: 'Confirmer le mot de passe', type: 'password', creation: true, requis: true },
  { nom: 'admin_password', label: 'Nouveau mot de passe (laisser vide pour ne pas le changer)', type: 'password', modification: true },
];

export const MODULES_SUPER: Record<string, ModuleDef> = {
  incubateurs: {
    cle: 'incubateurs',
    base: 'superadmin',
    titre: 'Les Incubateurs',
    titreSingulier: 'incubateur',
    icone: 'building',
    module: 'incubateurs',
    liste: {
      chemin: 'incubateurs/',
      cle: 'incubateurs',
      recherche: 'q',
      placeholder: 'Nom ou email...',
      filtres: [{
        param: 'statut',
        defaut: '',
        options: [{ value: '', label: 'Tous' }, { value: 'actif', label: 'Actifs' }, { value: 'inactif', label: 'Inactifs' }, { value: 'essai', label: "En essai" }],
      }],
      titre: (i) => i.nom,
      sousTitre: (i) => `Plan ${i.plan_display}`,
      badge: (i) => (i.actif ? (i.essai ? 'Essai' : 'Actif') : 'Inactif'),
      entete: (r) => <CompteursIncubateurs compteurs={r.compteurs} />,
      actions: (i, rafraichir) => <ActionsIncubateur item={i} rafraichir={rafraichir} />,
    },
    detail: { chemin: (id) => `incubateurs/${id}/` },
    champs: CHAMPS_INCUBATEUR,
    valeursInitiales: (i) => ({
      nom: i.nom, slug: i.slug, email_contact: i.email_contact, telephone: i.telephone, adresse: i.adresse,
      offre_id: i.offre_id === '' || i.offre_id == null ? '' : String(i.offre_id),
      couleur_primaire: i.couleur_primaire, couleur_secondaire: i.couleur_secondaire,
      max_projets: String(i.max_projets ?? ''), max_utilisateurs: String(i.max_utilisateurs ?? ''),
      admin_nom: i.admin_nom, admin_email: i.admin_email,
    }),
    creer: 'incubateurs/',
    modifier: (id) => `incubateurs/${id}/`,
    supprimer: (id) => `incubateurs/${id}/`,
    messageSuppression: "Supprimer définitivement cet incubateur ? Tous ses utilisateurs, projets, événements, requêtes et documents seront supprimés. Cette action est irréversible.",
  },

  offres: {
    cle: 'offres',
    base: 'superadmin',
    titre: 'Offres SaaS',
    titreSingulier: 'offre',
    icone: 'tags',
    module: 'offres',
    liste: {
      chemin: 'offres/',
      cle: 'offres',
      titre: (o) => `${o.nom}${o.featured ? ' ★' : ''}`,
      sousTitre: (o) => `${formaterDA(o.prix)} / an · ${o.max_projets < 0 ? '∞' : o.max_projets} projets · ${o.max_utilisateurs < 0 ? '∞' : o.max_utilisateurs} utilisateurs`,
      badge: (o) => `${o.abonnes_count} abonné${o.abonnes_count > 1 ? 's' : ''}`,
    },
    detail: { chemin: (id) => `offres/${id}/`, cle: 'offre' },
    champs: [
      { nom: 'nom', label: 'Nom du plan', type: 'text', requis: true },
      { nom: 'slug', label: 'Identifiant (slug)', type: 'text', creation: true, placeholder: 'généré à partir du nom si vide' },
      { nom: 'prix', label: 'Prix annuel (DA)', type: 'nombre', requis: true },
      { nom: 'icon', label: 'Icône FontAwesome', type: 'text', placeholder: 'fa-rocket' },
      { nom: 'max_projets', label: 'Limite de projets', type: 'nombre', requis: true, placeholder: '-1 = illimité' },
      { nom: 'max_utilisateurs', label: "Limite d'utilisateurs", type: 'nombre', requis: true, placeholder: '-1 = illimité' },
      { nom: 'features', label: 'Fonctionnalités (une par ligne)', type: 'textarea' },
      { nom: 'featured', label: 'Plan mis en avant', type: 'choix', options: ['false', 'true'], libelles: { false: 'Non', true: 'Oui' } },
    ],
    valeursInitiales: (o) => ({
      nom: o.nom, prix: String(o.prix), icon: o.icon, max_projets: String(o.max_projets), max_utilisateurs: String(o.max_utilisateurs),
      features: o.features, featured: o.featured ? 'true' : 'false',
    }),
    creer: 'offres/',
    modifier: (id) => `offres/${id}/`,
    supprimer: (id) => `offres/${id}/`,
    messageSuppression: "Supprimer cette offre ? Les abonnements qui l'utilisent passeront en « Plan Historique ».",
  },

  paiements: {
    cle: 'paiements',
    base: 'superadmin',
    titre: 'Paiements',
    titreSingulier: 'paiement',
    icone: 'credit-card',
    module: 'paiements',
    liste: {
      chemin: 'paiements/',
      cle: 'paiements',
      recherche: 'q',
      placeholder: 'Référence ou incubateur...',
      filtres: [{
        param: 'statut',
        defaut: '',
        options: [{ value: '', label: 'Tous' }, { value: 'completed', label: 'Complétés' }, { value: 'pending', label: 'En attente' }, { value: 'annule', label: 'Annulés' }],
      }],
      titre: (p) => `${p.reference} · ${formaterDA(p.montant)}`,
      sousTitre: (p) => `${p.incubateur} · ${p.methode_display} · ${formatDate(p.date_paiement)}`,
      badge: (p) => p.statut_display,
      entete: (r) => (
        <Compteurs valeurs={[
          { label: 'Revenus', valeur: formaterDA(r.resume.revenus_total) }, { label: 'Complétés', valeur: r.resume.completes },
          { label: 'En attente', valeur: r.resume.en_attente }, { label: 'Annulés', valeur: r.resume.annules },
        ]} />
      ),
    },
    detail: { chemin: (id) => `paiements/${id}/`, cle: 'paiement' },
    champs: [
      { nom: 'abonnement_id', label: 'Abonnement', type: 'reference', requis: true, creation: true, source: 'paiements/',
        cleListe: 'abonnements', libelleOption: (a) => `${a.incubateur} — ${a.plan}` },
      { nom: 'montant', label: 'Montant (DA)', type: 'nombre', requis: true },
      { nom: 'methode', label: 'Méthode de paiement', type: 'choix', options: METHODES, libelles: LIBELLES_METHODE, requis: true },
      { nom: 'date_paiement', label: 'Date du paiement', type: 'date', requis: true },
      { nom: 'statut', label: 'Statut', type: 'choix', options: STATUTS_PAIEMENT, libelles: LIBELLES_STATUT_PAIEMENT, requis: true },
      { nom: 'notes', label: 'Notes (n° de chèque, référence du virement...)', type: 'textarea' },
    ],
    valeursCreation: () => ({ methode: 'virement', statut: 'completed', date_paiement: aujourdhui() }),
    valeursInitiales: (p) => ({
      montant: String(p.montant), methode: p.methode, date_paiement: p.date_paiement, statut: p.statut, notes: p.notes,
    }),
    creer: 'paiements/',
    modifier: (id) => `paiements/${id}/`,
    supprimer: (id) => `paiements/${id}/`,
    messageSuppression: 'Supprimer ce paiement ?',
  },

  // La liste et la création passent par ce module ; la fiche (actions, renouvellement) est un écran à part.
  abonnements: {
    cle: 'abonnements',
    base: 'superadmin',
    titre: 'Abonnements',
    titreSingulier: 'abonnement',
    icone: 'sync-alt',
    module: 'abonnements',
    liste: {
      chemin: 'abonnements/',
      cle: 'abonnements',
      recherche: 'q',
      placeholder: 'Incubateur...',
      filtres: [{
        param: 'statut',
        defaut: '',
        options: [{ value: '', label: 'Tous' }, ...STATUTS_ABONNEMENT.map((s) => ({ value: s, label: (LIBELLES_STATUT_ABONNEMENT as any)[s] }))],
      }],
      titre: (a) => a.incubateur,
      sousTitre: (a) => `${a.plan_display} · fin le ${formatDate(a.date_fin)} (${a.jours_restants >= 0 ? `${a.jours_restants} j restants` : `expiré depuis ${-a.jours_restants} j`})`,
      badge: (a) => a.statut_display,
      entete: (r) => (
        <Compteurs valeurs={[
          { label: 'Actifs', valeur: r.compteurs.actifs }, { label: 'Annulés', valeur: r.compteurs.expires },
          { label: 'Fin < 30 j', valeur: r.compteurs.expirent_bientot }, { label: 'Ce mois', valeur: r.compteurs.renouvellements_mois },
        ]} />
      ),
    },
    detail: { chemin: (id) => `abonnements/${id}/`, cle: 'abonnement' },
    champs: [
      { nom: 'incubateur_id', label: 'Incubateur', type: 'reference', requis: true, source: 'abonnements/',
        cleListe: 'incubateurs_disponibles', libelleOption: (i) => i.nom },
      { nom: 'offre_id', label: 'Offre', type: 'reference', requis: true, source: 'abonnements/', cleListe: 'offres',
        libelleOption: (o) => `${o.nom} — ${formaterDA(o.prix)}/an` },
      { nom: 'date_debut', label: 'Date de début', type: 'date', requis: true },
      { nom: 'date_fin', label: 'Date de fin', type: 'date', requis: true },
      { nom: 'statut', label: 'Statut', type: 'choix', options: ['actif', 'essai'], libelles: LIBELLES_STATUT_ABONNEMENT },
      { nom: 'notes', label: 'Notes', type: 'textarea' },
    ],
    valeursCreation: () => ({ statut: 'actif', date_debut: aujourdhui() }),
    valeursInitiales: () => ({}),
    creer: 'abonnements/',
    modifier: (id) => `abonnements/${id}/`,
    messageSuppression: '',
  },

  superadmins: {
    cle: 'superadmins',
    base: 'superadmin',
    titre: 'Les Super-Admins',
    titreSingulier: 'super-admin',
    icone: 'user-shield',
    module: 'superadmins',
    liste: {
      chemin: 'superadmins/',
      cle: 'superadmins',
      recherche: 'q',
      placeholder: 'Nom ou email...',
      titre: (s) => `${s.prenom} ${s.nom}`,
      sousTitre: (s) => s.email,
      actions: (s, rafraichir) => <ActionsSuperAdmin item={s} rafraichir={rafraichir} />,
    },
    detail: { chemin: (id) => `superadmins/${id}/`, cle: 'superadmin' },
    champs: [
      { nom: 'prenom', label: 'Prénom', type: 'text', requis: true },
      { nom: 'nom', label: 'Nom', type: 'text', requis: true },
      { nom: 'email', label: 'Email', type: 'text', requis: true },
      { nom: 'mdp', label: 'Mot de passe', type: 'password', requis: true, creation: true, aide: MSG_MDP },
      ...optionnel([
        { nom: 'mdp_actuel', label: 'Ancien mot de passe (pour en changer)', type: 'password', modification: true },
        { nom: 'mdp', label: 'Nouveau mot de passe (laisser vide pour ne pas le changer)', type: 'password', modification: true },
      ]),
    ],
    valeursInitiales: (s) => ({ prenom: s.prenom, nom: s.nom, email: s.email }),
    creer: 'superadmins/',
    modifier: (id) => `superadmins/${id}/`,
    supprimer: (id) => `superadmins/${id}/`,
    messageSuppression: 'Supprimer ce Super Administrateur ?',
  },
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  chiffres: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', flex: 1 },
  puce: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  puceTexte: { fontSize: 12, fontWeight: '700' },
  interrupteur: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionTexte: { fontSize: 12, fontWeight: '700' },
});
