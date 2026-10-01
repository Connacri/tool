/**
 * Service Firebase Performance Monitoring (web).
 *
 * Mêmes principes que services/analyticsService.ts, volontairement :
 *  - Web uniquement. Dans la WebView Capacitor l'origine est https://localhost,
 *    absente des domaines autorises de la console Firebase : les envois sont
 *    rejetes. La mesure mobile passe par le SDK Android natif.
 *  - Aucune erreur ne doit remonter. Perf est de l'observabilite, jamais une
 *    dependance fonctionnelle : si l'init echoue, l'app ignore le service.
 *  - Initialisation paresseuse et unique, pour ne pas retarder le premier rendu.
 *
 * Ce que le SDK collecte tout seul : Core Web Vitals (LCP, CLS, INP, FCP, TTFB),
 * temps de chargement des ressources, Round Trip Time, navigation.
 * Ce qu'il ne collecte pas : la duree de nos appels metier. Pour cela, voir
 * traceAsync() plus bas.
 *
 * Note sur l'import dynamique : le SDK pese ~26 Ko. Les paquets Firebase ne
 * declarent pas « sideEffects: false », donc un import statique survit au
 * tree-shaking meme quand plus aucune de ses fonctions n'est appelee — le SDK
 * resterait alors embarque dans l'APK pour rien. Un import dynamique, lui, est
 * supprime avec le code mort, et sur le web il devient un chunk separe qui ne
 * pese pas sur le LCP.
 */
import type {FirebasePerformance} from 'firebase/performance';
import {isFirebaseAnalyticsConfigured, isPerformanceEnabledByEnv} from '../utils/firebaseConfig';
import {getSharedFirebaseApp} from './firebaseApp';

type PerformanceModule = typeof import('firebase/performance');

let perf: FirebasePerformance | null = null;
let perfModule: PerformanceModule | null = null;
let initPromise: Promise<void> | null = null;
let disabled = false;

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/**
 * Demarre Performance Monitoring. Idempotent : les appels suivants reutilisent
 * la meme promesse. Ne pas awaiter, c'est volontairement non bloquant.
 */
export function initPerformance(): Promise<void> {
  // Garde compile-time (__NATIVE_BUILD__ = true dans le bundle Capacitor, cf.
  // vite.config.ts et src/vite-env.d.ts). Indispensable ici : c'est lui qui
  // supprime l'import dynamique dans l'APK. Un test a l'execution ne suffirait
  // pas, le fichier du SDK resterait livre dans l'APK.
  if (__NATIVE_BUILD__) return Promise.resolve();

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (disabled) return;
      if (typeof window === 'undefined') return;
      if (isNativePlatform()) return;
      if (!isPerformanceEnabledByEnv()) return;
      if (!isFirebaseAnalyticsConfigured()) return;

      // Pas de isSupported() ici, contrairement a Analytics : le module
      // firebase/performance ne l'exporte pas. getPerformance() leve lui-meme si
      // le navigateur ne convient pas (pas de stockage, mode prive strict) et le
      // catch plus bas absorbe ce cas.

      perfModule = await import('firebase/performance');
      perf = perfModule.getPerformance(await getSharedFirebaseApp());
    } catch (error) {
      console.warn('[performance] Initialisation Firebase Performance ignoree :', error);
      disabled = true;
    }
  })();

  return initPromise;
}

/** true si Performance est operationnel et peut recevoir des evenements. */
export function isPerformanceActive(): boolean {
  return perf !== null;
}

/**
 * Mesure la duree d'une operation asynchrone sous un nom de trace, visible
 * dans le tableau de bord Firebase.
 *
 * Si Performance est inactif — build sans config, WebView Capacitor, navigateur
 * sans stockage — l'operation est executee telle quelle. La trace ne peut donc
 * jamais faire echouer l'appelant, y compris si le SDK leve pendant la mesure.
 *
 * @example
 *   const data = await traceAsync('generate_social_copy', () =>
 *     postJson('/api/generate-social-copy', payload),
 *   );
 */
export async function traceAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  if (__NATIVE_BUILD__) return operation();
  if (!perf || !perfModule) return operation();

  // La trace se demarre AVANT l'appel et se protege du SDK, mais l'operation
  // elle-meme n'est jamais englobee par un catch : un echec de l'appel doit
  // remonter tel quel a l'appelant, et surtout ne pas etre rejoue. Englober
  // l'operation dans le meme try/catch ferait deux appels a l'API.
  let performanceTrace: ReturnType<PerformanceModule['trace']> | null = null;
  try {
    performanceTrace = perfModule.trace(perf, name);
    performanceTrace.start();
  } catch (error) {
    console.warn(`[performance] Trace "${name}" non demarree :`, error);
    return operation();
  }

  try {
    return await operation();
  } finally {
    try {
      performanceTrace?.stop();
    } catch (error) {
      console.warn(`[performance] Trace "${name}" non arretee :`, error);
    }
  }
}
