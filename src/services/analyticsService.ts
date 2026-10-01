/**
 * Service d'initialisation de Firebase Analytics.
 *
 * Principes :
 *  - Web uniquement. Dans la WebView Capacitor l'origine est capacitor://localhost,
 *    qui n'est pas un domaine autorisé dans la console Firebase : les envois
 *    seraient rejetés. Sur mobile, la mesure passe par Firebase Analytics pour
 *    Android (SDK natif), pas par ce module.
 *  - Aucune erreur ne doit jamais remonter : une config absente, un adblock ou
 *    un navigateur sans stockage ne doivent pas empêcher l'app de démarrer.
 *    Toutes les fonctions sont donc inertes (no-op) si l'init a échoué.
 *  - Initialisation paresseuse et unique, pour ne pas ralentir le premier rendu.
 *
 * Note sur l'import dynamique : même raison que dans performanceService.ts. Les
 * paquets Firebase ne déclarent pas « sideEffects: false », donc un import
 * statif survit au tree-shaking même quand plus aucune de ses fonctions n'est
 * appelée, et le SDK se retrouvait embarqué dans l'APK pour rien. Un import
 * dynamique est supprimé avec le code mort.
 */
import type { Analytics } from 'firebase/analytics';
import { isAnalyticsEnabledByEnv, isFirebaseAnalyticsConfigured } from '../utils/firebaseConfig';
import { getSharedFirebaseApp } from './firebaseApp';

type AnalyticsModule = typeof import('firebase/analytics');

let analytics: Analytics | null = null;
let analyticsModule: AnalyticsModule | null = null;
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
  // Garde compile-time (__NATIVE_BUILD__ = true dans le bundle Capacitor, cf.
  // vite.config.ts et src/vite-env.d.ts). C'est lui qui retire le SDK du build
  // Android : sans lui, trackEvent — appelé par le code métier — maintiendrait
  // l'import vivant.
  if (__NATIVE_BUILD__) return Promise.resolve();

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (disabled) return;
      if (typeof window === 'undefined') return;
      if (isNativePlatform()) return;
      if (!isAnalyticsEnabledByEnv()) return;
      if (!isFirebaseAnalyticsConfigured()) return;

      // isSupported() vérifie le navigateur, l'accès aux cookies et au stockage.
      analyticsModule = await import('firebase/analytics');
      if (!(await analyticsModule.isSupported())) return;

      analytics = analyticsModule.getAnalytics(await getSharedFirebaseApp());
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
  if (__NATIVE_BUILD__) return;
  if (!analytics || !analyticsModule) return;
  try {
    analyticsModule.logEvent(analytics, name, params);
  } catch (error) {
    console.warn(`[analytics] Evenement "${name}" non envoye :`, error);
  }
}
