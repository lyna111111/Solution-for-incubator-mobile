import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { adminEnvoyer } from '@/admin/api';
import type { ChampDef } from '@/admin/types';
import { ChoixPuces, FormulaireAdmin } from '@/admin/ui';
import { Screen } from '@/components/Screen';
import { useReculer } from '@/hooks/useReculer';
import { useT } from '@/i18n';
import { useColors } from '@/theme';

const MODES = ['Diffusion à tous', 'À un utilisateur', 'À plusieurs utilisateurs'];
const SOURCE = 'notifications/destinataires/';

function champs(mode: string): ChampDef[] {
  const base: ChampDef[] = [
    { nom: 'titre', label: 'Titre', type: 'text', requis: true },
    { nom: 'message', label: 'Message', type: 'textarea', requis: true },
  ];
  if (mode === MODES[1]) base.push({ nom: 'destinataire', label: 'Destinataire', type: 'utilisateur', source: SOURCE, requis: true });
  if (mode === MODES[2]) base.push({ nom: 'destinataires', label: 'Destinataires', type: 'utilisateurs', source: SOURCE, requis: true });
  return base;
}

export default function NouvelleNotification() {
  const t = useT();
  const reculer = useReculer();
  const colors = useColors();
  const [mode, setMode] = useState(MODES[0]);
  const queryClient = useQueryClient();

  async function envoyer(valeurs: Record<string, any>) {
    const chemin = mode === MODES[0] ? 'broadcast/' : mode === MODES[1] ? 'unicast/' : 'multicast/';
    await adminEnvoyer('post', `notifications/${chemin}`, valeurs);
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    reculer();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t('Nouvelle notification') }} />
      <Text style={{ fontWeight: '600', color: colors.text }}>{t('Destinataires')}</Text>
      <ChoixPuces options={MODES} valeur={mode} onChoisir={setMode} />
      <FormulaireAdmin key={mode} champs={champs(mode)} mode="creation" libelle="Envoyer" onSubmit={envoyer} />
    </Screen>
  );
}
