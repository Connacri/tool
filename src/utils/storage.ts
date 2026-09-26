import { AspectRatioOption, LogoConfig, SlideItem, TypographyConfig } from '../types';
import { ASPECT_RATIOS, INITIAL_LOGO, INITIAL_SLIDES, INITIAL_TYPOGRAPHY } from '../constants/presets';

const STORAGE_KEY_SLIDES = 'autopost_studio_slides_v1';
const STORAGE_KEY_RATIO = 'autopost_studio_ratio_v1';
const STORAGE_KEY_TYPOGRAPHY = 'autopost_studio_typography_v1';
const STORAGE_KEY_LOGO = 'autopost_studio_logo_v1';
const STORAGE_KEY_TIMESTAMP = 'autopost_studio_last_saved_v1';

export interface StorageStatus {
  lastSaved: number | null;
  hasCustomData: boolean;
}

/**
 * Loads slides from localStorage, falling back to initial presets
 */
export function loadSavedSlides(): SlideItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLIDES);
    if (!raw) return INITIAL_SLIDES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s, idx) => {
        if (s.imageUrl && s.imageUrl.startsWith('/src/assets/images/')) {
          const fallback = INITIAL_SLIDES[idx % INITIAL_SLIDES.length];
          return { ...s, imageUrl: fallback.imageUrl };
        }
        return s;
      });
    }
  } catch (e) {
    console.warn('Erreur lors du chargement des slides depuis le localStorage:', e);
  }
  return INITIAL_SLIDES;
}

/**
 * Loads aspect ratio from localStorage
 */
export function loadSavedAspectRatio(): AspectRatioOption {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATIO);
    if (raw) {
      const found = ASPECT_RATIOS.find((r) => r.id === raw);
      if (found) return found;
    }
  } catch (e) {
    console.warn('Erreur lors du chargement du ratio:', e);
  }
  return ASPECT_RATIOS[0];
}

/**
 * Loads typography config from localStorage
 */
export function loadSavedTypography(): TypographyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TYPOGRAPHY);
    if (raw) {
      return { ...INITIAL_TYPOGRAPHY, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Erreur lors du chargement de la typographie:', e);
  }
  return INITIAL_TYPOGRAPHY;
}

/**
 * Loads logo config from localStorage
 */
export function loadSavedLogo(): LogoConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGO);
    if (raw) {
      return { ...INITIAL_LOGO, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Erreur lors du chargement du logo:', e);
  }
  return INITIAL_LOGO;
}

/**
 * Automatically saves all applet state to localStorage with quota-safety
 */
export function saveAllToLocalStorage(
  slides: SlideItem[],
  aspectRatio: AspectRatioOption,
  typography: TypographyConfig,
  logo: LogoConfig
): { success: boolean; timestamp: number } {
  const timestamp = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY_SLIDES, JSON.stringify(slides));
    localStorage.setItem(STORAGE_KEY_RATIO, aspectRatio.id);
    localStorage.setItem(STORAGE_KEY_TYPOGRAPHY, JSON.stringify(typography));
    localStorage.setItem(STORAGE_KEY_LOGO, JSON.stringify(logo));
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp.toString());
    return { success: true, timestamp };
  } catch (err: any) {
    // Handle QuotaExceededError (e.g. if user uploaded large base64 images)
    console.warn('LocalStorage quota warning, attempt saving lightweight state:', err);
    try {
      // Strip large data-urls if quota exceeded to still preserve text & configuration
      const lightweightSlides = slides.map((s, idx) => ({
        ...s,
        imageUrl: s.imageUrl.startsWith('data:') && s.imageUrl.length > 500000
          ? INITIAL_SLIDES[idx % INITIAL_SLIDES.length].imageUrl
          : s.imageUrl,
      }));
      localStorage.setItem(STORAGE_KEY_SLIDES, JSON.stringify(lightweightSlides));
      localStorage.setItem(STORAGE_KEY_RATIO, aspectRatio.id);
      localStorage.setItem(STORAGE_KEY_TYPOGRAPHY, JSON.stringify(typography));
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp.toString());
      return { success: true, timestamp };
    } catch {
      return { success: false, timestamp };
    }
  }
}

/**
 * Clears saved data and restores initial presets
 */
export function resetSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SLIDES);
    localStorage.removeItem(STORAGE_KEY_RATIO);
    localStorage.removeItem(STORAGE_KEY_TYPOGRAPHY);
    localStorage.removeItem(STORAGE_KEY_LOGO);
    localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  } catch (e) {
    console.warn('Erreur lors de la réinitialisation du localStorage:', e);
  }
}

/**
 * Gets last saved timestamp from localStorage
 */
export function getLastSavedTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
    if (raw) return parseInt(raw, 10);
  } catch {
    // ignore
  }
  return null;
}
