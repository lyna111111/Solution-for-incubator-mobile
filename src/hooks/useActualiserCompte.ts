import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { fetchMe } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import type { Compte } from '@/types';

/**
 * Tirer-pour-actualiser des pages qui n'affichent que le compte connecté (profil, menu de gestion,
 * accueil Super Admin) : recharge le compte depuis le serveur, puis les compteurs de notifications.
 */
export function useActualiserCompte() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const actualiser = useCallback(async (): Promise<Compte | null> => {
    setRefreshing(true);
    try {
      const moi = await fetchMe();
      await setUser(moi);
      await queryClient.invalidateQueries({ queryKey: ['compteurs'] });
      return moi;
    } catch {
      // pas bloquant : on garde les données déjà affichées
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, setUser]);

  return { refreshing, actualiser };
}
