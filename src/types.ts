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

export type FontStyleType = 'editorial' | 'modern' | 'avant-garde' | 'minimal' | 'mono';
export type ArabicFontType = 'cairo' | 'noto-arabic' | 'tajawal' | 'amiri';

export type BoxStyleType = 'scrim' | 'frosted' | 'minimal-shadow' | 'solid-card' | 'highlighter';

export type TextPosition = 'top' | 'center' | 'bottom';
export type TextAlign = 'left' | 'center' | 'right';
export type TextDirectionType = 'auto' | 'ltr' | 'rtl';

export interface TypographyConfig {
  fontStyle: FontStyleType;
  arabicFont?: ArabicFontType;
  direction?: TextDirectionType;
  boxStyle: BoxStyleType;
  position: TextPosition;
  align: TextAlign;
  kickerAlign?: TextAlign | 'inherit';
  phraseAlign?: TextAlign | 'inherit';
  fontSize: number; // relative multiplier 0.8 to 1.6
  textColor: string;
  accentColor: string;
  showKicker: boolean;
  showSubtitle: boolean;
  showSlideNumber: boolean;
  scrimOpacity: number; // 0.1 to 0.9
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';

export interface LogoConfig {
  enabled: boolean;
  type: 'predefined' | 'custom';
  predefinedId: string;
  customUrl?: string;
  brandText: string;
  brandHandle?: string;
  position: LogoPosition;
  size: 'small' | 'medium' | 'large';
  opacity: number; // 0.3 to 1.0
  theme: 'white' | 'dark' | 'accent';
}

export type GradientBlurDirection =
  | 'none'
  | 'bottom'
  | 'top'
  | 'left'
  | 'right'
  | 'radial'
  | 'tilt-shift'
  | 'custom-rect'
  | 'custom-circle'
  | 'full';

export interface GradientBlurConfig {
  enabled: boolean;
  direction: GradientBlurDirection;
  blurAmount: number; // in pixels, e.g. 0 to 40px
  positionX?: number; // 0 to 100%
  positionY?: number; // 0 to 100%
  width?: number; // 10 to 100%
  height?: number; // 10 to 100%
  feather?: number; // 0 to 100%
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
  scale: number; // 0.1 to 1.5
  opacity: number; // 0.1 to 1.0
  blendMode: BlendModeType;
  applyToAll: boolean; // true = global, false = slide-specific
}

export interface ElementPosition {
  x: number; // 0 - 100% relative position
  y: number; // 0 - 100% relative position
}

export interface SlideItem {
  id: string;
  number: number;
  text: string;
  kicker: string;
  subtitle: string;
  imageUrl: string;
  imageAlt?: string;
  imageZoom?: number;
  imagePanX?: number; // 0 to 100%
  imagePanY?: number; // 0 to 100%
  imageBrightness?: number;
  customOverlayOpacity?: number;
  scheduledTime?: string;

  // Custom positioning & scale per phrase / element
  kickerPos?: ElementPosition;
  kickerScale?: number;
  phrasePos?: ElementPosition;
  phraseScale?: number;
  subtitlePos?: ElementPosition;
  subtitleScale?: number;
  logoPos?: ElementPosition;
  logoScale?: number;
  blurPos?: ElementPosition;
  blurSize?: { width: number; height: number };

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
