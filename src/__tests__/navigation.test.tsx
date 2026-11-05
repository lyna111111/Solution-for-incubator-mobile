/// <reference types="jest" />
/**
 * Scénarios de navigation joués sur le vrai routeur (layouts de l'application, pages remplacées par des
 * maquettes). Vérifie surtout le bouton Retour : dans le Menu, il ramène à l'onglet d'origine ou à la page parente de la page affichée.
 */
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { BackHandler, Pressable, Text, View } from 'react-native';

import { useOuvrir, useRemplacer } from '@/hooks/useOuvrir';
import { useReculer } from '@/hooks/useReculer';
import { BoutonMenu } from '@/components/BoutonMenu';
import { SelecteurLangue } from '@/components/SelecteurLangue';
import { pageParente } from '@/navigation/retour';
import { useMenuStore } from '@/store/menu';
import { useLangStore } from '@/i18n';

let mockNonLues = 0;
jest.mock('@/hooks/useNotifications', () => ({ useNonLues: () => mockNonLues }));
jest.mock('@/hooks/useActualiserCompte', () => ({ useActualiserCompte: () => ({ refreshing: false, actualiser: async () => {} }) }));
let mockRole = 'utilisateur';
jest.mock('@/store/auth', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { role: mockRole, modules: ['requetes', 'projets'] } }),
}));
// Le tiroir du Menu a la déconnexion (vide le cache des requêtes) : pas de fournisseur de requêtes dans ces scénarios.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ clear: () => {} }),
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
        <SelecteurLangue />
        <Pressable onPress={() => ouvrir('/requetes')}><Text>{nom}-vers-requetes</Text></Pressable>
        <Pressable onPress={() => ouvrir('/evenements')}><Text>{nom}-vers-evenements</Text></Pressable>
        <Pressable onPress={() => ouvrir('/requetes/7')}><Text>{nom}-vers-detail</Text></Pressable>
        <Pressable onPress={() => ouvrir('/requetes/nouvelle')}><Text>{nom}-vers-nouvelle</Text></Pressable>
        <Pressable onPress={() => ouvrir({ pathname: '/requetes', params: { statut: 'completed' } })}><Text>{nom}-vers-filtre</Text></Pressable>
      </View>
    );
  };

/**
 * Page du Menu : liens vers d'autres pages et bouton d'enregistrement (retour programmatique). `base` : module dont
 * elle fait partie (détail et formulaire de création), `autre` : page d'un autre module.
 */
