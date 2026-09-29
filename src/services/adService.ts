/**
 * Service de gestion des publicités Google AdMob (Android) et des annonces
 * AdSense (Web).
 *
 * Stratégie retenue :
 *  - Interstitiel « ouverture » affiché une seule fois au lancement de l'app.
 *  - Annonce récompensée (« avec recompense ») affichée quand l'utilisateur
 *    sauvegarde ou exporte. La récompense est l'export lui-même : l'utilisateur
 *    n'est jamais bloqué, qu'il regarde la pub ou qu'il la ferme.
 *
 * Principes :
 *  - Une aucune configuration ou un échec réseau ne doit jamais empêcher
 *    l'utilisateur de télécharger ou d'exporter. Toutes les erreurs sont donc
 *    absorbées et on pursue l'action demandée.
 *  - Le SDK n'est chargé et initialisé que sur plateforme native. Sur le web,
 *    c'est AdSense qui diffuse (voir services/adsenseLoader.ts).
 *
 *  - Consentement (UMP) : avant toute préparation d'annonce, on interroge le
 *    SDK de consentement Google. Les annonces ne sont personnalisées que si le
 *    consentement est accordé ou s'il n'est pas requis (hors zone EEE). Dans
 *    tous les autres cas, on reste en mode non personnalisé (npa), qui est
 *    toujours autorisé et ne déclenche aucune violation de politique.
 */
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';

export interface AdTriggerOptions {
  actionTitle?: string;
  actionType?: 'single_download' | 'batch_zip' | 'webhook_export';
  slideNumber?: number;
  onAdCompleted: () => void | Promise<void>;
  onAdDismissed?: () => void;
}

const interstitialAdId = (import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || '').trim();
const rewardedAdId = (import.meta.env.VITE_ADMOB_REWARDED_ID || '').trim();

type AdListener = (isOpen: boolean, options: AdTriggerOptions | null) => void;

class AdManager {
  private listener: AdListener | null = null;
  private currentOptions: AdTriggerOptions | null = null;
  private isNative: boolean = false;
  private isAdMobReady: boolean = false;
  private initPromise: Promise<void> | null = null;
  private hasShownOpeningAd: boolean = false;
  /**
   * Passe à false uniquement lorsque Google confirme soit un consentement
   * accordé, soit l'absence d'obligation de consentement. Le défaut `true`
   * est volontairement conservateur : en cas de doute, on diffuse des annonces
   * non personnalisées plutôt que de risquer des pubs personnalisées sans
   * accord, ce qui vaudrait signalement de non-respect des règles UE.
   */
  private nonPersonalizedAds: boolean = true;

  constructor() {
    this.detectEnvironment();
  }

  private detectEnvironment() {
    if (typeof window !== 'undefined') {
      const cap = (window as any).Capacitor;
      this.isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
    }
  }

