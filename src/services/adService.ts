/**
 * Service de gestion unifiée des publicités (Google AdMob sur Mobile & Annonces Interstitielles sur Web).
 *
 * Déclenchement automatique avant chaque export, téléchargement individuel ou sauvegarde HD.
 */

export interface AdTriggerOptions {
  actionTitle?: string;
  actionType?: 'single_download' | 'batch_zip' | 'webhook_export';
  slideNumber?: number;
  onAdCompleted: () => void | Promise<void>;
  onAdDismissed?: () => void;
}

// Identifiants officiels de test Google AdMob (garantit aucun bannissement pendant le développement)
export const ADMOB_TEST_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
};

type AdListener = (isOpen: boolean, options: AdTriggerOptions | null) => void;

class AdManager {
  private listener: AdListener | null = null;
  private currentOptions: AdTriggerOptions | null = null;
  private isNative: boolean = false;
  private isAdMobReady: boolean = false;

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
   * Enregistre le composant React d'affichage de la pub Web
   */
  public registerModalListener(listener: AdListener) {
    this.listener = listener;
  }

  public unregisterModalListener() {
    this.listener = null;
  }

  /**
   * Déclenche une publicité avant une action sensible (téléchargement HD, export ZIP, etc.)
   */
  public async triggerAd(options: AdTriggerOptions) {
    this.currentOptions = options;

    // 1. Si on est sur une application native Android (Capacitor)
    if (this.isNative) {
      const cap = (window as any).Capacitor;
      const AdMob = cap?.Plugins?.AdMob;

      if (AdMob) {
        try {
          // Affichage de l'interstitiel AdMob natif
          await AdMob.showInterstitial();
          await options.onAdCompleted();
          return;
        } catch (err) {
          console.warn('[AdMob Native] Impossible d\'afficher l\'interstitiel natif, bascule vers l\'interstitiel web sécurisé:', err);
        }
      }
    }

    // 2. Environnement Web (Navigateur / PWA) ou fallback natif
    if (this.listener) {
      this.listener(true, options);
    } else {
      // Si aucun composant d'annonce n'est monté, on exécute l'action sans bloquer l'utilisateur
      await options.onAdCompleted();
    }
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
