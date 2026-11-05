/// <reference types="jest" />
/**
 * Scénarios de navigation joués sur le vrai routeur (layouts de l'application, pages remplacées par des
 * maquettes). Vérifie surtout le bouton Retour : dans le Menu, il ramène toujours à la page parente de la page affichée.
 */
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { BackHandler, Pressable, Text, View } from 'react-native';

import { useOuvrir, useRemplacer } from '@/hooks/useOuvrir';
import { useReculer } from '@/hooks/useReculer';
import { BoutonMenu } from '@/components/BoutonMenu';
import { pageParente } from '@/navigation/retour';

let mockBadge = 0;
jest.mock('@/hooks/useNotifications', () => ({ useNonLues: () => 0, useBadgeRequetes: () => mockBadge }));
jest.mock('@/hooks/useActualiserCompte', () => ({ useActualiserCompte: () => ({ refreshing: false, actualiser: async () => {} }) }));
let mockRole = 'utilisateur';
jest.mock('@/store/auth', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { role: mockRole, modules: ['requetes', 'projets'] } }),
}));
jest.mock('@expo/vector-icons', () => ({ FontAwesome5: () => null }));
jest.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));

const AppLayout = jest.requireActual('../app/(app)/_layout');
const MenuLayout = jest.requireActual('../app/(app)/(menu)/_layout'); // avec `unstable_settings`
const Menu = jest.requireActual('../app/(app)/(menu)/menu');

/** Page d'onglet (Accueil, Profil) : boutons qui ouvrent des pages du Menu. */
const onglet = (nom: string) =>
  function Onglet() {
    const ouvrir = useOuvrir();
    return (
      <View>
        <Text>{nom}</Text>
        <BoutonMenu />
        <Pressable onPress={() => ouvrir('/requetes')}><Text>{nom}-vers-requetes</Text></Pressable>
        <Pressable onPress={() => ouvrir('/evenements')}><Text>{nom}-vers-evenements</Text></Pressable>
        <Pressable onPress={() => ouvrir('/requetes/7')}><Text>{nom}-vers-detail</Text></Pressable>
        <Pressable onPress={() => ouvrir('/requetes/nouvelle')}><Text>{nom}-vers-nouvelle</Text></Pressable>
        <Pressable onPress={() => ouvrir({ pathname: '/requetes', params: { statut: 'completed' } })}><Text>{nom}-vers-filtre</Text></Pressable>
      </View>
    );
  };

/** Page du Menu : liens vers d'autres pages et bouton d'enregistrement (retour programmatique). */
const pageMenu = (nom: string) =>
  function PageMenu() {
    const ouvrir = useOuvrir();
    const reculer = useReculer();
    const remplacer = useRemplacer();
    return (
      <View>
        <Text>{nom}</Text>
        <Pressable onPress={() => ouvrir('/requetes/7')}><Text>{nom}-vers-detail</Text></Pressable>
        <Pressable onPress={() => ouvrir('/requetes/nouvelle')}><Text>{nom}-vers-nouvelle</Text></Pressable>
        <Pressable onPress={() => ouvrir('/evenements')}><Text>{nom}-vers-evenements</Text></Pressable>
        <Pressable onPress={reculer}><Text>{nom}-enregistrer</Text></Pressable>
        <Pressable onPress={() => remplacer('/requetes/7')}><Text>{nom}-remplacer</Text></Pressable>
      </View>
    );
  };

