/**
 * Configuration unique de l'application.
 *
 * C'est le SEUL endroit à modifier pour changer l'adresse du backend.
 */

// Pendant les tests : IP locale de votre PC (celle du backend Django lancé avec
// `python manage.py runserver 0.0.0.0:8000`). Votre téléphone et votre PC
// doivent être sur le même Wi-Fi. Pour connaître l'IP : `ipconfig` -> "Adresse IPv4".
const DEV_API_URL = 'http://192.168.1.101:8000';

// En production : l'adresse HTTPS du serveur (Android bloque le HTTP simple
// dans une application installée).
const PROD_API_URL = 'https://votre-domaine.com';

// `__DEV__` est vrai avec `expo start` (Expo Go), faux dans une application construite.
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const API_URL = `${API_BASE_URL}/api`;

// Slug de l'incubateur utilisé par défaut avant que l'utilisateur ne choisisse le sien.
export const DEFAULT_TENANT_SLUG = 'principal';