const pageMenu = (nom: string, base = 'requetes', autre = '/evenements') =>
  function PageMenu() {
    const ouvrir = useOuvrir();
    const reculer = useReculer();
    const remplacer = useRemplacer();
    return (
      <View>
        <Text>{nom}</Text>
        <Pressable onPress={() => ouvrir(`/${base}/7` as never)}><Text>{nom}-vers-detail</Text></Pressable>
        <Pressable onPress={() => ouvrir(`/${base}/nouvelle` as never)}><Text>{nom}-vers-nouvelle</Text></Pressable>
        <Pressable onPress={() => ouvrir(autre as never)}><Text>{nom}-vers-evenements</Text></Pressable>
        <Pressable onPress={reculer}><Text>{nom}-enregistrer</Text></Pressable>
        <Pressable onPress={() => remplacer(`/${base}/7` as never)}><Text>{nom}-remplacer</Text></Pressable>
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
      '(app)/raccourci-notifications': () => null,
      '(app)/(menu)/_layout': MenuLayout,
      '(app)/(menu)/menu': Menu,
      '(app)/(menu)/requetes/index': pageMenu('REQUETES'),
      '(app)/(menu)/requetes/nouvelle': pageMenu('NOUVELLE'),
      '(app)/(menu)/requetes/[id]': pageMenu('DETAIL'),
      '(app)/(menu)/evenements/index': pageMenu('EVENEMENTS', 'evenements', '/articles'),
      '(app)/(menu)/evenements/nouvelle': pageMenu('EVENEMENT-NOUVEAU', 'evenements', '/articles'),
      '(app)/(menu)/evenements/[id]': pageMenu('EVENEMENT', 'evenements', '/articles'),
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

describe('onglet Notifications de la barre du bas', () => {
  afterEach(() => { mockNonLues = 0; mockRole = 'utilisateur'; });

  test("affiche le nombre de notifications non lues, une seule fois : ni sur l'onglet Requêtes ni sur le burger", async () => {
    mockNonLues = 4;
    await monter('/');
    expect(screen.getAllByText('4')).toHaveLength(1);
  });

  test("aucune pastille quand il n'y a rien de non lu", async () => {
    await monter('/');
    expect(screen.queryByText('0')).toBeNull();
  });

  test("ouvre la page des notifications ; Retour ramène à l'onglet d'origine", async () => {
    const r = await monter('/');
    await ongletBarre('Notifications');
    expect(r.getPathname()).toBe('/notifications');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test("l'onglet Requêtes ouvre la page des requêtes", async () => {
    const r = await monter('/');
    await ongletBarre('Requêtes');
    expect(r.getPathname()).toBe('/requetes');
  });

  test("pas d'onglet Notifications pour un administrateur", async () => {
    mockRole = 'admin';
    await monter('/');
    expect(screen.queryByRole('button', { name: /Notifications/ })).toBeNull();
  });

  test('le Menu ne propose plus ni les notifications ni les requêtes', async () => {
    await monter('/');
    await ouvrirMenu();
    expect(screen.getAllByText('Notifications')).toHaveLength(1); // seulement le libellé de l'onglet de la barre
    expect(screen.queryByText('Mes Requêtes')).toBeNull();
    expect(screen.getByText('Événements')).toBeTruthy();
  });

  test("le Menu de l'administrateur ne propose plus la gestion des requêtes", async () => {
    mockRole = 'admin';
    await monter('/');
    await ouvrirMenu();
    expect(screen.queryByText('Gestion des Requêtes')).toBeNull();
    expect(screen.getByText('Gestion des Projets')).toBeTruthy();
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

// Le tiroir est un état global : chaque scénario repart avec le Menu fermé.
beforeEach(() => { useMenuStore.setState({ ouvert: false }); useLangStore.setState({ lang: 'fr' }); });

describe('Menu latéral (tiroir à droite)', () => {
  test("le burger ouvre le tiroir par-dessus la page, sans changer de page", async () => {
    const r = await monter('/');
    expect(screen.queryByText('Articles')).toBeNull();
    await ouvrirMenu();
    expect(screen.getByText('Articles')).toBeTruthy();
    expect(screen.getByText('ACCUEIL')).toBeTruthy(); // la page reste affichée en dessous
    expect(r.getPathname()).toBe('/');
  });

  test('le choix de la langue traduit le tiroir et la barre du bas', async () => {
    await monter('/');
    expect(screen.getAllByText('Profil').length).toBeGreaterThan(0);
    // L'icône globe de la barre du haut (Accueil) ouvre le choix de la langue.
    await act(async () => { fireEvent.press(screen.getByLabelText('Langue')); });
    await laisserPasserAnimations();
    await act(async () => { fireEvent.press(screen.getByLabelText('English')); });
    await laisserPasserAnimations();
    await ouvrirMenu();
    expect(screen.getByText('Events')).toBeTruthy();
    expect(screen.queryByText('Événements')).toBeNull();
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
    await act(async () => { fireEvent.press(screen.getAllByLabelText('Close the menu')[0]); });
    await laisserPasserAnimations();
    await act(async () => { fireEvent.press(screen.getByLabelText('Language')); });
    await laisserPasserAnimations();
    await act(async () => { fireEvent.press(screen.getByLabelText('عربية')); });
    await laisserPasserAnimations();
    await ouvrirMenu();
    expect(screen.getByText('الفعاليات')).toBeTruthy();
    expect(screen.getAllByText('الملف الشخصي').length).toBeGreaterThan(0);
  });

  test('le tiroir a un bouton de déconnexion', async () => {
    await monter('/');
    await ouvrirMenu();
    expect(screen.getByText('Se déconnecter')).toBeTruthy();
  });

  test('un appui sur le fond du tiroir le ferme', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await act(async () => { fireEvent.press(screen.getAllByLabelText('Fermer le menu')[0]); });
    await laisserPasserAnimations();
    expect(screen.queryByText('Articles')).toBeNull();
    expect(r.getPathname()).toBe('/');
  });

  test('choisir une entrée ferme le tiroir et ouvre la page', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Articles');
    expect(r.getPathname()).toBe('/articles');
    expect(screen.queryByText('Événements')).toBeNull();
  });
});

describe('depuis le Menu latéral', () => {
  test('Accueil -> Menu -> page -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/');
    await appuyer('Événements');
    expect(r.getPathname()).toBe('/evenements');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('Profil -> Menu -> page -> Retour -> Profil', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await ouvrirMenu();
    await appuyer('Événements');
    await retour();
    expect(r.getPathname()).toBe('/profil');
  });

  test('Accueil -> carte -> Retour -> Accueil, puis Menu -> même page -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/'); // le tiroir ne change pas de page
    await appuyer('Événements');
    await retour();
    expect(r.getPathname()).toBe('/'); // ouverte depuis le Menu sur l'Accueil : on y revient
  });

  test('Menu quitté sans Retour : le burger rouvre toujours le tiroir', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Articles');
    await ongletBarre('Profil');
    await ouvrirMenu();
    expect(r.getPathname()).toBe('/profil');
    await appuyer('Événements');
    await retour();
    expect(r.getPathname()).toBe('/profil');
  });

});

describe('navigation successive dans le Menu', () => {
  test('liste -> détail -> nouvelle : chaque page revient à sa page parente', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Événements');
    await appuyer('EVENEMENTS-vers-detail');
    await appuyer('EVENEMENT-vers-nouvelle');
    expect(r.getPathname()).toBe('/evenements/nouvelle');
    await retour();
    expect(r.getPathname()).toBe('/evenements'); // la liste (parent de « nouvelle »), pas le détail d'où l'on vient
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('page A -> page B (autre module) -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-requetes');
    await appuyer('REQUETES-vers-evenements');
    expect(r.getPathname()).toBe('/evenements');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('retour programmatique (enregistrer / supprimer) = même destination que la flèche', async () => {
    const r = await monter('/');
    await appuyer('ACCUEIL-vers-detail');
    await appuyer('DETAIL-enregistrer');
    expect(r.getPathname()).toBe('/');

    await ouvrirMenu();
    await appuyer('Événements');
    await appuyer('EVENEMENTS-vers-detail');
    await appuyer('EVENEMENT-enregistrer');
    expect(r.getPathname()).toBe('/evenements');
    await appuyer('EVENEMENTS-enregistrer');
    expect(r.getPathname()).toBe('/');
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
  test("lien direct vers une page : Retour mène à l'Accueil", async () => {
    const r = await monter('/requetes');
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test("lien direct vers un détail : Retour mène à sa liste, puis à l'Accueil", async () => {
    const r = await monter('/requetes/7');
    await retour();
    expect(r.getPathname()).toBe('/requetes');
    await retour();
    expect(r.getPathname()).toBe('/');
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
  test('liste -> formulaire remplacé par la fiche -> Retour -> liste -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer('Événements');
    await appuyer('EVENEMENTS-vers-nouvelle');
    await appuyer('EVENEMENT-NOUVEAU-remplacer');
    expect(r.getPathname()).toBe('/evenements/7');
    await retour();
    expect(r.getPathname()).toBe('/evenements');
    await retour();
    expect(r.getPathname()).toBe('/');
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

  test('Menu ouvert : le bouton retour le ferme sans quitter la page', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    expect(screen.getByText('Articles')).toBeTruthy();
    await materiel();
    expect(screen.queryByText('Articles')).toBeNull();
    expect(r.getPathname()).toBe('/');
  });
});

describe.each([
  ['utilisateur', 'Articles', '/articles', 'ARTICLES'],
  ['admin', 'Gestion des Projets', '/gestion/projets', 'GEST-PROJETS'],
  ['superadmin', 'Incubateurs', '/incubateurs', 'INCUBATEURS'],
  ['superadmin', 'Paiements', '/paiements', 'PAIEMENTS'],
])('rôle %s : entrée « %s » du Menu', (role, entree, chemin, maquette) => {
  beforeEach(() => { mockRole = role; });
  afterAll(() => { mockRole = 'utilisateur'; });

  test('Accueil -> Menu -> entrée -> autre module -> Retour -> Accueil', async () => {
    const r = await monter('/');
    await ouvrirMenu();
    await appuyer(entree);
    expect(r.getPathname()).toBe(chemin);
    await appuyer(`${maquette}-vers-evenements`);
    await retour();
    expect(r.getPathname()).toBe('/');
  });

  test('Profil -> Menu -> entrée -> Retour -> Profil', async () => {
    const r = await monter('/');
    await ongletBarre('Profil');
    await ouvrirMenu();
    await appuyer(entree);
    await retour();
    expect(r.getPathname()).toBe('/profil');
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
