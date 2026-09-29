/**
 * Configuration Firebase (Analytics) lue depuis les variables d'environnement Vite.
 *
 * Les valeurs proviennent de la console Firebase (Project settings > Your apps >
 * SDK setup and configuration > Config). Elles sont injectées dans le bundle au
 * moment du build, via un fichier .env.local (ignoré par git) ou des variables
 * d'environnement CI.
 *
 * Rappel sécurité : ces valeurs ne sont pas des secrets. Une clé API Firebase
 * est unhashed et publique par conception — elle est embarquée dans le bundle
 * web. La vraie protection repose sur les Security Rules de Firebase et sur la
 * liste des domaines autorisés de la console. Ne jamais y mettre de clé privée,
 * de mot de passe ou de service account.
 *
 * Si les variables sont absentes, isFirebaseAnalyticsConfigured() renvoie false
 * et le service d'analytics reste inerte : l'application fonctionne normalement.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
};

/**
 * Analytics peut être coupé sans toucher au code, ex. pour un build de debug :
 *   VITE_FIREBASE_ANALYTICS_ENABLED=false
 */
export function isAnalyticsEnabledByEnv(): boolean {
  return (import.meta.env.VITE_FIREBASE_ANALYTICS_ENABLED || '').trim().toLowerCase() !== 'false';
}

/**
 * Performance Monitoring se coupe de la même façon, indépendamment d'Analytics :
 *   VITE_FIREBASE_PERFORMANCE_ENABLED=false
 *
 * Raise la main sur les Core Web Vitals, donc utile en production, mais
 * bruyant en développement local où les timings neinterested personne.
 */
export function isPerformanceEnabledByEnv(): boolean {
  return (import.meta.env.VITE_FIREBASE_PERFORMANCE_ENABLED || '').trim().toLowerCase() !== 'false';
}

/**
 * Les 3 champs indispensables pour initialiser un projet Firebase valide.
 * Sans eux, mieux vaut ne rien initialiser que lever une erreur au démarrage.
 */
export function isFirebaseAnalyticsConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