  /**
   * Démarre le SDK Google Mobile Ads et précharge l'interstitiel.
   * Idempotent, à appeler une seule fois au lancement de l'application.
   */
  public initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.isNative) return;
      try {
        // initializeForTesting reste faux : les vraies unités AdMob sont
        // désormais configurées.
        await AdMob.initialize({ initializeForTesting: false });
        this.isAdMobReady = true;
        await this.resolveConsent();
        await this.preloadInterstitial();
      } catch (err) {
        console.warn('[AdMob] Initialisation impossible, l\'application continue sans publicite :', err);
        this.isAdMobReady = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Interroge le SDK de consentement (UMP) et affiche le formulaire si un
   * message GDPR a été configuré dans la console AdMob.
   *
   * Comportement :
   *  - NOT_REQUIRED : l'utilisateur est hors zone de obligation, on peut
   *    personnaliser les annonces.
   *  - OBTAINED : consentement accordé, annonces personnalisées autorisées.
   *  - REQUIRED + formulaire disponible : on affiche le formulaire, puis on
   *    relit le statut. Un refus laisse le mode non personnalisé actif.
   *  - UNKNOWN, ou erreur réseau : on conserve le mode non personnalisé.
   *
   * Tant qu'aucun message GDPR n'est créé dans la console AdMob, Google
   * renvoie simplement NOT_REQUIRED ou un formulaire indisponible : l'appel
   * échoue sans conséquence et l'application démarre normalement.
   */
  private async resolveConsent(): Promise<void> {
    try {
      let info = await AdMob.requestConsentInfo();

      if (info.status === AdmobConsentStatus.REQUIRED) {
        if (info.isConsentFormAvailable) {
          info = await AdMob.showConsentForm();
        } else {
          console.info(
            '[AdMob] Consentement requis mais aucun message GDPR configure dans la console AdMob.'
          );
        }
      }

      this.nonPersonalizedAds = !(
        info.status === AdmobConsentStatus.OBTAINED ||
        info.status === AdmobConsentStatus.NOT_REQUIRED
      );

      if (info.privacyOptionsRequirementStatus === 'REQUIRED') {
        console.info(
          '[AdMob] Google exige un point d\'entree « options de confidentialite » ' +
            'pour permettre de modifier le consentement plus tard.'
        );
      }
    } catch (err) {
      this.nonPersonalizedAds = true;
      console.warn('[AdMob] Statut de consentement indisponible, annonces non personnalisees :', err);
    }
  }

  private async preloadInterstitial(): Promise<void> {
    if (!interstitialAdId) return;
    try {
      await AdMob.prepareInterstitial({ adId: interstitialAdId, npa: this.nonPersonalizedAds });
    } catch (err) {
      console.warn('[AdMob] Interstitiel « ouverture » non charge :', err);
    }
  }

  private async preloadRewarded(): Promise<void> {
    if (!rewardedAdId) return;
    await AdMob.prepareRewardVideoAd({ adId: rewardedAdId, npa: this.nonPersonalizedAds });
  }

  /**
   * Interstitiel d'ouverture, affiché une seule fois par session.
   * Silencieux en cas d'échec : un petit écran qui n'apparaitrait pas est
   * préférable à une erreur visible au lancement.
   */
  public async showOpeningAd(): Promise<void> {
    if (!this.isNative || this.hasShownOpeningAd || !interstitialAdId) return;
    this.hasShownOpeningAd = true;
    try {
      await this.initialize();
      if (!this.isAdMobReady) return;
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn('[AdMob] Interstitiel « ouverture » non affiche :', err);
      // On réactive l'interstitiel pour la prochaine tentative.
      this.hasShownOpeningAd = false;
    }
  }

  /**
   * Déclenche la publicité avant une action sensible (téléchargement HD,
   * export ZIP, envoi webhook). Sur Android il s'agit de l'annonce récompensée ;
   * sur le web, le modal AdSense existant prend le relais.
   */
  public async triggerAd(options: AdTriggerOptions) {
    this.currentOptions = options;

    // 1. Application native Android : annonce récompensée
    if (this.isNative) {
      if (!rewardedAdId) {
        // Aucune unité configurée : on ne bloque surtout pas l'export.
        await options.onAdCompleted();
        return;
      }
      try {
        await this.initialize();
        if (!this.isAdMobReady) {
          await options.onAdCompleted();
          return;
        }
        await this.preloadRewarded();
        await AdMob.showRewardVideoAd();
        // La récompense est l'export : on l'execute que l'utilisateur ait ou non
        // regardé la pub jusqu'au bout.
        await options.onAdCompleted();
        return;
      } catch (err) {
        console.warn('[AdMob] Annonce recompensee impossible, poursuite de l\'action :', err);
        await options.onAdCompleted();
        return;
      }
    }

    // 2. Web : modal AdSense
    if (this.listener) {
      this.listener(true, options);
    } else {
      // Si aucun composant d'annonce n'est monté, on exécute l'action sans bloquer l'utilisateur
      await options.onAdCompleted();
    }
  }

  /**
   * Enregistre le composant React d'affichage de la pub Web
   */
  public registerModalListener(listener: AdListener) {
    this.listener = listener;
  }

  public unregisterModalListener() {
    this.listener = null;
  }

  /**
   * Appelé lorsque la pub se termine (après compte à rebours ou fermeture)
   */
  public async completeAd() {
    if (this.listener) {
      this.listener(false, null);
    }
    if (this.currentOptions) {
      const callback = this.currentOptions.onAdCompleted;
      this.currentOptions = null;
      try {
        await callback();
      } catch (err) {
        console.error('Erreur lors de l\'exécution du téléchargement post-pub:', err);
      }
    }
  }

  /**
   * Appelé si l'utilisateur annule ou ferme la pub
   */
  public cancelAd() {
    if (this.listener) {
      this.listener(false, null);
    }
    if (this.currentOptions?.onAdDismissed) {
      this.currentOptions.onAdDismissed();
    }
    this.currentOptions = null;
  }
}

export const adManager = new AdManager();
