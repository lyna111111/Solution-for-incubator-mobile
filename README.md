# Solution for Incubator — Application mobile

Application mobile (React Native + Expo, TypeScript) qui utilise le backend Django existant
(projet `Solution-for-Incubator`) via son API REST, sous le préfixe `/api/mobile/`.
**Elle ne contient aucun backend.**

## Lancer l'application sur un téléphone Android

### 1. Préparer le backend (projet web)

1. Dans le `.env` du projet web, ajoutez l'IP de votre PC à `ALLOWED_HOSTS` :
   `ALLOWED_HOSTS=localhost,127.0.0.1,[::1],192.168.1.101`
2. Lancez Django en écoutant sur tout le réseau local (et non seulement sur le PC) :
   `python manage.py runserver 0.0.0.0:8000`
3. Autorisez le port 8000 dans le pare-feu Windows si le téléphone n'arrive pas à se connecter.
4. Vérifiez depuis le navigateur du **téléphone** : `http://192.168.1.101:8000/api/incubateurs/`
   doit afficher une liste JSON.

### 2. Lancer l'app mobile

1. Installez **Expo Go** sur le téléphone (Play Store).
2. Le téléphone et le PC doivent être sur **le même Wi-Fi**.
3. Dans ce dossier : `npm install` (la première fois), puis `npm start`.
4. Scannez le QR code affiché avec Expo Go.

### Changer l'adresse du backend

Un seul fichier : [src/config.ts](src/config.ts)

- `DEV_API_URL` : IP locale du PC (`ipconfig` → « Adresse IPv4 »), utilisée pendant les tests.
- `PROD_API_URL` : URL HTTPS du serveur de production.

## Structure

```
src/
  config.ts          URL du backend (unique)
  api/               client Axios (JWT + X-Tenant-Slug + refresh) et appels API
  store/auth.ts      session (jetons stockés dans le stockage sécurisé du téléphone)
  app/(auth)/        choix de l'incubateur, connexion, inscription, mot de passe oublié
  app/(app)/         accueil, événements, requêtes, notifications, articles, profil
  components/        composants réutilisables
```

## État d'avancement (étapes convenues)

1. **Authentification des 3 rôles** (connexion, renouvellement du jeton, profil, mot de passe) ✅
2. **Espace utilisateur complet** : accueil, événements (calendrier), requêtes avec pièce jointe, notifications, articles, téléchargement de documents ✅
3. **Espace administrateur** ✅ : tableau de bord, statistiques, utilisateurs et demandes d'inscription, administrateurs, projets,
   événements, requêtes (réponse, statut), notifications (diffusion, personnelle, groupe), documents, articles.
   Le menu « Gestion » ne montre que les modules auxquels le type d'administrateur a droit.
4. Espace Super Admin : à venir.

Toute l'application passe par l'API `/api/mobile/` du backend (jetons JWT ; jamais de cookie de session).

## Écrans de l'espace utilisateur

Choix de l'incubateur · Connexion · Inscription · Mot de passe oublié · Accueil · Événements
(calendrier, filtres, détail) · Requêtes (liste, filtres, envoi, détail et réponses) ·
Notifications (badge, marquer lu) · Articles · Profil (modification, déconnexion).

## Limites actuelles (côté API du backend, à ajouter plus tard)

- Articles : pas d'API → l'écran explique l'indisponibilité.
- Pièces jointes des requêtes et téléchargement de documents : pas d'API.
- Changement de mot de passe depuis le profil : pas d'API.
- Espaces Administrateur et Super Admin : pas d'API.
- Le renouvellement automatique du jeton (`/api/auth/refresh/`) est probablement défaillant côté
  backend : si la session expire après 15 minutes, l'app renvoie simplement à la connexion.
