import axios from 'axios';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/store/auth';
import type {
  AccueilUtilisateur,
  Article,
  Compte,
  CompteursNotifications,
  DocumentJoint,
  Evenement,
  EvenementsDuMois,
  ListeArticles,
  ListeRequetes,
  LoginResponse,
  Notification,
  NouvelleRequete,
  ProjetUtilisateur,
  RegisterPayload,
  RequeteDetail,
  Tenant,
} from '@/types';

import { api } from './client';


// ── Authentification ─────────────────────────────────────────────────────────

// L'authentification utilise l'API mobile du backend (/api/mobile/...), valable pour les 3 rôles.

export async function fetchIncubateurs(): Promise<Tenant[]> {
  const { data } = await api.get<{ incubateurs: Tenant[] }>('/mobile/incubateurs/');
  return data.incubateurs;
}

export async function login(email: string, mdp: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/mobile/auth/login/', { email: email.trim(), mdp });
  return data;
}

export async function register(payload: RegisterPayload): Promise<string> {
  // L'inscription utilise la route existante du backend (publique, inchangée).
  const { data } = await api.post<{ message: string }>('/auth/register/', payload);
  return data.message;
}

export async function logout(refresh: string | null): Promise<void> {
  if (!refresh) return;
  await api.post('/mobile/auth/logout/', { refresh });
}

/** Mot de passe oublié : le backend envoie un mot de passe temporaire par e-mail. */
export async function requestPasswordReset(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>('/mobile/auth/password/oublie/', { email: email.trim() });
  return data.message;
}

// ── Profil et mot de passe ───────────────────────────────────────────────────

export async function fetchMe(): Promise<Compte> {
  const { data } = await api.get<{ user: Compte }>('/mobile/auth/me/');
  return data.user;
}

export type ProfilModifiable = Pick<Compte, 'nom' | 'prenom' | 'email'> & Partial<Pick<Compte, 'departement' | 'faculte'>>;

export async function updateMe(values: ProfilModifiable): Promise<Compte> {
  // On n'envoie que les champs que l'écran modifie (jamais type, projet, etc.).
  const { data } = await api.patch<{ user: Compte }>('/mobile/auth/me/', values);
  return data.user;
}

export async function verifyPassword(mdpActuel: string): Promise<void> {
  await api.post('/mobile/auth/password/verifier/', { mdp_actuel: mdpActuel });
}

export async function changePassword(mdpActuel: string, mdp: string, confirmation: string): Promise<void> {
  await api.post('/mobile/auth/password/changer/', {
    mdp_actuel: mdpActuel,
    mdp,
    mdp_confirm: confirmation,
  });
}

// ── Espace utilisateur (/api/mobile/user/...) ────────────────────────────────

export async function fetchAccueil(): Promise<AccueilUtilisateur> {
  const { data } = await api.get<AccueilUtilisateur>('/mobile/user/accueil/');
  return data;
}

export async function fetchMonProjet(): Promise<ProjetUtilisateur> {
  const { data } = await api.get<ProjetUtilisateur>('/mobile/user/projet/');
  return data;
}

export async function fetchEvenements(annee: number, mois: number, type: string): Promise<EvenementsDuMois> {
  const { data } = await api.get<EvenementsDuMois>('/mobile/user/evenements/', {
    params: { year: annee, month: mois, ...(type !== 'all' ? { type } : {}) },
  });
  return data;
}

export async function fetchEvenement(id: number): Promise<Evenement> {
  const { data } = await api.get<{ evenement: Evenement }>(`/mobile/user/evenements/${id}/`);
  return data.evenement;
}

export async function fetchRequetes(filtre: string, recherche: string, page: number): Promise<ListeRequetes> {
  const { data } = await api.get<ListeRequetes>('/mobile/user/requetes/', {
    params: { filtre, ...(recherche ? { q: recherche } : {}), page },
  });
  return data;
}

export async function fetchRequete(id: number): Promise<RequeteDetail> {
  const { data } = await api.get<{ requete: RequeteDetail }>(`/mobile/user/requetes/${id}/`);
  return data.requete;
}

export async function createRequete(payload: NouvelleRequete): Promise<RequeteDetail> {
  // Envoi multipart (obligatoire pour la pièce jointe) : le serveur valide la taille (10 Mo),
  // l'extension et le contenu du fichier comme sur le site.
  const corps = new FormData();
  corps.append('objet', payload.objet);
  corps.append('contenu', payload.contenu);
  corps.append('type_requete', payload.type_requete);
  if (payload.piece && payload.document_type) {
    corps.append('document_type', payload.document_type);
    corps.append('attachment', {
      uri: payload.piece.uri,
      name: payload.piece.name,
      type: payload.piece.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);
  }
  const { data } = await api.post<{ requete: RequeteDetail }>('/mobile/user/requetes/', corps, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.requete;
}

export async function fetchNotifications(type: string, recherche: string): Promise<Notification[]> {
  const { data } = await api.get<{ notifications: Notification[] }>('/mobile/user/notifications/', {
    params: { type, ...(recherche ? { search: recherche } : {}) },
  });
  return data.notifications;
}

export async function fetchCompteurs(): Promise<CompteursNotifications> {
  const { data } = await api.get<CompteursNotifications>('/mobile/user/notifications/compteurs/');
  return data;
}

export async function fetchNotification(id: number): Promise<Notification> {
  const { data } = await api.get<Notification>(`/mobile/user/notifications/${id}/`);
  return data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/mobile/user/notifications/${id}/lu/`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/mobile/user/notifications/tout-lu/');
}

export async function fetchArticles(recherche: string, page: number): Promise<ListeArticles> {
  const { data } = await api.get<ListeArticles>('/mobile/user/articles/', {
    params: { ...(recherche ? { q: recherche } : {}), page },
  });
  return data;
}

export async function fetchArticle(id: number): Promise<Article> {
  const { data } = await api.get<{ article: Article }>(`/mobile/user/articles/${id}/`);
  return data.article;
}

// ── Documents ────────────────────────────────────────────────────────────────

/**
 * Télécharge un document avec le jeton de l'utilisateur (le serveur vérifie ses droits), puis
 * ouvre la feuille de partage / d'ouverture du téléphone.
 */
export async function ouvrirDocument(document: DocumentJoint): Promise<void> {
  // Un appel authentifié renouvelle le jeton s'il a expiré : le téléchargement natif, lui, ne le fait pas.
  await fetchMe();
  const { accessToken } = useAuthStore.getState();

  const dossier = new Directory(Paths.cache, 'documents');
  if (!dossier.exists) dossier.create();
  const fichier = await File.downloadFileAsync(`${API_BASE_URL}${document.download_url}`, dossier, {
    idempotent: true,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fichier.uri);
  }
}

export function estErreur404(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
