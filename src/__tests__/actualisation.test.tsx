/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-require-imports -- modules rechargés à neuf pour chaque test (isolateModules) */
/**
 * Actualisation : une page relit ses données quand on y revient, tirer-pour-actualiser appelle la relecture, et
 * en développement le code est rechargé quand le serveur Expo en a une version plus récente.
 */
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Pressable, Text } from 'react-native';

import { useOuvrir } from '@/hooks/useOuvrir';
import { useReculer } from '@/hooks/useReculer';

jest.mock('@expo/vector-icons', () => ({ FontAwesome5: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: unknown }) => children }));
jest.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));

const { Screen } = jest.requireActual('../components/Screen');
const relire = jest.fn();
const PileDeLApp = () => <Stack />; // comme l'app : la page précédente reste affichée sous la nouvelle

function Liste() {
  const ouvrir = useOuvrir();
  return (
    <Screen onRefresh={relire}>
      <Text>LISTE</Text>
      <Pressable onPress={() => ouvrir('/detail')}><Text>vers-detail</Text></Pressable>
    </Screen>
  );
}
function Detail() {
  const reculer = useReculer();
  return <Pressable onPress={reculer}><Text>retour-liste</Text></Pressable>;
}

describe('Screen', () => {
  beforeEach(() => relire.mockClear());

  test('ne relit pas au premier affichage, relit au retour sur la page', async () => {
    const r = await renderRouter({ _layout: PileDeLApp, index: Liste, detail: Detail }, { initialUrl: '/' });
    expect(relire).not.toHaveBeenCalled();
    await act(async () => { fireEvent.press(screen.getByText('vers-detail')); });
    expect(r.getPathname()).toBe('/detail');
    await act(async () => { fireEvent.press(screen.getByText('retour-liste')); });
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(r.getPathname()).toBe('/');
    expect(relire).toHaveBeenCalledTimes(1);
  });

  test('tirer-pour-actualiser appelle la relecture de la page', async () => {
    await renderRouter({ index: Liste }, { initialUrl: '/' });
    const { refreshControl } = screen.getByTestId('page-defilante').props;
    await act(async () => { refreshControl.props.onRefresh(); });
    expect(relire).toHaveBeenCalledTimes(1);
  });
});

describe('rechargement du code en développement', () => {
  let version = 'v1';
  const reload = jest.fn();
  let rechargerCode: typeof import('../utils/rechargerCode');

  beforeEach(() => {
    version = 'v1';
    reload.mockClear();
    // Module neuf à chaque test (la version chargée y est mémorisée), avec son propre `react-native`.
    jest.isolateModules(() => {
      const rn = require('react-native');
      Object.defineProperty(rn.NativeModules, 'SourceCode', {
        configurable: true,
        value: { scriptURL: 'http://192.168.0.2:8081/entry.bundle?platform=android' },
      });
      rechargerCode = require('../utils/rechargerCode');
    });
    global.fetch = jest.fn(async () => ({ headers: { get: () => version } })) as unknown as typeof fetch;
  });

  test('ne recharge pas tant que le code est inchangé', async () => {
    await rechargerCode.memoriserVersionDuCode();
    await rechargerCode.rechargerCodeSiNouveau(reload);
    expect(reload).not.toHaveBeenCalled();
  });

  test('recharge quand Metro propose un code plus récent', async () => {
    await rechargerCode.memoriserVersionDuCode();
    version = 'v2';
    await rechargerCode.rechargerCodeSiNouveau(reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('garde le code chargé si le serveur est injoignable', async () => {
    await rechargerCode.memoriserVersionDuCode();
    global.fetch = jest.fn(async () => { throw new Error('hors ligne'); }) as unknown as typeof fetch;
    await rechargerCode.rechargerCodeSiNouveau(reload);
    expect(reload).not.toHaveBeenCalled();
  });

  test('ne fait rien dans une app installée (hors développement)', async () => {
    const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    try {
      await rechargerCode.memoriserVersionDuCode();
      version = 'v2';
      await rechargerCode.rechargerCodeSiNouveau(reload);
      expect(reload).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
    }
  });
});
