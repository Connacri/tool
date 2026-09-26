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

export type BoxStyleType = 'scrim' | 'frosted' | 'minimal-shadow' | 'solid-card' | 'highlighter';

export type TextPosition = 'top' | 'center' | 'bottom';
export type TextAlign = 'left' | 'center' | 'right';

export interface TypographyConfig {
  fontStyle: FontStyleType;
  boxStyle: BoxStyleType;
  position: TextPosition;
  align: TextAlign;
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

export interface SlideItem {
  id: string;
  number: number;
  text: string;
  kicker: string;
  subtitle: string;
  imageUrl: string;
  imageAlt?: string;
  imageZoom?: number;
  imageBrightness?: number;
  customOverlayOpacity?: number;
  scheduledTime?: string;
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
