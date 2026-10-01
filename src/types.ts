export type AspectRatioType = '1:1' | '9:16' | '4:5' | '16:9' | '2:3';

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  sublabel: string;
  width: number;
  height: number;
  iconName: string;
  platforms: string[];
}

export type FontStyleType =
  | 'editorial'
  | 'modern'
  | 'avant-garde'
  | 'minimal'
  | 'mono'
  | 'playfair'
  | 'outfit'
  | 'cinzel';

export type ArabicFontType =
  | 'cairo'
  | 'alexandria'
  | 'almarai'
  | 'readex'
  | 'el-messiri'
  | 'tajawal'
  | 'amiri'
  | 'noto-arabic';

export type BoxStyleType = 'scrim' | 'frosted' | 'minimal-shadow' | 'solid-card' | 'highlighter';

export type TextPosition = 'top' | 'center' | 'bottom' | 'free';
export type TextAlign = 'left' | 'center' | 'right';
export type TextDirectionType = 'auto' | 'ltr' | 'rtl';

export type VideoTransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-up'
  | 'zoom'
  | 'wipe'
  | 'flash'
  | 'dip-black';

export interface VideoTransitionOption {
  id: VideoTransitionType;
  name: string;
  description: string;
  category: 'classique' | 'dynamique' | 'cinematique';
}

export interface VideoExportConfig {
  transition: VideoTransitionType;
  slideDuration: number; // seconds
  transitionDuration: number; // seconds
  fps: number;
}

export interface TypographyConfig {
  fontStyle: FontStyleType;
  customFontFamily?: string; // Instant Google Font name (e.g. 'Playfair Display', 'Outfit', etc.)
  arabicFont?: ArabicFontType;
  customArabicFontFamily?: string; // Instant Google Font Arabic name (e.g. 'Cairo', 'Alexandria', etc.)
  direction?: TextDirectionType;
  easternNumerals?: boolean; // Eastern Arabic numerals (١، ٢، ٣) vs Western (1, 2, 3) with LTR order
  lineHeight?: number; // 0.8 to 2.5 (default 1.35)
  titleSpacing?: number; // 0.2 to 3.0 multiplier (espacement titre-texte, default 1.0)
  subtitleSpacing?: number; // 0.2 to 3.0 multiplier (espacement texte-soustitre, default 1.0)
  kickerLineHeight?: number; // multiplier for multiline kicker
  subtitleLineHeight?: number; // multiplier for multiline subtitle
  boxStyle: BoxStyleType;
  position: TextPosition;
  freePositionX?: number; // 0 - 100%
  freePositionY?: number; // 0 - 100%
  align: TextAlign;
  kickerAlign?: TextAlign | 'inherit';
  phraseAlign?: TextAlign | 'inherit';
  fontSize: number; // relative multiplier 0.1 to 10.0 (10% to 1000%)
  kickerSize?: number; // relative multiplier 0.1 to 10.0 (default 1.0)
  subtitleSize?: number; // relative multiplier 0.1 to 10.0 (default 1.0)
  slideNumberSize?: number; // relative multiplier 0.1 to 10.0 (default 1.0, 10% to 1000%)
  textWidth?: number; // max-width 40% - 100% (default 85%)
  textColor: string;
  accentColor: string; // Title / Kicker color
  subtitleColor?: string; // Subtitle / Author / Signature color
  showKicker: boolean;
  showSubtitle: boolean;
  showSlideNumber: boolean;
  scrimOpacity: number; // 0.1 to 0.9
}

export type LogoPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'center'
  | 'center-left'
  | 'center-right'
  | 'custom';

