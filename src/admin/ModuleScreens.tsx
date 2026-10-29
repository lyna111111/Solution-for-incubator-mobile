import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Dialogue } from '@/components/Dialogue';
import { Screen } from '@/components/Screen';
import { Button, ErrorState, Loading } from '@/components/ui';
import { spacing } from '@/theme';

import { adminEnvoyer, adminGet } from './api';
import { MODULES } from './modules';
import type { Fichier } from './types';
import { FormulaireAdmin, ListeAdmin, LigneListe } from './ui';

/* eslint-disable @typescript-eslint/no-explicit-any -- données décrites par la config de chaque module */

/** « Nouvelle offre », « Nouvel incubateur » (voyelle ou h muet), « Nouveau projet ». */
function libelleNouveau(config: { titreSingulier: string; feminin?: boolean }): string {
  const mot = config.feminin ? 'Nouvelle' : /^[aeiouyéèêh]/i.test(config.titreSingulier) ? 'Nouvel' : 'Nouveau';
  return `${mot} ${config.titreSingulier}`;
}

/** Liste d'un module : recherche, filtres, pagination, bouton « Nouveau ». */
export function ModuleList({ cle }: { cle: string }) {
  const config = MODULES[cle];
  const racine = config.base === 'superadmin' ? `/${cle}` : `/gestion/${cle}`;
  return (
    <ListeAdmin
      titre={config.titre}
      queryKey={['admin', cle, 'liste']}
      charger={({ page, recherche, filtres }) =>
        adminGet(config.liste.chemin, {
          page,
          ...Object.fromEntries(Object.entries(filtres).filter(([, v]) => v !== '')),
          ...(recherche && config.liste.recherche ? { [config.liste.recherche]: recherche } : {}),
        }, config.base)}
      // Certaines listes (ex. les offres) tiennent sur une page : le serveur n'envoie alors pas de pagination.
      extraire={(r) => ({
        items: r[config.liste.cle] ?? [],
        pagination: r.pagination ?? { page: 1, nb_pages: 1, a_precedent: false, a_suivant: false, total: (r[config.liste.cle] ?? []).length },
      })}
      placeholderRecherche={config.liste.recherche ? (config.liste.placeholder ?? 'Rechercher...') : undefined}
      filtres={config.liste.filtres}
      parametresUrl={config.liste.parametresUrl}
      entete={config.liste.entete}
      action={{ titre: libelleNouveau(config), onPress: () => router.push(`${racine}/nouveau`) }}
      vide={`${config.feminin ? 'Aucune' : 'Aucun'} ${config.titreSingulier} à afficher.`}
      renderItem={(item, rafraichir) => (
        <LigneListe
          key={item.id}
          titre={config.liste.titre(item)}
          sousTitre={config.liste.sousTitre(item)}
          badge={config.liste.badge?.(item)}
          onPress={() => router.push(`${racine}/${item.id}`)}
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
    await adminEnvoyer('post', config.creer, valeurs, fichiers, config.base);
    await apres();
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: libelleNouveau(config) }} />
      <FormulaireAdmin champs={config.champs} mode="creation" libelle="Créer" base={config.base}
        valeursInitiales={config.valeursCreation?.()} onSubmit={envoyer} />
    </Screen>
  );
}

/** Modification (et suppression) d'un élément existant. */
export function ModuleEdit({ cle }: { cle: string }) {
  const config = MODULES[cle];
  const { id } = useLocalSearchParams<{ id: string }>();
  const apres = useApresEcriture();
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['admin', cle, 'detail', id],
    queryFn: () => adminGet(config.detail.chemin(id), undefined, config.base),
  });

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const item = config.detail.cle ? data[config.detail.cle] : data;

  async function enregistrer(valeurs: Record<string, any>, fichiers: Fichier[]) {
    await adminEnvoyer('put', config.modifier(id), valeurs, fichiers, config.base);
    await apres();
    router.back();
  }

  function supprimer() {
    if (!config.supprimer) return;
    Dialogue.alert('Suppression', config.messageSuppression, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminEnvoyer('delete', config.supprimer!(id), {}, [], config.base);
            await apres();
            router.back();
          } catch (e) {
            Dialogue.alert('Suppression impossible', getErrorMessage(e));
          }
        },
      },
    ], { ton: 'danger', icone: 'trash-alt' });
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Stack.Screen options={{ title: config.liste.titre(item) }} />
      <FormulaireAdmin
        champs={config.champs}
        mode="modification"
        valeursInitiales={config.valeursInitiales(item)}
        libelle="Enregistrer"
        base={config.base}
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
