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

export interface TypographyConfig {
  fontStyle: FontStyleType;
  customFontFamily?: string; // Instant Google Font name (e.g. 'Playfair Display', 'Outfit', etc.)
  arabicFont?: ArabicFontType;
  customArabicFontFamily?: string; // Instant Google Font Arabic name (e.g. 'Cairo', 'Alexandria', etc.)
  direction?: TextDirectionType;
  easternNumerals?: boolean; // Eastern Arabic numerals (١، ٢، ٣) vs Western (1, 2, 3) with LTR order
  lineHeight?: number; // 1.1 to 1.8 (default 1.35)
  boxStyle: BoxStyleType;
  position: TextPosition;
  freePositionX?: number; // 0 - 100%
  freePositionY?: number; // 0 - 100%
  align: TextAlign;
  kickerAlign?: TextAlign | 'inherit';
  phraseAlign?: TextAlign | 'inherit';
  fontSize: number; // relative multiplier 0.5 to 2.5
  kickerSize?: number; // relative multiplier 0.5 to 2.5 (default 1.0)
  subtitleSize?: number; // relative multiplier 0.5 to 2.5 (default 1.0)
  textWidth?: number; // max-width 40% - 100% (default 85%)
  textColor: string;
  accentColor: string;
  showKicker: boolean;
  showSubtitle: boolean;
  showSlideNumber: boolean;
  scrimOpacity: number; // 0.1 to 0.9
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center' | 'custom';

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
  scale?: number; // 0.4 to 3.0 (default 1.0)
  opacity: number; // 0.1 to 1.0
  theme: 'white' | 'dark' | 'accent';
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
  customBlur?: GradientBlurConfig;
  customFilter?: ColorFilterConfig;
  customOverlayImage?: OverlayImageConfig;
  customDirection?: TextDirectionType;
  customAlign?: TextAlign;
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
