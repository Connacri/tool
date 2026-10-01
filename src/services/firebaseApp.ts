/**
 * Chargement paresseux de l'instance Firebase partagee.
 *
 * Pourquoi un module dedie : analyticsService et performanceService ont tous
 * deux besoin de la meme instance Firebase, et tous deux doivent disparaitre du
 * bundle Android. Or « firebase/app » est un paquet Firebase, donc sans
 * « sideEffects: false », un import statique survit au tree-shaking meme si plus
 * aucune de ses fonctions n'est appelee. En l'isolant derriere un import
 * dynamique appele uniquement depuis du code mort, Rollup finit par le
 * supprimer, et l'APK se retouve sans le moindre octet de Firebase.
 *
 * ESO : le module etant mis en cache par le loader, un second import dynamique
 * du meme specifier renvoie la meme instance. initializeApp n'est donc appele
 * qu'une fois, et l'appelant suivant trouve l'application via getApp().
 */
import type { FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '../utils/firebaseConfig';

let app: FirebaseApp | null = null;

export async function getSharedFirebaseApp(): Promise<FirebaseApp> {
  if (app) return app;
  const { getApp, getApps, initializeApp } = await import('firebase/app');
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}
