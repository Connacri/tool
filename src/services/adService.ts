/**
 * Service de gestion des publicités Google AdMob (Android) et des annonces
 * AdSense (Web).
 *
 * Stratégie retenue :
 *  - Interstitiel « ouverture » affiché une seule fois au lancement de l'app.
 *  - Interstitiel avant un export, plafonné en fréquence. L'utilisateur en est
 *    prévenu avant son affichage et peut annuler l'export s'il ne souhaite pas
 *    voir de publicité.
 *
 * Pourquoi il n'y a plus d'annonce récompensée :
 * Google n'accepte une « rewarded ad » que si la récompense est un avantage que
 * l'utilisateur n'obtiendrait pas autrement. Or l'export était produit dans les
 * deux cas : la vidéo récompensée n'apportait donc rien, et cette présentation
 * constitue du trafic invalide susceptible d'entraîner la suspension du compte.
 * Une annonce récompensée ne pourra être réintroduite que le jour où les deux
 * branches offrent des résultats réellement différents (par exemple un export
 * sans filigrane contre un export avec filigrane).
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

/**
 * Intervalle minimal entre deux interstitiels. Google sanctionne les
 * interstitiels répétés au même endroit ou trop rapprochés : sans ce plafond,
 * deux exports successifs declencheraient deux annonces d'affilee, et
 * l'interstitiel de lancement pourrait suivre de peu un premier export.
 */
const MIN_INTERSTITIAL_INTERVAL_MS = 90_000;

type AdListener = (isOpen: boolean, options: AdTriggerOptions | null) => void;

/** Reponse de l'utilisateur au message d'annonce pre-ad. */
export type AdNoticeDecision = 'accept' | 'dismiss';

type AdNoticeResolver = (decision: AdNoticeDecision) => void;


class AdManager {
  private listener: AdListener | null = null;
  private noticeResolver: AdNoticeResolver | null = null;

  private currentOptions: AdTriggerOptions | null = null;
  private isNative: boolean = false;
  private isAdMobReady: boolean = false;
  private initPromise: Promise<void> | null = null;
  private hasShownOpeningAd: boolean = false;
  /** Instant du dernier interstitiel diffuse (lancement ou export). */
  private lastInterstitialAt: number = 0;
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

  /**
   * Un interstitiel ne peut pas s'afficher dans n'importe quel contexte.
   * On respecte ici le point de transition naturel (la fin d'un export) et le
   * plafond de frequence : l'utilisateur ne subit jamais deux annonces a la
   * suite, meme s'il enchaîne plusieurs exports.
   */
  private canShowInterstitial(): boolean {
    if (!interstitialAdId) return false;
    return Date.now() - this.lastInterstitialAt >= MIN_INTERSTITIAL_INTERVAL_MS;
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
   * export ZIP, envoi webhook). Sur Android il s'agit d'un interstitiel
   * plafonné en fréquence ; sur le web, AdSense diffuse en arrière-plan et ce
   * message n'est qu'un rappel (voir services/adsenseLoader.ts).
   */
  public async triggerAd(options: AdTriggerOptions) {
    this.currentOptions = options;

    // 1. Application native Android : message d'annonce puis interstitiel
    if (this.isNative) {
      // Plafond de frequence : si un interstitiel vient d'etre diffuse, on ne
      // fait pas subir une deuxieme annonce a l'utilisateur. L'export a lieu
      // dans tous les cas, l'application n'est jamais bloquee par la pub.
      if (!this.canShowInterstitial()) {
        await options.onAdCompleted();
        return;
      }

      try {
        await this.initialize();
        if (!this.isAdMobReady) {
          await options.onAdCompleted();
          return;
        }

        // L'utilisateur est prevenu avant l'affichage, et peut annuler
        // l'export plutot que d'accepter de voir l'annonce. Aucune recompense
        // n'est promise : c'est une interstitielle, pas une video recompensee.
        const decision = await this.askNotice(options);

        if (decision === 'dismiss') {
          this.currentOptions = null;
          options.onAdDismissed?.();
          return;
        }

        this.lastInterstitialAt = Date.now();
        await AdMob.showInterstitial();
        // On recharge immediatement l'unite pour la prochaine occasion.
        await this.preloadInterstitial();

        await options.onAdCompleted();
        return;
      } catch (err) {
        console.warn('[AdMob] Interstitiel avant export impossible, poursuite de l\'action :', err);
        await options.onAdCompleted();
        return;
      }
    }

    // 2. Web : message d'annonce (les annonces réelles sont diffusées par
    // AdSense en arrière-plan, voir services/adsenseLoader.ts)
    if (this.listener) {
      this.listener(true, options);
    } else {
      // Si aucun composant d'annonce n'est monté, on exécute l'action sans bloquer l'utilisateur
      await options.onAdCompleted();
    }
  }

  /**
   * Affiche le message d'annonce et attend la décision de l'utilisateur.
   * Sans composant monté, ou si l'utilisateur ne répond pas, on ne montre pas
   * l'annonce : l'export ne doit jamais rester bloqué.
   */
  private askNotice(options: AdTriggerOptions): Promise<AdNoticeDecision> {
    const listener = this.listener;
    // Sans composant de message monte, on accepte par defaut : l'export ne
    // doit jamais etre annule par uneabsence d'interface. 'dismiss' ne peut
    // provenir que d'un clic explicite de l'utilisateur.
    if (!listener) return Promise.resolve<AdNoticeDecision>('accept');

    return new Promise<AdNoticeDecision>((resolve) => {
      let settled = false;
      const finish = (decision: AdNoticeDecision) => {
        if (settled) return;
        settled = true;
        this.noticeResolver = null;
        listener(false, null);
        resolve(decision);
      };

      this.noticeResolver = finish;
      listener(true, options);
    });
  }

  /**
   * Appelé par le composant d'annonce pour signaler le choix de l'utilisateur.
   */
  public resolveNotice(decision: AdNoticeDecision) {
    this.noticeResolver?.(decision);
  }

  /**
   * Google exige, après l'avoir recueilli, de pouvoir laisser l'utilisateur
   * retirer ou modifier son accord. Interroge le SDK pour savoir si ce point
   * d'entrée doit être proposé. Sans effet sur le web et en cas d'échec.
   */
  public async isPrivacyOptionsRequired(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      await this.initialize();
      const info = await AdMob.requestConsentInfo();
      // L'enum PrivacyOptionsRequirementStatus n'est pas reexporte par le
      // plugin, on compare donc sur sa valeur.
      return info.privacyOptionsRequirementStatus === 'REQUIRED';
    } catch {
      return false;
    }
  }

  /**
   * Ouvre le formulaire officiel de modification du consentement.
   */
  public async showPrivacyOptions(): Promise<void> {
    if (!this.isNative) return;
    try {
      await this.initialize();
      await AdMob.showPrivacyOptionsForm();
      // Le choix vient d'évoluer : on réévalue le mode npa sans relancer le SDK.
      await this.resolveConsent();
    } catch (err) {
      console.warn('[AdMob] Formulaire de confidentialite indisponible :', err);
    }
  }

  public registerNoticeResolver(resolver: AdNoticeResolver) {
    this.noticeResolver = resolver;
  }

  public unregisterNoticeResolver() {
    this.noticeResolver = null;
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
