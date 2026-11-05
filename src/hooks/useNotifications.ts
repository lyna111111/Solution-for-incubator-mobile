import { useQuery } from '@tanstack/react-query';

import { adminGet } from '@/admin/api';
import { fetchCompteurs, fetchRequetes } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';

/** Nombre de notifications non lues (badge de l'onglet) : interrogé régulièrement. */
export function useNonLues() {
  const estUtilisateur = useAuthStore((s) => s.user?.role === 'utilisateur');
  const requete = useQuery({
    queryKey: ['compteurs'],
    queryFn: fetchCompteurs,
    enabled: estUtilisateur,
    refetchInterval: 60_000,
  });
  return requete.data?.total ?? 0;
}

/**
 * Pastille de l'onglet « Requêtes » :
 * - administrateur (module Requêtes) : nombre de requêtes reçues en attente de traitement ;
 * - utilisateur : nombre de ses requêtes en attente de réponse.
 * Interrogé régulièrement ; renvoie 0 pour les autres rôles.
 */
export function useBadgeRequetes() {
  const estUtilisateur = useAuthStore((s) => s.user?.role === 'utilisateur');
  const estAdminRequetes = useAuthStore((s) => s.user?.role === 'admin' && (s.user.modules ?? []).includes('requetes'));
  // Clé sous `['requetes']` : invalidée dès que l'utilisateur envoie une requête. Le total « en attente » vient du
  // serveur (compteurs de la liste), quel que soit le filtre.
  const mesEnAttente = useQuery({
    queryKey: ['requetes', 'en-attente'],
    queryFn: () => fetchRequetes('pending', '', 1),
    enabled: estUtilisateur,
    refetchInterval: 60_000,
  });
  // Clé sous `['admin']` : invalidée dès qu'une requête est traitée ou rejetée.
  const enAttente = useQuery({
    queryKey: ['admin', 'requetes', 'en-attente'],
    queryFn: () => adminGet<{ compteurs: { en_attente: number } }>('requetes/', { page: 1 }),
    enabled: estAdminRequetes,
    refetchInterval: 60_000,
  });
  if (estUtilisateur) return mesEnAttente.data?.compteurs.en_attente ?? 0;
  if (estAdminRequetes) return enAttente.data?.compteurs.en_attente ?? 0;
  return 0;
}