function monter(initialUrl = '/') {
  return renderRouter(
    {
      '(app)/_layout': AppLayout,
      '(app)/index': onglet('ACCUEIL'),
      '(app)/profil': onglet('PROFIL'),
      '(app)/raccourci-requetes': () => null,
      '(app)/(menu)/_layout': MenuLayout,
      '(app)/(menu)/menu': Menu,
      '(app)/(menu)/requetes/index': pageMenu('REQUETES'),
      '(app)/(menu)/requetes/nouvelle': pageMenu('NOUVELLE'),
      '(app)/(menu)/requetes/[id]': pageMenu('DETAIL'),
      '(app)/(menu)/evenements/index': pageMenu('EVENEMENTS'),
      '(app)/(menu)/evenements/[id]': pageMenu('EVENEMENT'),
      '(app)/(menu)/notifications/index': pageMenu('NOTIFS'),
      '(app)/(menu)/notifications/[id]': pageMenu('NOTIF'),
      '(app)/(menu)/articles/index': pageMenu('ARTICLES'),
      '(app)/(menu)/articles/[id]': pageMenu('ARTICLE'),
      '(app)/(menu)/gestion/requetes/index': pageMenu('GEST-REQUETES'),
      '(app)/(menu)/gestion/requetes/[id]': pageMenu('GEST-REQUETE'),
      '(app)/(menu)/gestion/projets/index': pageMenu('GEST-PROJETS'),
      '(app)/(menu)/gestion/projets/[id]': pageMenu('GEST-PROJET'),
      '(app)/(menu)/incubateurs/index': pageMenu('INCUBATEURS'),
      '(app)/(menu)/incubateurs/[id]': pageMenu('INCUBATEUR'),
      '(app)/(menu)/paiements/index': pageMenu('PAIEMENTS'),
      '(app)/(menu)/paiements/[id]': pageMenu('PAIEMENT'),
    },
    { initialUrl },
  );
}

// Les remises à zéro de la pile du Menu s'exécutent après l'animation / à l'image suivante : on avance l'horloge simulée.
const laisserPasserAnimations = () => act(async () => { await jest.advanceTimersByTimeAsync(2000); });
const appuyer = async (texte: string) => {
  await act(async () => { fireEvent.press(screen.getByText(texte)); });
  await laisserPasserAnimations();
};
const retour = async () => {
  await act(async () => { fireEvent.press(screen.getByLabelText('Retour')); });
  await laisserPasserAnimations();
};
const ongletBarre = async (nom: string) => {
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: new RegExp(nom) })); });
  await laisserPasserAnimations();
};

const ouvrirMenu = async () => {
  await act(async () => { fireEvent.press(screen.getByLabelText('Menu')); });
  await laisserPasserAnimations();
};

describe("pastille de l'onglet Requêtes", () => {
  afterEach(() => { mockBadge = 0; });

  test('affiche le nombre de requêtes quand il est positif', async () => {
    mockBadge = 3;
    await monter('/');
    expect(screen.getByText('3')).toBeTruthy();
  });

  test("aucune pastille quand il n'y en a pas", async () => {
    await monter('/');
    expect(screen.queryByText('0')).toBeNull();
  });
});

describe('depuis les onglets : le retour ramène à l\'onglet d\'où la page a été ouverte', () => {
  test('Accueil -> page -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('Profil -> page -> Retour -> Profil', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    expect(r.getPathname()).toBe('/profil');
    await appuyer('PROFIL-vers-evenements');
    expect(r.getPathname()).toBe('/evenements');
    await retour();
    expect(r.getPathname()).toBe('/profil');
  });

  test('Accueil -> liste -> détail -> Retour -> liste -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    await appuyer('REQUETES-vers-detail');
    expect(r.getPathname()).toBe('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('détail ouvert directement depuis l\'Accueil -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-detail');
    expect(r.getPathname()).toBe('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('page ouverte avec des paramètres depuis le Profil : ils sont conservés, Retour -> Profil', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await appuyer('PROFIL-vers-filtre');
    expect(r.getPathname()).toBe('/requetes');
    expect(r.getSearchParams()).toMatchObject({ statut: 'completed', retour: '/profil' });
    await retour();
    expect(r.getPathname()).toBe('/profil');
  });
});

