import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Screen } from '@/components/Screen';
import { Button, ErrorState, Loading } from '@/components/ui';
import { spacing } from '@/theme';

import { adminEnvoyer, adminGet } from './api';
import { MODULES } from './modules';
import type { Fichier } from './types';
import { FormulaireAdmin, ListeAdmin, LigneListe } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any -- données décrites par la config de chaque module */

/** Liste d'un module : recherche, filtres, pagination, bouton « Nouveau ». */
export function ModuleList({ cle }: { cle: string }) {
  const config = MODULES[cle];
  return (
    <ListeAdmin
      titre={config.titre}
      queryKey={['admin', cle, 'liste']}
      charger={({ page, recherche, filtres }) =>
        adminGet(config.liste.chemin, {
          page,
          ...Object.fromEntries(Object.entries(filtres).filter(([, v]) => v !== '')),
          ...(recherche && config.liste.recherche ? { [config.liste.recherche]: recherche } : {}),
        })}
      extraire={(r) => ({ items: r[config.liste.cle] ?? [], pagination: r.pagination })}
      placeholderRecherche={config.liste.recherche ? (config.liste.placeholder ?? 'Rechercher...') : undefined}
      filtres={config.liste.filtres}
      entete={config.liste.entete}
      action={{ titre: `Nouveau ${config.titreSingulier}`, onPress: () => router.push(`/gestion/${cle}/nouveau`) }}
      vide={`Aucun ${config.titreSingulier} à afficher.`}
      renderItem={(item, rafraichir) => (
        <LigneListe
          key={item.id}
          titre={config.liste.titre(item)}
          sousTitre={config.liste.sousTitre(item)}
          badge={config.liste.badge?.(item)}
          onPress={() => router.push(`/gestion/${cle}/${item.id}`)}
          pied={config.liste.actions?.(item, rafraichir)}
        />
      )}
    />
  );
}

function useApresEcriture() {
  const queryClient = useQueryClient();
  return async () => {
    // Les listes, le tableau de bord et les statistiques de l'admin sont à recharger.
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  };
}

/** Création d'un élément : formulaire des champs du module. */
export function ModuleNew({ cle }: { cle: string }) {
  const config = MODULES[cle];
  const apres = useApresEcriture();

  async function envoyer(valeurs: Record<string, any>, fichiers: Fichier[]) {
    await adminEnvoyer('post', config.creer, valeurs, fichiers);
    await apres();
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `Nouveau ${config.titreSingulier}` }} />
      <FormulaireAdmin champs={config.champs} mode="creation" libelle="Créer" onSubmit={envoyer} />
    </Screen>
  );
}

/** Modification (et suppression) d'un élément existant. */
export function ModuleEdit({ cle }: { cle: string }) {
  const config = MODULES[cle];
  const { id } = useLocalSearchParams<{ id: string }>();
  const apres = useApresEcriture();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', cle, 'detail', id],
    queryFn: () => adminGet(config.detail.chemin(id)),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const item = config.detail.cle ? data[config.detail.cle] : data;

  async function enregistrer(valeurs: Record<string, any>, fichiers: Fichier[]) {
    await adminEnvoyer('put', config.modifier(id), valeurs, fichiers);
    await apres();
    router.back();
  }

  function supprimer() {
    if (!config.supprimer) return;
    Alert.alert('Suppression', config.messageSuppression, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminEnvoyer('delete', config.supprimer!(id));
            await apres();
            router.back();
          } catch (e) {
            Alert.alert('Suppression impossible', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: config.liste.titre(item) }} />
      <FormulaireAdmin
        champs={config.champs}
        mode="modification"
        valeursInitiales={config.valeursInitiales(item)}
        libelle="Enregistrer"
        onSubmit={enregistrer}
      />
      {config.supprimer && (
        <>
          <Text style={{ height: spacing.sm }} />
          <Button title="Supprimer" variant="danger" onPress={supprimer} />
        </>
      )}
    </Screen>
  );
}
