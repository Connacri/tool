/// <reference types="vite/client" />

/**
 * Constante injectee a la compilation par vite.config.ts.
 *
 * Vrai uniquement pour le bundle Capacitor (Android), construit via
 * `npm run build:mobile` qui positionne BUILD_TARGET=capacitor.
 *
 * Elle permet a Rollup d'eliminer du bundle Android le code d'un service
 * reserve au web (AdSense). Une verification a l'execution ne suffit pas : le
 * code serait embarque dans l'APK et ne s'ecarterait que si le pont Capacitor
 * est deja pret au moment de l'evaluation.
 */
declare const __NATIVE_BUILD__: boolean;