describe('depuis la liste du Menu', () => {
  test('Accueil -> Menu -> page -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/menu');
    await appuyer('Mes Requêtes');
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('Profil -> Menu -> page -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await ouvrirMenu();
    await appuyer('Mes Requêtes');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('Accueil -> carte -> Retour -> Accueil, puis Menu -> même page -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/menu'); // la liste, et non la page précédemment ouverte
    await appuyer('Mes Requêtes');
    await retour();
    expect(r.getPathname()).toBe('/menu'); // ouverte depuis le Menu : on y revient, pas à l'Accueil
  });

  test('Menu quitté sans Retour : l\'onglet Menu rouvre toujours la liste', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Mes Requêtes');
    await ongletBarre('Profil');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/menu');
    await appuyer('Événements');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

});

describe('navigation successive dans le Menu', () => {
  test('liste -> détail -> nouvelle : chaque page revient à sa page parente', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Mes Requêtes');
    await appuyer('REQUETES-vers-detail');
    await appuyer('DETAIL-vers-nouvelle');
    expect(r.getPathname()).toBe('/requetes/nouvelle');
    await retour();
    expect(r.getPathname()).toBe('/requetes'); // la liste (parent de « nouvelle »), pas le détail d'où l'on vient
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('page A -> page B (autre module) -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    await appuyer('REQUETES-vers-evenements');
    expect(r.getPathname()).toBe('/evenements');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('retour programmatique (enregistrer / supprimer) = même destination que la flèche', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-detail');
    await appuyer('DETAIL-enregistrer');
    expect(r.getPathname()).toBe('/');

    await ouvrirMenu();
    await appuyer('Mes Requêtes');
    await appuyer('REQUETES-vers-detail');
    await appuyer('DETAIL-enregistrer');
    expect(r.getPathname()).toBe('/requetes');
    await appuyer('REQUETES-enregistrer');
    expect(r.getPathname()).toBe('/menu');
  });

  test('double appui sur un lien : une seule page ouverte', async () => {
    const r = await monter('/');
    await act(async () => {
      fireEvent.press(screen.getByText('ACCUEIL-vers-requetes'));
      fireEvent.press(screen.getByText('ACCUEIL-vers-requetes'));
    });
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
  });
});

describe('accès direct et actualisation', () => {
  test('lien direct vers une page : Retour mène à la liste du Menu', async () => {
    const r = await monter('/requetes');
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('lien direct vers un détail : Retour mène à sa liste, puis à la liste du Menu', async () => {
    const r = await monter('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('après un accès direct, la navigation normale reprend (Accueil -> page -> Retour)', async () => {
    const r = await monter('/requetes');
    await ongletBarre('Accueil');
    expect(r.getPathname()).toBe('/');
    await appuyer('ACCUEIL-vers-evenements');
    await retour();
    expect(r.getPathname()).toBe('/');
  });
});

describe('remplacement de page (création -> fiche)', () => {
  test('liste -> formulaire remplacé par la fiche -> Retour -> liste -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Mes Requêtes');
    await appuyer('REQUETES-vers-nouvelle');
    await appuyer('NOUVELLE-remplacer');
    expect(r.getPathname()).toBe('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });
});

describe('remplacement de page depuis un onglet', () => {
  test('Accueil -> formulaire remplacé par la fiche -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-nouvelle');
    await appuyer('NOUVELLE-remplacer');
    expect(r.getPathname()).toBe('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/');
  });
});

describe("bouton retour d'Android", () => {
  // Simule Android : les écouteurs « retour » sont appelés du dernier enregistré au premier, jusqu'à ce que l'un réponde.
  const ecouteurs: ((...args: never[]) => boolean | null | undefined)[] = [];
  beforeEach(() => {
    ecouteurs.length = 0;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_nom, ecouteur) => {
      ecouteurs.push(ecouteur);
      return { remove: () => { const i = ecouteurs.indexOf(ecouteur); if (i >= 0) ecouteurs.splice(i, 1); } };
    });
  });
  afterEach(() => jest.restoreAllMocks());
  const materiel = () => act(async () => {
    for (const ecouteur of [...ecouteurs].reverse()) if (ecouteur(...([] as never[]))) break;
    await jest.advanceTimersByTimeAsync(2000);
  });

  test("même destination que la flèche : détail -> liste -> onglet d'origine", async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await appuyer('PROFIL-vers-requetes');
    await appuyer('REQUETES-vers-detail');
    expect(r.getPathname()).toBe('/requetes/7');
    await materiel();
    expect(r.getPathname()).toBe('/requetes');
    await materiel();
    expect(r.getPathname()).toBe('/profil');
  });

  test("depuis la liste du Menu : revient à l'onglet précédent (historique des onglets)", async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await materiel();
    expect(r.getPathname()).toBe('/');
  });
});

