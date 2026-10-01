/**
 * Service d'initialisation de Firebase Analytics.
 *
 * Principes :
 *  - Web uniquement. Dans la WebView Capacitor l'origine est capacitor://localhost,
 *    qui n'est pas un domaine autorisé dans la console Firebase : les envois
 *    seraient rejetés. Sur mobile, la mesure passe par Firebase Analytics pour
 *    Android (SDK natif), pas par ce module.
 *  - Aucune erreur ne doit jamais remonter : une config absente, un adblock ou
 *    un navigateur sans stockagetu ne doivent pas empêcher l'app de démarrer.
 *    Toutes les fonctions sont donc inertes (no-op) si l'init a échoué.
 *  - Initialisation paresseuse et unique, pour ne pas ralentir le premier rendu.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { firebaseConfig, isAnalyticsEnabledByEnv, isFirebaseAnalyticsConfigured } from '../utils/firebaseConfig';

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let initPromise: Promise<void> | null = null;
let disabled = false;

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/**
 * Démarre Analytics. Idempotent : les appels suivants réutilisent la même
 * promesse. Ne pas awaiter, c'est volontairement non bloquant.
 */
export function initAnalytics(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (disabled) return;
      if (typeof window === 'undefined') return;
      if (isNativePlatform()) return;
      if (!isAnalyticsEnabledByEnv()) return;
      if (!isFirebaseAnalyticsConfigured()) return;

      // isSupported() vérifie le navigateur, l'accès aux cookies et au stockage.
      if (!(await isSupported())) return;

      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('[analytics] Initialisation Firebase Analytics ignoree :', error);
      disabled = true;
    }
  })();

  return initPromise;
}

/** true si Analytics est operationnel et peut recevoir des evenements. */
export function isAnalyticsActive(): boolean {
  return analytics !== null;
}

/**
 * Enregistre un evenement personnalise. Silence si Analytics n'est pas actif,
 * ce qui permet d'appeler ce service sans conditionner l'appelant.
 */
export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
): void {
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch (error) {
    console.warn(`[analytics] Evenement "${name}" non envoye :`, error);
  }
}
