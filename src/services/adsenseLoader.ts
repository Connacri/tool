/**
 * Chargement du script AdSense (annonces automatiques) sur la version WEB.
 *
 * Pourquoi pas dans index.html ?
 * --------------------------------
 *  1. L'application Android embarque le SDK AdMob natif. Si AdSense se
 *     chargeait aussi dans la WebView, les deux reseaux publicitaires
 *     fonctionneraient dans la meme application. Google assimile cela a du
 *     trafic invalide, avec un risque reel de suspension du compte AdMob.
 *     Chaque plateforme ne doit servir que son reseau : AdSense sur le web,
 *     AdMob en natif.
 *
 *  2. L'identifiant editeur vient de VITE_ADSENSE_CLIENT_ID. Il etait code en
 *     dur dans le HTML, ce qui rendait impossible de desactiver la publicite
 *     sans modifier le code, et empechait de tester l'application sans pubs.
 *
 * Ce module est sans effet si la variable n'est pas definie : dans ce cas
 * aucune annonce n'est demandee, ce qui est le comportement souhaite en local.
 */

/** Detecte un runtime Capacitor (Android/iOS) plutot qu'un navigateur. */
function isNativeRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = (
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
        platform?: string;
      };
    }
  ).Capacitor;
  if (!bridge) return false;
  if (typeof bridge.isNativePlatform === 'function') {
    return bridge.isNativePlatform();
  }
  const platform = bridge.getPlatform ? bridge.getPlatform() : bridge.platform;
  return platform === 'android' || platform === 'ios';
}

/**
 * Respecte les signaux Do Not Track et Global Privacy Control.
 *
 * Ce ne sont pas des obligations legales en soi, mais les respecter evite
 * d'envoyer une requete publicitaire a des personnes qui ont explicitement
 * refuse d'etre suivies. Ces signaux sont de plus en plus pris en compte.
 */
function respectsDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false;
  const dnt = (navigator as Navigator & { doNotTrack?: string }).doNotTrack;
  if (dnt === '1' || dnt === 'yes') return true;
  const gpc = (
    window as unknown as { navigator?: { globalPrivacyControl?: boolean } }
  ).navigator?.globalPrivacyControl;
  return gpc === true;
}

let injected = false;

/**
 * Insere le script AdSense une seule fois. Sans effet sur Android, sans effet
 * si aucun identifiant editeur n'est configure, et sans effet si
 * l'utilisateur a active Do Not Track.
 */
export function loadAdsense(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;

  if (isNativeRuntime()) {
    // Android : la publicite est servie par AdMob, pas par AdSense.
    return;
  }

  const clientId = (import.meta.env.VITE_ADSENSE_CLIENT_ID || '').trim();
  if (!clientId) {
    return;
  }

  if (respectsDoNotTrack()) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    clientId
  )}`;
  script.dataset.adClient = clientId;
  document.head.appendChild(script);
}