export interface LogoConfig {
  enabled: boolean;
  type: 'predefined' | 'custom';
  predefinedId: string;
  customUrl?: string;
  brandText: string;
  brandHandle?: string;
  position: LogoPosition;
  customX?: number; // 0 - 100%
  customY?: number; // 0 - 100%
  size: 'small' | 'medium' | 'large' | 'custom';
  scale?: number; // 0.2 to 8.0 (default 1.0, Option A ultra enlarged up to 800%)
  opacity: number; // 0.05 to 1.0
  theme: 'white' | 'dark' | 'accent' | 'custom';
  invertColor?: boolean; // Inverts colors
  unifyColor?: boolean; // Unifies logo into a single monochrome silhouette
  unifiedColor?: string; // Hex color for unified logo (e.g. #ffffff, #000000, #f59e0b)
  rotation?: number; // -180 to 180 degrees
  margin?: number; // Distance/margin from borders in %
  shadow?: 'none' | 'subtle' | 'glow' | 'strong'; // Logo shadow effect
  displayMode?: 'standard' | 'badge' | 'hero' | 'watermark'; // Option A preset styles
}

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'center'
  | 'bottom-center'
  | 'top-center'
  | 'custom';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  style: 'single' | 'repeated'; // single position vs repeated diagonal pattern
  position: WatermarkPosition;
  customX?: number; // 0 - 100%
  customY?: number; // 0 - 100%
  scale?: number; // 0.5 to 2.5 (default 1.0)
  opacity: number; // 0.05 to 0.90
  rotation?: number; // -90 to 90 degrees
  color: string; // hex color
  fontFamily?: string;
  gap?: number; // gap/spacing in pixels for repeated pattern (100 to 350)
  showBorder?: boolean; // subtle pill/badge border around single watermark
}

export type GradientBlurDirection =
  | 'none'
  | 'bottom'
  | 'top'
  | 'center'
  | 'tilt-shift'
  | 'tilt-shift-vertical'
  | 'radial'
  | 'left'
  | 'right'
  | 'box'
  | 'full';

export interface GradientBlurConfig {
  enabled: boolean;
  direction: GradientBlurDirection;
  blurAmount: number; // in pixels, e.g. 0 to 40px
  positionY?: number; // 0 - 100% (default: bottom=80%, top=20%, center=50%)
  positionX?: number; // 0 - 100% (default: 50%)
  blurSize?: number; // 10 - 100% height or spread dimension (default 50%)
  blurWidth?: number; // 10 - 100% width dimension for box/radial (default 80%)
  opacity?: number; // 0.2 - 1.0
}

export type ColorFilterPreset =
  | 'none'
  | 'sunset-gold'
  | 'cyber-noir'
  | 'warm-travertine'
  | 'deep-indigo'
  | 'rose-quartz'
  | 'emerald-forest'
  | 'monochrome'
  | 'neon-violet'
  | 'peach-sunset'
  | 'cyber-pink'
  | 'custom';

export type BlendModeType = 'normal' | 'multiply' | 'overlay' | 'screen' | 'color' | 'soft-light';

export interface ColorFilterConfig {
  enabled: boolean;
  preset: ColorFilterPreset;
  colorStart: string;
  colorEnd: string;
  angle: number; // in degrees
  opacity: number; // 0.1 to 1.0
  blendMode: BlendModeType;
}

export type OverlayPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'custom';

export interface OverlayImageConfig {
  enabled: boolean;
  url: string;
  fileName?: string;
  position: OverlayPosition;
  customX?: number; // 0 - 100%
  customY?: number; // 0 - 100%
  scale: number; // 0.1 to 2.0
  rotation?: number; // -180 to 180 degrees
  opacity: number; // 0.1 to 1.0
  blendMode: BlendModeType;
  applyToAll: boolean; // true = global, false = slide-specific
}

export interface SlideItem {
  id: string;
  number: number;
  text: string;
  kicker: string;
  subtitle: string;
  imageUrl: string;
  imageAlt?: string;
  imageZoom?: number; // 1 to 3.5
  imagePanX?: number; // -50% to +50%
  imagePanY?: number; // -50% to +50%
  imageBrightness?: number;
  customOverlayOpacity?: number;
  scheduledTime?: string;
  customTextX?: number; // 0 - 100%
  customTextY?: number; // 0 - 100%
  customTextScale?: number; // scale multiplier
  customKickerScale?: number;
  customSubtitleScale?: number;
  customNumberScale?: number; // slide number scale multiplier (10% to 1000%)
  customBlur?: GradientBlurConfig;
  customFilter?: ColorFilterConfig;
  customOverlayImage?: OverlayImageConfig;
  customDirection?: TextDirectionType;
  customAlign?: TextAlign;
  customKickerAlign?: TextAlign | 'inherit';
  customTextColor?: string;
  customKickerColor?: string;
  customSubtitleColor?: string;
}

export interface SocialCopyItem {
  instagram: { caption: string; hashtags: string };
  linkedin: { caption: string; hashtags: string };
  twitter: { caption: string; hashtags: string };
  tiktok: { caption: string; hashtags: string };
}

export interface WebhookConfig {
  url: string;
  platformTarget: 'buffer' | 'make' | 'zapier' | 'n8n' | 'custom';
  autoSchedule: boolean;
  includeCaptions: boolean;
}
