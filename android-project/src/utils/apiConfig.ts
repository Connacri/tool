/**
 * Résolution de l'URL de base de l'API backend (server.ts).
 *
 * En web classique, le front et server.ts sont servis depuis la même
 * origine : les appels relatifs ('/api/...') fonctionnent tels quels.
 *
 * Dans l'app Android/iOS empaquetée avec Capacitor, la WebView charge le
 * bundle depuis le stockage local du device (scheme https://localhost ou
 * capacitor://localhost selon la plateforme) — il n'y a AUCUN serveur
 * Express derrière. Un fetch('/api/generate-phrases') échouerait donc
 * systématiquement (pas de route à cette origine).
 *
 * VITE_API_BASE_URL doit être définie au moment du build (fichier .env.production
 * ou variable d'environnement CI) avec l'URL publique complète du serveur
 * server.ts une fois déployé, ex. :
 *   VITE_API_BASE_URL=https://autopost-api.exemple.com
 *
 * Sans cette variable (cas du build web actuel), le comportement existant
 * est préservé à l'identique (chemin relatif '/api/...').
 */
const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

// Retire un slash final éventuel pour éviter un double slash lors de la concaténation.
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  // path est toujours attendu sous la forme '/api/...'.
  return normalizedBaseUrl ? `${normalizedBaseUrl}${path}` : path;
}