describe.each([
  ['utilisateur', 'Mes Requêtes', '/requetes', 'REQUETES'],
  ['admin', 'Gestion des Requêtes', '/gestion/requetes', 'GEST-REQUETES'],
  ['admin', 'Gestion des Projets', '/gestion/projets', 'GEST-PROJETS'],
  ['superadmin', 'Incubateurs', '/incubateurs', 'INCUBATEURS'],
  ['superadmin', 'Paiements', '/paiements', 'PAIEMENTS'],
])('rôle %s : entrée « %s » du Menu', (role, entree, chemin, maquette) => {
  beforeEach(() => { mockRole = role; });
  afterAll(() => { mockRole = 'utilisateur'; });

  test('Accueil -> Menu -> entrée -> autre module -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer(entree);
    expect(r.getPathname()).toBe(chemin);
    await appuyer(`${maquette}-vers-evenements`);
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });

  test('Profil -> Menu -> entrée -> Retour -> liste du Menu', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await ouvrirMenu();
    await appuyer(entree);
    await retour();
    expect(r.getPathname()).toBe('/menu');
  });
});

describe("page parente d'après le nom de la route", () => {
  test.each([
    ['requetes/index', '/menu'],
    ['requetes/[id]', '/requetes'],
    ['requetes/nouvelle', '/requetes'],
    ['superadmins/nouveau', '/superadmins'],
    ['gestion/requetes/index', '/menu'],
    ['gestion/requetes/[id]', '/gestion/requetes'],
    ['gestion/articles/nouveau', '/gestion/articles'],
    ['gestion/statistiques', '/menu'],
    ['gestion/documents/index', '/menu'],
  ])('%s -> %s', (route, parent) => {
    expect(pageParente(route)).toBe(parent);
  });
});

describe('espace de connexion', () => {
  const { Stack } = jest.requireActual('expo-router');
  const { useReculer } = jest.requireActual('../hooks/useReculer');
  const Layout = () => <Stack screenOptions={{ headerShown: false }} />;
  const ecran = (nom: string, versOuvrir?: string) =>
    function Ecran() {
      const ouvrir = useOuvrir();
      const reculer = useReculer({ secours: '/login', android: true });
      return (
        <View>
          <Text>{nom}</Text>
          {versOuvrir && <Pressable onPress={() => ouvrir(versOuvrir as never)}><Text>{nom}-ouvrir</Text></Pressable>}
          <Pressable onPress={reculer}><Text>{nom}-retour</Text></Pressable>
        </View>
      );
    };
  const monterAuth = (initialUrl: string) =>
    renderRouter({ _layout: Layout, index: ecran('BIENVENUE', '/login'), login: ecran('LOGIN', '/register'), register: ecran('REGISTER') }, { initialUrl });

  test('Bienvenue -> Connexion -> Inscription -> Retour -> Connexion -> Retour -> Bienvenue', async () => {
    const r = await monterAuth('/');
    await appuyer('BIENVENUE-ouvrir');
    await appuyer('LOGIN-ouvrir');
    expect(r.getPathname()).toBe('/register');
    await appuyer('REGISTER-retour');
    expect(r.getPathname()).toBe('/login');
    await appuyer('LOGIN-retour');
    expect(r.getPathname()).toBe('/');
  });

  test('accès direct à l\'inscription : Retour mène à la connexion', async () => {
    const r = await monterAuth('/register');
    await appuyer('REGISTER-retour');
    expect(r.getPathname()).toBe('/login');
  });
});
