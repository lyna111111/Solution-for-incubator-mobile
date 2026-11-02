/// <reference types="jest" />
import { render, screen } from '@testing-library/react-native';

import { BandeauBienvenue } from '@/components/DashboardUi';

jest.mock('@expo/vector-icons', () => ({ FontAwesome5: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: unknown }) => children }));

test('le bandeau affiche le rôle et le nom de la personne connectée', async () => {
  await render(<BandeauBienvenue titre="Super Administrateur" nom="Lyna Benali" />);
  expect(screen.getByText('Bienvenue')).toBeTruthy();
  expect(screen.getByText('Super Administrateur')).toBeTruthy();
  expect(screen.getByText('Lyna Benali')).toBeTruthy();
});

test('avec un détail (incubateur), il suit le nom', async () => {
  await render(<BandeauBienvenue titre="Administrateur principal" nom="Sara Amrani" detail="Incubateur Alger" />);
  expect(screen.getByText('Sara Amrani · Incubateur Alger')).toBeTruthy();
});
