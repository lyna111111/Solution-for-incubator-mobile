import { useQuery } from '@tanstack/react-query';

import { fetchCompteurs } from '@/api/endpoints';
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
