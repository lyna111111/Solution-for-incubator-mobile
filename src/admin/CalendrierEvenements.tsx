import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Calendrier } from '@/components/Calendrier';
import { useOuvrir } from '@/hooks/useOuvrir';
import { spacing } from '@/theme';

import { adminGet } from './api';
import { LigneListe } from './ui';

/** Tous les événements de l'incubateur : la liste admin est paginée, on la parcourt page par page. */
async function tousLesEvenements(): Promise<any[]> {
  const tous: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const r = await adminGet('evenements/', { page });
    tous.push(...(r.evenements ?? []));
    if (!r.pagination?.a_suivant) break;
  }
  return tous;
}

/** Calendrier mensuel de la gestion des événements : les jours avec événement sont entourés, un jour touché liste ses événements. */
export function CalendrierEvenements() {
  const ouvrir = useOuvrir();
  const maintenant = new Date();
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [mois, setMois] = useState(maintenant.getMonth()); // 0-11 comme le composant Calendrier
  const [jour, setJour] = useState<number | null>(null);

  const { data } = useQuery({ queryKey: ['admin', 'evenements', 'calendrier'], queryFn: tousLesEvenements });

  const prefixe = `${annee}-${String(mois + 1).padStart(2, '0')}-`;
  const duMois = useMemo(() => (data ?? []).filter((e) => String(e.date).startsWith(prefixe)), [data, prefixe]);
  const joursAvecEvenement = useMemo(() => new Set(duMois.map((e) => Number(String(e.date).slice(8, 10)))), [duMois]);
  const duJour = jour === null ? [] : duMois.filter((e) => Number(String(e.date).slice(8, 10)) === jour);

  function changerMois(delta: number) {
    const d = new Date(annee, mois + delta, 1);
    setAnnee(d.getFullYear());
    setMois(d.getMonth());
    setJour(null);
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Calendrier
        annee={annee}
        mois={mois}
        joursAvecEvenement={joursAvecEvenement}
        jourSelectionne={jour}
        onChangerMois={changerMois}
        onSelectionnerJour={setJour}
      />
      {duJour.map((e) => (
        <LigneListe
          key={e.id}
          titre={e.titre}
          sousTitre={`${e.date}${e.heure_debut ? ` · ${e.heure_debut}` : ''}${e.lieu ? ` · ${e.lieu}` : ''}`}
          badge={e.type}
          onPress={() => ouvrir(`/gestion/evenements/${e.id}`)}
        />
      ))}
    </View>
  );
}
