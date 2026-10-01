import React, { useEffect, useRef, useState } from 'react';
import {
  Type,
  Image as ImageIcon,
  Ratio,
  Sliders,
  Layers,
  Sparkles,
  Plus,
  Minus,
  Maximize2,
  Trash2,
  Upload,
  Palette,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Clock,
  Send,
  Download,
  Share2,
  CheckCircle2,
  FileText,
  ExternalLink,
  Languages,
  UploadCloud,
  Move,
  Stamp,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Droplets,
  Search,
  Globe,
  SlidersHorizontal,
  Shield,
  ShieldCheck,
  Wand2,
  Lightbulb,
  RotateCw,
  Contrast,
  Check,
  Grid3X3,
  Lock,
} from 'lucide-react';
import { AspectRatioOption, AspectRatioType, ColorFilterConfig, GradientBlurConfig, LogoConfig, OverlayImageConfig, SlideItem, TextAlign, TextDirectionType, TypographyConfig, WatermarkConfig, WebhookConfig } from '../types';
import { ARABIC_FONTS, ASPECT_RATIOS, COLOR_FILTER_PRESETS, PREDEFINED_LOGOS, PRESET_IMAGES, GRADIENT_BLUR_PRESETS, PRESET_OVERLAYS, WATERMARK_PRESETS, INITIAL_WATERMARK, INITIAL_LOGO } from '../constants/presets';
import { isArabicText, resolveEffectiveAlignment, resolveEffectiveKickerAlignment } from '../utils/canvasRenderer';
import { CURATED_FRENCH_FONTS, CURATED_ARABIC_FONTS, loadGoogleFont } from '../utils/googleFonts';

/**
 * Returns a valid #rrggbb hex string for <input type="color">
 */
export const getSafeHex = (color: string | undefined, fallback: string = '#ffffff'): string => {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
    }
    if (trimmed.length === 7) return trimmed.toLowerCase();
  }
  return fallback;
};

interface EditorSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  slides: SlideItem[];
  setSlides: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  currentSlideIndex: number;
  setCurrentSlideIndex: (idx: number) => void;
  aspectRatio: AspectRatioOption;
  setAspectRatio: (opt: AspectRatioOption) => void;
  typography: TypographyConfig;
  setTypography: React.Dispatch<React.SetStateAction<TypographyConfig>>;
  logo: LogoConfig;
  setLogo: React.Dispatch<React.SetStateAction<LogoConfig>>;
  onOpenBatchModal: () => void;
  onOpenExportModal: () => void;
  onOpenSocialCopyModal: () => void;
  onQuickAiGenerate: () => void;
  onOpenAiModal?: () => void;
  isAiGenerating: boolean;
  mobileView?: 'editor' | 'preview';
  gradientBlur: GradientBlurConfig;
  setGradientBlur: React.Dispatch<React.SetStateAction<GradientBlurConfig>>;
  colorFilter: ColorFilterConfig;
  setColorFilter: React.Dispatch<React.SetStateAction<ColorFilterConfig>>;
  overlayImage: OverlayImageConfig;
  setOverlayImage: React.Dispatch<React.SetStateAction<OverlayImageConfig>>;
  watermark: WatermarkConfig;
  setWatermark: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab,
  setActiveTab,
  slides,
  setSlides,
  currentSlideIndex,
  setCurrentSlideIndex,
  aspectRatio,
  setAspectRatio,
  typography,
  setTypography,
  logo,
  setLogo,
  onOpenBatchModal,
  onOpenExportModal,
  onOpenSocialCopyModal,
  onQuickAiGenerate,
  onOpenAiModal,
  isAiGenerating,
  mobileView = 'editor',
  gradientBlur,
  setGradientBlur,
  colorFilter,
  setColorFilter,
  overlayImage,
  setOverlayImage,
  watermark,
  setWatermark,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const overlayFileInputRef = useRef<HTMLInputElement>(null);

  const [fontLanguageTab, setFontLanguageTab] = useState<'french' | 'arabic'>('french');
  const [customFontInput, setCustomFontInput] = useState('');
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [fontLoadSuccess, setFontLoadSuccess] = useState<string | null>(null);

  // Active font family names (derives custom Google Font or default style mapping)
  const activeLatinFontName = typography.customFontFamily || (() => {
    switch (typography.fontStyle) {
      case 'editorial': return 'Fraunces';
      case 'avant-garde': return 'Syne';
      case 'playfair': return 'Playfair Display';
      case 'outfit': return 'Outfit';
      case 'cinzel': return 'Cinzel';
      case 'mono': return 'JetBrains Mono';
      case 'minimal': return 'Plus Jakarta Sans';
      case 'modern':
      default: return 'Plus Jakarta Sans';
    }
  })();

  const activeArabicFontName = typography.customArabicFontFamily || (() => {
    switch (typography.arabicFont) {
      case 'noto-arabic': return 'Noto Sans Arabic';
      case 'tajawal': return 'Tajawal';
      case 'amiri': return 'Amiri';
      case 'alexandria': return 'Alexandria';
      case 'almarai': return 'Almarai';
      case 'readex': return 'Readex Pro';
      case 'el-messiri': return 'El Messiri';
      case 'cairo':
      default: return 'Cairo';
    }
  })();

  const currentDisplayFontName = fontLanguageTab === 'arabic' ? activeArabicFontName : activeLatinFontName;

  // Preload currently active Google Fonts into document
  useEffect(() => {
    loadGoogleFont(activeLatinFontName);
    loadGoogleFont(activeArabicFontName);
  }, [activeLatinFontName, activeArabicFontName]);

  const [overlayCategoryTab, setOverlayCategoryTab] = useState<'all' | 'trust' | 'promo' | 'arabic' | 'social'>('all');
  const [overlayUrlInput, setOverlayUrlInput] = useState('');
  const [brandingSubTab, setBrandingSubTab] = useState<'logo' | 'watermark'>('logo');
  const [appliedAllNotice, setAppliedAllNotice] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  const handleApplyAlignToAll = (align: TextAlign) => {
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customAlign: align,
      }))
    );
    setTypography((prev) => ({
      ...prev,
      align,
      phraseAlign: align,
    }));
    const alignLabel = align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : 'Droite';
    setAppliedAllNotice(`Alignement (${alignLabel}) appliqué avec succès à toutes les diapos (${slides.length}) !`);
    setTimeout(() => setAppliedAllNotice(null), 3500);
  };

  const handleApplyDirectionToAll = (dir: TextDirectionType) => {
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customDirection: dir,
      }))
    );
    setTypography((prev) => ({
      ...prev,
      direction: dir,
    }));
    const dirLabel = dir === 'rtl' ? 'RTL (Arabe)' : dir === 'ltr' ? 'LTR (Français)' : 'Auto';
    setAppliedAllNotice(`Direction (${dirLabel}) appliquée avec succès à toutes les diapos (${slides.length}) !`);
    setTimeout(() => setAppliedAllNotice(null), 3500);
  };

  const handleApplyAllToAll = (
    align: TextAlign,
    dir: TextDirectionType,
    kickerAlign?: TextAlign | 'inherit'
  ) => {
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customAlign: align,
        customDirection: dir,
        customKickerAlign: kickerAlign ?? s.customKickerAlign,
      }))
    );
    setTypography((prev) => ({
      ...prev,
      align,
      phraseAlign: align,
      direction: dir,
      kickerAlign: kickerAlign ?? prev.kickerAlign,
    }));
    const alignLabel = align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : 'Droite';
    const dirLabel = dir === 'rtl' ? 'RTL (Arabe)' : dir === 'ltr' ? 'LTR (Français)' : 'Auto';
    setAppliedAllNotice(`✨ Alignement (${alignLabel}) & Direction (${dirLabel}) appliqués à toutes les diapos (${slides.length}) !`);
    setTimeout(() => setAppliedAllNotice(null), 4000);
  };

  // Apply complete layout: alignement, orientation RTL/LTR, position X/Y & tailles des textes
  const handleApplyAllFormattingToAllSlides = (
    align?: TextAlign,
    dir?: TextDirectionType,
    kickerAlign?: TextAlign | 'inherit',
    posX?: number,
    posY?: number,
    textScale?: number,
    kickerScale?: number,
    subtitleScale?: number
  ) => {
    const targetAlign =
      align ??
      activeSlide.customAlign ??
      (typography.phraseAlign && typography.phraseAlign !== 'inherit'
        ? typography.phraseAlign
        : typography.align) ??
      'left';

    const targetDir =
      dir ??
      activeSlide.customDirection ??
      typography.direction ??
      'auto';

    const targetKickerAlign =
      kickerAlign ??
      activeSlide.customKickerAlign ??
      typography.kickerAlign ??
      'inherit';

    const targetX = posX ?? activeSlide.customTextX ?? typography.freePositionX ?? 50;
    const targetY = posY ?? activeSlide.customTextY ?? typography.freePositionY ?? 75;
    const targetScale = textScale ?? activeSlide.customTextScale ?? typography.fontSize ?? 1.1;
    const targetKScale = kickerScale ?? activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0;
    const targetSubScale = subtitleScale ?? activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;
    const targetTextColor = activeSlide.customTextColor ?? typography.textColor ?? '#ffffff';
    const targetKickerColor = activeSlide.customKickerColor ?? typography.accentColor ?? '#6366f1';
    const targetSubtitleColor = activeSlide.customSubtitleColor ?? typography.subtitleColor ?? '#a3a3a3';

    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customAlign: targetAlign,
        customDirection: targetDir,
        customKickerAlign: targetKickerAlign,
        customTextX: targetX,
        customTextY: targetY,
        customTextScale: targetScale,
        customKickerScale: targetKScale,
        customSubtitleScale: targetSubScale,
        customTextColor: targetTextColor,
        customKickerColor: targetKickerColor,
        customSubtitleColor: targetSubtitleColor,
        customBlur: activeSlide.customBlur,
        customFilter: activeSlide.customFilter,
        customOverlayImage: activeSlide.customOverlayImage,
      }))
    );

    setTypography((prev) => ({
      ...prev,
      align: targetAlign,
      phraseAlign: targetAlign,
      direction: targetDir,
      kickerAlign: targetKickerAlign,
      position: 'free',
      freePositionX: targetX,
      freePositionY: targetY,
      fontSize: targetScale,
      kickerSize: targetKScale,
      subtitleSize: targetSubScale,
      textColor: targetTextColor,
      accentColor: targetKickerColor,
      subtitleColor: targetSubtitleColor,
    }));

    const alignLabel = targetAlign === 'left' ? 'Gauche' : targetAlign === 'center' ? 'Centré' : 'Droite';
    const dirLabel = targetDir === 'rtl' ? 'RTL (Arabe)' : targetDir === 'ltr' ? 'LTR (Français)' : 'Auto';
    setAppliedAllNotice(
      `✨ Réglages complets appliqués aux ${slides.length} images : Sens (${dirLabel}), Alignement (${alignLabel}), Position (${targetX}%, ${targetY}%), Tailles & Couleurs !`
    );
    setTimeout(() => setAppliedAllNotice(null), 4500);
  };

  const handleApplyPositionToAll = (posX?: number, posY?: number) => {
    const targetX = posX ?? activeSlide.customTextX ?? typography.freePositionX ?? 50;
    const targetY = posY ?? activeSlide.customTextY ?? typography.freePositionY ?? 75;

    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customTextX: targetX,
        customTextY: targetY,
      }))
    );

    setTypography((prev) => ({
      ...prev,
      position: 'free',
      freePositionX: targetX,
      freePositionY: targetY,
    }));

    setAppliedAllNotice(`Position (X: ${targetX}%, Y: ${targetY}%) appliquée à toutes les ${slides.length} images !`);
    setTimeout(() => setAppliedAllNotice(null), 3500);
  };

  const handleApplySizesToAll = (textScale?: number, kickerScale?: number, subtitleScale?: number, numberScale?: number) => {
    const targetScale = textScale ?? activeSlide.customTextScale ?? typography.fontSize ?? 1.1;
    const targetKScale = kickerScale ?? activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0;
    const targetSubScale = subtitleScale ?? activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;
    const targetNumScale = numberScale ?? activeSlide.customNumberScale ?? typography.slideNumberSize ?? 1.0;

    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customTextScale: targetScale,
        customKickerScale: targetKScale,
        customSubtitleScale: targetSubScale,
        customNumberScale: targetNumScale,
      }))
    );

    setTypography((prev) => ({
      ...prev,
      fontSize: targetScale,
      kickerSize: targetKScale,
      subtitleSize: targetSubScale,
      slideNumberSize: targetNumScale,
    }));

    setAppliedAllNotice(
      `Tailles des textes (Phrase: ${Math.round(targetScale * 100)}%, Titre: ${Math.round(targetKScale * 100)}%, Numéros: ${Math.round(targetNumScale * 100)}%) appliquées à toutes les ${slides.length} images !`
    );
    setTimeout(() => setAppliedAllNotice(null), 3500);
  };

  const handleResetCurrentSlideFormatting = () => {
    updateActiveSlide({
      customAlign: undefined,
      customKickerAlign: undefined,
      customDirection: undefined,
      customTextX: 50,
      customTextY: 75,
      customTextScale: 1.1,
      customKickerScale: 1.0,
      customSubtitleScale: 1.0,
    });
    setAppliedAllNotice(`Image #${activeSlide.number} : Alignement, orientation, position et tailles réinitialisés.`);
    setTimeout(() => setAppliedAllNotice(null), 3000);
  };

  const handleResetAllSlidesFormatting = () => {
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        customAlign: undefined,
        customKickerAlign: undefined,
        customDirection: undefined,
        customTextX: 50,
        customTextY: 75,
        customTextScale: 1.1,
        customKickerScale: 1.0,
        customSubtitleScale: 1.0,
      }))
    );
    setTypography((prev) => ({
      ...prev,
      align: 'left',
      phraseAlign: undefined,
      kickerAlign: 'inherit',
      direction: 'auto',
      position: 'bottom',
      freePositionX: 50,
      freePositionY: 75,
      fontSize: 1.1,
      kickerSize: 1.0,
      subtitleSize: 1.0,
    }));
    setConfirmResetAll(false);
    setAppliedAllNotice(`🔄 Alignement, orientation, position et tailles réinitialisés sur l'ensemble des ${slides.length} images !`);
    setTimeout(() => setAppliedAllNotice(null), 4000);
  };

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const currentOverlay = activeSlide.customOverlayImage || overlayImage;

  const updateOverlayConfig = (fields: Partial<OverlayImageConfig>) => {
    if (overlayImage.applyToAll === false) {
      updateActiveSlide({
        customOverlayImage: {
          ...currentOverlay,
          ...fields,
        },
      });
    } else {
      setOverlayImage((prev) => ({
        ...prev,
        ...fields,
      }));
    }
  };

  const handleOverlayFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateOverlayConfig({ url: dataUrl, fileName: file.name, enabled: true });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomGoogleFont = async (fontName: string, isArabicTarget: boolean) => {
    if (!fontName.trim()) return;
    setIsLoadingFont(true);
    setFontLoadSuccess(null);
    try {
      await loadGoogleFont(fontName.trim());
      if (isArabicTarget) {
        setTypography((prev) => ({
          ...prev,
          customArabicFontFamily: fontName.trim(),
        }));
      } else {
        setTypography((prev) => ({
          ...prev,
          customFontFamily: fontName.trim(),
        }));
      }
      setFontLoadSuccess(`Police "${fontName.trim()}" appliquée avec succès !`);
      setTimeout(() => setFontLoadSuccess(null), 3000);
    } catch {
      // ignore
    } finally {
      setIsLoadingFont(false);
    }
  };

  // Helper to update active slide
  const updateActiveSlide = (fields: Partial<SlideItem>) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentSlideIndex ? { ...s, ...fields } : s))
    );
  };

  // Helper to add a new slide
  const handleAddSlide = () => {
    const newId = `slide-${Date.now()}`;
    const newNumber = slides.length + 1;
    const newSlide: SlideItem = {
      id: newId,
      number: newNumber,
      text: 'Nouvelle phrase percutante pour captiver votre audience.',
      kicker: 'CONSEIL DU JOUR',
      subtitle: `Épisode 0${newNumber} · AutoPost Studio`,
      imageUrl: slides[0]?.imageUrl || '',
      imageZoom: 1,
      imageBrightness: 100,
      customOverlayOpacity: 0.45,
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  // Helper to delete slide
  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const filtered = slides
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, number: i + 1 }));
    setSlides(filtered);
    setCurrentSlideIndex(Math.min(currentSlideIndex, filtered.length - 1));
  };

  // Handle single image file upload
  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateActiveSlide({ imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Handle batch image files upload (e.g. 6 images at once!)
  const handleBatchImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      if (idx >= slides.length) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSlides((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, imageUrl: dataUrl } : s))
        );
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle custom logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogo({ ...logo, type: 'custom', customUrl: dataUrl, enabled: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside
      className={`border-r border-neutral-800 bg-neutral-950 flex flex-col h-[calc(100dvh-4rem)] shrink-0 transition-all ${
        mobileView === 'preview' ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'
      }`}
    >
      {/* ============================================================== */}
      {/* BANDEAU SUPÉRIEUR MAÎTRE : APPLIQUER À TOUT & CONTRÔLE RAPIDE */}
      {/* ============================================================== */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md space-y-2.5 shrink-0 shadow-md">
        {/* Main "Appliquer à TOUT" Master Button */}
        <button
          type="button"
          onClick={() => handleApplyAllFormattingToAllSlides()}
          className="w-full py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 border border-indigo-400/40 transition-all hover:scale-[1.01] active:scale-[0.99] group"
          title="Appliquer l'orientation RTL/LTR, l'alignement, la position et les styles de cette diapo à TOUTES les diapos"
        >
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform" />
          <span>⚡ Appliquer à TOUT (RTL/LTR, Alignement, Tailles)</span>
        </button>

        {/* Quick Orientation & Alignment Toggles */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {/* Direction RTL / LTR / Auto */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-400 px-1 font-semibold">Sens:</span>
            <div className="grid grid-cols-3 gap-0.5 flex-1">
              {(['auto', 'ltr', 'rtl'] as const).map((dir) => {
                const isSelected = (activeSlide.customDirection ?? typography.direction ?? 'auto') === dir;
                return (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => handleApplyDirectionToAll(dir)}
                    className={`py-1 text-[10px] font-semibold rounded transition-colors text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={`Orientation : ${dir === 'rtl' ? 'RTL (Arabe)' : dir === 'ltr' ? 'LTR (Français)' : 'Auto'} appliquée à tout`}
                  >
                    {dir === 'rtl' ? 'عربي' : dir === 'ltr' ? 'LTR' : 'Auto'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alignment Left / Center / Right */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-400 px-1 font-semibold">Align:</span>
            <div className="grid grid-cols-3 gap-0.5 flex-1">
              {(['left', 'center', 'right'] as const).map((align) => {
                const isSelected = (activeSlide.customAlign ?? typography.align ?? 'left') === align;
                return (
                  <button
                    key={align}
                    type="button"
                    onClick={() => handleApplyAlignToAll(align)}
                    className={`py-1 text-[10px] font-semibold rounded transition-colors flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={`Alignement : ${align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : 'Droite'} appliqué à tout`}
                  >
                    {align === 'left' ? '◀' : align === 'center' ? '◆' : '▶'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Micro Actions Row: Position, Sizes, and Reset */}
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handleApplyPositionToAll()}
            className="py-1 px-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors truncate text-center"
            title="Appliquer la position exacte X & Y de cette diapo à toutes les autres"
          >
            📍 Position à tout
          </button>
          <button
            type="button"
            onClick={() => handleApplySizesToAll()}
            className="py-1 px-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors truncate text-center"
            title="Appliquer le zoom et les échelles de polices à toutes les diapos"
          >
            🔠 Tailles à tout
          </button>
          <button
            type="button"
            onClick={() => handleResetAllSlidesFormatting()}
            className="py-1 px-1.5 rounded-lg bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800/60 text-neutral-400 hover:text-red-300 transition-colors truncate text-center"
            title="Réinitialiser l'alignement, le sens et la position par défaut sur toutes les diapos"
          >
            🔄 Réinitialiser
          </button>
        </div>

        {/* Global Notification Toast */}
        {appliedAllNotice && (
          <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-700/80 flex items-center gap-2 text-xs text-emerald-300 shadow-md animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="font-medium text-[11px] leading-tight">{appliedAllNotice}</span>
          </div>
        )}
      </div>

      {/* Tabs navigation header (visible on all screens to easily navigate tabs) */}
      <div className="flex overflow-x-auto p-1.5 border-b border-neutral-800 bg-neutral-950/90 gap-1 custom-scrollbar shrink-0">
        {[
          { id: 'slides', label: 'Diapos' },
          { id: 'media', label: 'Médias' },
          { id: 'typography', label: 'Typo & Tailles' },
          { id: 'filters', label: 'Filtres & Flou' },
          { id: 'overlay', label: 'Superposition' },
          { id: 'ratios', label: 'Formats' },
          { id: 'branding', label: 'Logo & Filigrane' },
          { id: 'automation', label: 'Export & Auto' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-all font-medium ${
              activeTab === t.id
                ? 'bg-neutral-800 text-white shadow-sm font-semibold border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: PHRASES & SLIDES */}
        {/* ============================================================== */}
        {activeTab === 'slides' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Série de Phrases</h3>
                <p className="text-xs text-neutral-400">
                  {slides.length} diapos prêtes à générer
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenBatchModal}
                  className="px-2 py-1 text-[11px] font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
                  title="Coller plusieurs phrases d'un coup"
                >
                  Coller un lot
                </button>
                <button
                  onClick={handleAddSlide}
                  className="p-1 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
                  title="Ajouter une diapo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Selector Carousel Tabs */}
            <div className="grid grid-cols-6 gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                    idx === currentSlideIndex
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  #{s.number}
                </button>
              ))}
            </div>

            {/* Active Slide Form */}
            {activeSlide && (
              <div className="space-y-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400">
                    Édition Diapo {activeSlide.number}
                  </span>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteSlide(currentSlideIndex, e)}
                      className="text-neutral-400 hover:text-rose-400 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>

                {/* 1. Kicker / Category tag */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Titre Kicker / Thématique</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#ffffff'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              updateActiveSlide({ customKickerColor: c });
                              setTypography((prev) => ({ ...prev, accentColor: c }));
                            }}
                            className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                            style={{ backgroundColor: c }}
                            title={`Couleur Titre : ${c}`}
                          />
                        ))}
                      </div>
                      <label className="relative flex items-center cursor-pointer group" title="Choisir la couleur du Titre">
                        <input
                          type="color"
                          value={getSafeHex(activeSlide.customKickerColor || typography.accentColor, '#6366f1')}
                          onChange={(e) => {
                            updateActiveSlide({ customKickerColor: e.target.value });
                            setTypography((prev) => ({ ...prev, accentColor: e.target.value }));
                          }}
                          className="sr-only"
                        />
                        <div
                          className="w-4 h-4 rounded border border-white/30 shadow-sm group-hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: activeSlide.customKickerColor || typography.accentColor || '#6366f1' }}
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    dir="auto"
                    value={activeSlide.kicker || ''}
                    onChange={(e) => updateActiveSlide({ kicker: e.target.value })}
                    placeholder="Ex: VISION & LEADERSHIP"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 2. Main Phrase text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Phrase Principale (Texte du visuel)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {['#ffffff', '#fef3c7', '#fef08a', '#bae6fd', '#0a0a0a'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              updateActiveSlide({ customTextColor: c });
                              setTypography((prev) => ({ ...prev, textColor: c }));
                            }}
                            className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                            style={{ backgroundColor: c }}
                            title={`Couleur Phrase : ${c}`}
                          />
                        ))}
                      </div>
                      <label className="relative flex items-center cursor-pointer group" title="Choisir la couleur de la Phrase Principale">
                        <input
                          type="color"
                          value={getSafeHex(activeSlide.customTextColor || typography.textColor, '#ffffff')}
                          onChange={(e) => {
                            updateActiveSlide({ customTextColor: e.target.value });
                            setTypography((prev) => ({ ...prev, textColor: e.target.value }));
                          }}
                          className="sr-only"
                        />
                        <div
                          className="w-4 h-4 rounded border border-white/30 shadow-sm group-hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: activeSlide.customTextColor || typography.textColor || '#ffffff' }}
                        />
                      </label>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    dir="auto"
                    value={activeSlide.text}
                    onChange={(e) => updateActiveSlide({ text: e.target.value })}
                    placeholder="Votre phrase ou citation percutante..."
                    className="w-full p-3 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                {/* 3. Subtitle / Citation signature */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Sous-titre / Signature / Auteur</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {['#d1d5db', '#ffffff', '#fbbf24', '#818cf8', '#34d399'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              updateActiveSlide({ customSubtitleColor: c });
                              setTypography((prev) => ({ ...prev, subtitleColor: c }));
                            }}
                            className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                            style={{ backgroundColor: c }}
                            title={`Couleur Sous-titre : ${c}`}
                          />
                        ))}
                      </div>
                      <label className="relative flex items-center cursor-pointer group" title="Choisir la couleur du Sous-titre / Signature">
                        <input
                          type="color"
                          value={getSafeHex(activeSlide.customSubtitleColor || typography.subtitleColor, '#d1d5db')}
                          onChange={(e) => {
                            updateActiveSlide({ customSubtitleColor: e.target.value });
                            setTypography((prev) => ({ ...prev, subtitleColor: e.target.value }));
                          }}
                          className="sr-only"
                        />
                        <div
                          className="w-4 h-4 rounded border border-white/30 shadow-sm group-hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: activeSlide.customSubtitleColor || typography.subtitleColor || '#d1d5db' }}
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    dir="auto"
                    value={activeSlide.subtitle || ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                    placeholder="Ex: Épisode 01 · @moncompte"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Alignment & Direction Controls for this slide */}
                {(() => {
                  const activePhraseIsArabic = isArabicText(activeSlide.text || '');
                  const activeKickerIsArabic = isArabicText(activeSlide.kicker || '');

                  const activePhraseDir: 'rtl' | 'ltr' =
                    activeSlide.customDirection === 'rtl' || typography.direction === 'rtl'
                      ? 'rtl'
                      : activeSlide.customDirection === 'ltr' || typography.direction === 'ltr'
                      ? 'ltr'
                      : (activePhraseIsArabic ? 'rtl' : 'ltr');

                  const activeKickerDir: 'rtl' | 'ltr' =
                    activeSlide.customDirection === 'rtl' || typography.direction === 'rtl'
                      ? 'rtl'
                      : activeSlide.customDirection === 'ltr' || typography.direction === 'ltr'
                      ? 'ltr'
                      : (activeKickerIsArabic ? 'rtl' : 'ltr');

                  const effectiveAlign = resolveEffectiveAlignment(
                    activePhraseDir,
                    activeSlide.customAlign,
                    typography.phraseAlign,
                    typography.align
                  );

                  const isRtlMode = activePhraseDir === 'rtl';

                  const currentKickerSetting = activeSlide.customKickerAlign || typography.kickerAlign || 'inherit';
                  const currentDirSetting: TextDirectionType = activeSlide.customDirection || typography.direction || 'auto';

                  const alignLabel = effectiveAlign === 'left' ? 'Gauche' : effectiveAlign === 'center' ? 'Centré' : 'Droite';
                  const dirLabel = currentDirSetting === 'rtl' ? 'RTL (Arabe)' : currentDirSetting === 'ltr' ? 'LTR (Français)' : 'Auto';

                  return (
                    <div className="pt-3 border-t border-neutral-800 space-y-3">
                      {/* Section Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
                          <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Alignement & Sens de Lecture</span>
                        </span>
                        {isRtlMode ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] text-emerald-300 font-medium">
                            Arabe (RTL · Droite)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-medium">
                            Français (LTR · Gauche)
                          </span>
                        )}
                      </div>

                      {/* Alignement & Direction Dual Controls */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Text Alignment */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="block text-[10px] font-medium text-neutral-400">
                              Alignement Texte
                            </span>
                            {activeSlide.customAlign && (
                              <button
                                type="button"
                                onClick={() => updateActiveSlide({ customAlign: undefined })}
                                className="text-[9.5px] text-indigo-400 hover:text-indigo-300 underline"
                                title="Réinitialiser à l'alignement naturel"
                              >
                                Auto
                              </button>
                            )}
                          </div>
                          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                            {[
                              {
                                id: 'left',
                                icon: AlignLeft,
                                title: isRtlMode ? 'Gauche (Fin de phrase en Arabe)' : 'Gauche (Début de phrase LTR)',
                                label: 'Gauche',
                              },
                              {
                                id: 'center',
                                icon: AlignCenter,
                                title: 'Centré (Équilibré)',
                                label: 'Centré',
                              },
                              {
                                id: 'right',
                                icon: AlignRight,
                                title: isRtlMode ? 'Droite (Début naturel en Arabe)' : 'Droite (Fin de phrase LTR)',
                                label: 'Droite',
                              },
                            ].map((al) => {
                              const Icon = al.icon;
                              const isActive = effectiveAlign === al.id;
                              return (
                                <button
                                  key={al.id}
                                  type="button"
                                  onClick={() => {
                                    updateActiveSlide({ customAlign: al.id as any });
                                  }}
                                  title={al.title}
                                  className={`flex-1 py-1.5 flex items-center justify-center rounded transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-medium'
                                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Direction RTL / LTR / Auto */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="block text-[10px] font-medium text-neutral-400">
                              Sens d&apos;écriture
                            </span>
                          </div>
                          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[10px]">
                            {[
                              { id: 'auto', label: 'Auto' },
                              { id: 'rtl', label: 'RTL (عربي)' },
                              { id: 'ltr', label: 'LTR' },
                            ].map((dir) => {
                              const isActive = currentDirSetting === dir.id;
                              return (
                                <button
                                  key={dir.id}
                                  type="button"
                                  onClick={() => {
                                    updateActiveSlide({ customDirection: dir.id as any });
                                    setTypography((prev) => ({ ...prev, direction: dir.id as any }));
                                  }}
                                  className={`flex-1 py-1.5 rounded transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-indigo-400'
                                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                                  }`}
                                >
                                  {dir.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 3. Independent Title (Kicker) Alignment override */}
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-neutral-400">Alignement Titre :</span>
                        <div className="flex bg-neutral-950 p-0.5 rounded border border-neutral-800">
                          {[
                            { id: 'inherit', label: 'Comme phrase' },
                            { id: 'left', label: 'Gauche' },
                            { id: 'center', label: 'Centré' },
                            { id: 'right', label: 'Droite' },
                          ].map((item) => {
                            const isAct = currentKickerSetting === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  updateActiveSlide({ customKickerAlign: item.id as any });
                                }}
                                className={`px-2 py-0.5 rounded text-[9.5px] transition-colors ${
                                  isAct ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. ACTIONS "APPLIQUER À TOUT" & RÉINITIALISATION */}
                      <div className="p-3 rounded-xl bg-neutral-950/95 border border-neutral-800 space-y-2.5 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mise en Page Globale & Propagation</span>
                          </span>
                          <span className="text-[10px] text-indigo-400 font-mono font-medium">
                            {slides.length} images
                          </span>
                        </div>

                        {/* Master Apply to All button: Alignement, Orientation RTL/LTR, Position & Tailles */}
                        <button
                          type="button"
                          onClick={() => handleApplyAllFormattingToAllSlides(effectiveAlign, currentDirSetting, currentKickerSetting)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
                          title="Propager l'orientation RTL/LTR, l'alignement, la position et les dimensions de cette image sur toutes les autres"
                        >
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span>Appliquer à TOUT (Orientation RTL/LTR, Alignement, Position & Tailles)</span>
                        </button>

                        {/* Individual shortcuts grid */}
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleApplyAlignToAll(effectiveAlign)}
                            className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                            title={`Appliquer uniquement l'alignement (${alignLabel}) à toutes les images`}
                          >
                            Alignement seul ({alignLabel})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDirectionToAll(currentDirSetting)}
                            className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                            title={`Appliquer uniquement l'orientation (${dirLabel}) à toutes les images`}
                          >
                            Orientation RTL/LTR ({dirLabel})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPositionToAll()}
                            className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                            title="Appliquer uniquement la position X/Y de cette image à toutes les autres"
                          >
                            Position seule (X/Y)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySizesToAll()}
                            className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                            title="Appliquer uniquement les tailles des textes de cette image à toutes les autres"
                          >
                            Tailles seules
                          </button>
                        </div>

                        {/* Reset Buttons */}
                        <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleResetCurrentSlideFormatting}
                              className="flex-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                              title="Réinitialiser l'alignement, l'orientation, la position et les tailles de cette image"
                            >
                              <RotateCcw className="w-3 h-3 text-neutral-400" />
                              <span>Réinitialiser cette image</span>
                            </button>

                            {!confirmResetAll ? (
                              <button
                                type="button"
                                onClick={() => setConfirmResetAll(true)}
                                className="py-1.5 px-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 hover:border-rose-700/60 text-rose-300 hover:text-rose-200 rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1 transition-colors"
                                title="Réinitialiser l'alignement, l'orientation, la position et les tailles sur l'ensemble des images"
                              >
                                <RotateCcw className="w-3 h-3 text-rose-400" />
                                <span>Réinitialiser tout</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={handleResetAllSlidesFormatting}
                                  className="py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 shadow animate-pulse"
                                >
                                  <span>Confirmer ?</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmResetAll(false)}
                                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10.5px]"
                                >
                                  Non
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Typographic guidance note */}
                      <div className="p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                          <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Typographie bilingue :</span>
                        </div>
                        <p>
                          En Arabe (RTL), le début naturel du texte est à <strong>droite</strong>. En Français (LTR), le début est à <strong>gauche</strong>.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                  {/* SECTION COULEURS DES TEXTES (Titre, Phrase, Sous-titre) */}
                  <div className="pt-2.5 border-t border-neutral-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Couleurs des Textes (Titre, Phrase, Signature)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveSlide({
                              customKickerColor: undefined,
                              customTextColor: undefined,
                              customSubtitleColor: undefined,
                            });
                          }}
                          className="text-[10px] text-neutral-400 hover:text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 transition-colors"
                          title="Réinitialiser les couleurs de cette diapo aux couleurs du thème"
                        >
                          Réinitialiser
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const kColor = activeSlide.customKickerColor || typography.accentColor || '#6366f1';
                            const pColor = activeSlide.customTextColor || typography.textColor || '#ffffff';
                            const sColor = activeSlide.customSubtitleColor || typography.subtitleColor || 'rgba(255, 255, 255, 0.75)';
                            setTypography((prev) => ({
                              ...prev,
                              accentColor: kColor,
                              textColor: pColor,
                              subtitleColor: sColor,
                            }));
                            if (setSlides) {
                              setSlides((prev) =>
                                prev.map((s) => ({
                                  ...s,
                                  customKickerColor: kColor,
                                  customTextColor: pColor,
                                  customSubtitleColor: sColor,
                                }))
                              );
                            }
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 transition-colors font-medium"
                          title="Appliquer ces 3 couleurs à toutes les diapos du lot"
                        >
                          Appliquer à tout le lot
                        </button>
                      </div>
                    </div>

                    {/* Active colors summary badge */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                      <span className="text-neutral-400 text-[11px]">Couleurs actives :</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10.5px] text-neutral-300">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: activeSlide.customKickerColor || typography.accentColor || '#6366f1' }} />
                          Titre
                        </span>
                        <span className="flex items-center gap-1 text-[10.5px] text-neutral-300">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: activeSlide.customTextColor || typography.textColor || '#ffffff' }} />
                          Phrase
                        </span>
                        <span className="flex items-center gap-1 text-[10.5px] text-neutral-300">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: activeSlide.customSubtitleColor || typography.subtitleColor || '#d1d5db' }} />
                          Sous-titre
                        </span>
                      </div>
                    </div>

                    {/* Quick Harmonious Palettes Trio in Slide Editor */}
                    <div className="pt-2 border-t border-neutral-800/60">
                      <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1.5">
                        Combinaisons Harmonieuses en 1 Clic
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { name: 'Élégance Or', kicker: '#f59e0b', text: '#ffffff', sub: '#fed7aa' },
                          { name: 'Moderne Indigo', kicker: '#6366f1', text: '#ffffff', sub: '#c7d2fe' },
                          { name: 'Émeraude Frais', kicker: '#10b981', text: '#f0fdf4', sub: '#a7f3d0' },
                          { name: 'Cyberpunk Rose', kicker: '#ec4899', text: '#ffffff', sub: '#67e8f9' },
                          { name: 'Sunset Ambré', kicker: '#f97316', text: '#fffbeb', sub: '#fde047' },
                          { name: 'Luxe Noir & Or', kicker: '#fbbf24', text: '#f8fafc', sub: '#94a3b8' },
                          { name: 'Rose Poudré', kicker: '#f472b6', text: '#ffffff', sub: '#fbcfe8' },
                          { name: 'Monochrome Pur', kicker: '#9ca3af', text: '#ffffff', sub: '#6b7280' },
                        ].map((combo) => (
                          <button
                            key={combo.name}
                            type="button"
                            onClick={() => {
                              updateActiveSlide({
                                customKickerColor: combo.kicker,
                                customTextColor: combo.text,
                                customSubtitleColor: combo.sub,
                              });
                              setTypography((prev) => ({
                                ...prev,
                                accentColor: combo.kicker,
                                textColor: combo.text,
                                subtitleColor: combo.sub,
                              }));
                            }}
                            className="p-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg flex items-center justify-between text-left transition-all group"
                          >
                            <span className="text-[10px] text-neutral-300 group-hover:text-white truncate">
                              {combo.name}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0 ml-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: combo.kicker }} />
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: combo.text }} />
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: combo.sub }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                {/* Text Resizing & Dimensions for this Slide */}
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-300">
                      Dimensions & Tailles des Textes
                    </span>
                    <button
                      onClick={() =>
                        updateActiveSlide({
                          customTextScale: 1.1,
                          customKickerScale: 1.0,
                          customSubtitleScale: 1.0,
                        })
                      }
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Réinitialiser</span>
                    </button>
                  </div>

                  {/* Phrase scale slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Taille de la Phrase (jusqu'à 1000%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={Math.round((activeSlide.customTextScale ?? typography.fontSize ?? 1.1) * 100)}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                            updateActiveSlide({ customTextScale: val });
                          }}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-right font-mono text-indigo-300 font-bold"
                        />
                        <span className="text-[10px] text-neutral-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.05"
                      value={activeSlide.customTextScale ?? typography.fontSize ?? 1.1}
                      onChange={(e) => updateActiveSlide({ customTextScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Kicker scale slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Taille du Titre (Kicker)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={Math.round((activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0) * 100)}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                            updateActiveSlide({ customKickerScale: val });
                          }}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-right font-mono text-neutral-200"
                        />
                        <span className="text-[10px] text-neutral-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.05"
                      value={activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0}
                      onChange={(e) => updateActiveSlide({ customKickerScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Subtitle scale slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Taille du Sous-titre</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={Math.round((activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0) * 100)}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                            updateActiveSlide({ customSubtitleScale: val });
                          }}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-right font-mono text-neutral-200"
                        />
                        <span className="text-[10px] text-neutral-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.05"
                      value={activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0}
                      onChange={(e) => updateActiveSlide({ customSubtitleScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Slide number scale slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Taille du Numéro d'Image</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={Math.round((activeSlide.customNumberScale ?? typography.slideNumberSize ?? 1.0) * 100)}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                            updateActiveSlide({ customNumberScale: val });
                          }}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-right font-mono text-emerald-300 font-bold"
                        />
                        <span className="text-[10px] text-neutral-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.05"
                      value={activeSlide.customNumberScale ?? typography.slideNumberSize ?? 1.0}
                      onChange={(e) => updateActiveSlide({ customNumberScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Free Drag & Drop Positioning on Canvas */}
                <div className="pt-2 border-t border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-300">
                      Position sur le Visuel (Drag & Drop)
                    </span>
                    <button
                      onClick={() => updateActiveSlide({ customTextX: 50, customTextY: 75 })}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Recentrer</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    💡 Vous pouvez glisser directement le texte sur le canevas en mode "Aperçu Unique" !
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="block text-neutral-400 mb-0.5">
                        Position X: {activeSlide.customTextX ?? typography.freePositionX ?? 50}%
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={activeSlide.customTextX ?? typography.freePositionX ?? 50}
                        onChange={(e) => updateActiveSlide({ customTextX: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="block text-neutral-400 mb-0.5">
                        Position Y: {activeSlide.customTextY ?? typography.freePositionY ?? 75}%
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={activeSlide.customTextY ?? typography.freePositionY ?? 75}
                        onChange={(e) => updateActiveSlide({ customTextY: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Scheduled time info */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                    Programmation de publication (Auto-Export)
                  </label>
                  <input
                    type="datetime-local"
                    value={activeSlide.scheduledTime || ''}
                    onChange={(e) => updateActiveSlide({ scheduledTime: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* AI Generator Box */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 to-neutral-900 border border-indigo-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold text-white">Générateur IA & Social Pack</h4>
              </div>
              <p className="text-[11px] text-neutral-300 leading-normal">
                Générez sur mesure votre description, le nombre de phrases souhaité et obtenez le pack complet de légendes et hashtags pour chaque réseau.
              </p>
              <button
                onClick={onOpenAiModal || onQuickAiGenerate}
                disabled={isAiGenerating}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'Génération en cours...' : 'Générer Phrases & Social Pack (IA)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VISUALS & MEDIA */}
        {/* ============================================================== */}
        {activeTab === 'media' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Gestion des Images</h3>
              <p className="text-xs text-neutral-400">
                Associez une image à chaque phrase pour une esthétique éditoriale
              </p>
            </div>

            {/* Batch Upload Area */}
            <div className="p-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 text-center space-y-2">
              <Upload className="w-5 h-5 text-neutral-400 mx-auto" />
              <div>
                <p className="text-xs font-medium text-neutral-200">
                  Téléverser vos 6 images en 1 clic
                </p>
                <p className="text-[10px] text-neutral-400">
                  Sélectionnez 6 fichiers images (JPG, PNG, WebP)
                </p>
              </div>
              <input
                ref={batchFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleBatchImageUpload}
                className="hidden"
              />
              <button
                onClick={() => batchFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Sélectionner un lot d'images
              </button>
            </div>

            {/* Active Slide Image Controls */}
            {activeSlide && (
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400">
                    Image pour Diapo {activeSlide.number}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSingleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Remplacer l'image
                  </button>
                </div>

                {/* Preview Thumbnail */}
                <div className="relative h-28 rounded-lg overflow-hidden border border-neutral-800">
                  <img
                    src={activeSlide.imageUrl}
                    alt="Aperçu diapo"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Dark Overlay Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-400">Assombrissement du fond</span>
                    <span className="font-mono text-neutral-200">
                      {Math.round((activeSlide.customOverlayOpacity ?? 0.45) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.05"
                    value={activeSlide.customOverlayOpacity ?? 0.45}
                    onChange={(e) =>
                      updateActiveSlide({ customOverlayOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Augmentez pour garantir un contraste parfait du texte.
                  </p>
                </div>

                {/* Brightness Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-400">Luminosité photo</span>
                    <span className="font-mono text-neutral-200">
                      {activeSlide.imageBrightness ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={activeSlide.imageBrightness ?? 100}
                    onChange={(e) =>
                      updateActiveSlide({ imageBrightness: parseInt(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Image Pan & Zoom Crop Controls */}
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Cadrage & Position de la Photo</span>
                    </span>
                    <button
                      onClick={() => updateActiveSlide({ imageZoom: 1, imagePanX: 0, imagePanY: 0 })}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                      title="Réinitialiser zoom et cadrage"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Recentrer</span>
                    </button>
                  </div>

                  {/* Zoom slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Zoom / Échelle</span>
                      <span className="font-mono text-indigo-300">
                        {Math.round((activeSlide.imageZoom ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={activeSlide.imageZoom ?? 1}
                      onChange={(e) => updateActiveSlide({ imageZoom: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Horizontal Pan X */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Déplacement Horizontal (X)</span>
                      <span className="font-mono text-neutral-200">
                        {activeSlide.imagePanX ?? 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={activeSlide.imagePanX ?? 0}
                      onChange={(e) => updateActiveSlide({ imagePanX: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Vertical Pan Y */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Déplacement Vertical (Y)</span>
                      <span className="font-mono text-neutral-200">
                        {activeSlide.imagePanY ?? 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={activeSlide.imagePanY ?? 0}
                      onChange={(e) => updateActiveSlide({ imagePanY: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Quick crop presets */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => updateActiveSlide({ imagePanY: -30 })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                    >
                      Haut
                    </button>
                    <button
                      onClick={() => updateActiveSlide({ imagePanX: 0, imagePanY: 0 })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                    >
                      Centre
                    </button>
                    <button
                      onClick={() => updateActiveSlide({ imagePanY: 30 })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                    >
                      Bas
                    </button>
                  </div>

                  <p className="text-[10px] text-neutral-400">
                    💡 Vous pouvez aussi glisser directement la photo sur l'aperçu avec l'outil <strong>Cadrer l'image</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Switch to preset high-res images */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300">
                Bibliothèque photo intégrée
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    name: 'Studio Design',
                    url: PRESET_IMAGES.creativity,
                  },
                  {
                    name: 'Architecture',
                    url: PRESET_IMAGES.architecture,
                  },
                  {
                    name: 'Nature Sereine',
                    url: PRESET_IMAGES.nature,
                  },
                  {
                    name: 'Artisanat',
                    url: PRESET_IMAGES.craft,
                  },
                  {
                    name: 'Sculpture',
                    url: PRESET_IMAGES.structure,
                  },
                  {
                    name: 'Skyline Urbain',
                    url: PRESET_IMAGES.skyline,
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => updateActiveSlide({ imageUrl: item.url })}
                    className="relative group rounded-lg overflow-hidden border border-neutral-800 hover:border-indigo-500 transition-colors h-16"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-neutral-950/50 flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-medium text-white line-clamp-1">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: IMAGE DE SUPERPOSITION (Stickers, Badges, Filigranes)  */}
        {/* ============================================================== */}
        {activeTab === 'overlay' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Image de Superposition</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Stickers, badges, filigranes, cadres ou visuels PNG transparents
                  </p>
                </div>
                {/* Master Enable Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentOverlay.enabled}
                    onChange={(e) => updateOverlayConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Scope: Apply to All Slides vs This Slide Only */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-neutral-300 block">
                Portée de l'effet
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOverlayImage((prev) => ({ ...prev, applyToAll: true }));
                  }}
                  className={`py-2 px-3 rounded-lg border text-left transition-colors ${
                    overlayImage.applyToAll !== false
                      ? 'bg-indigo-950/50 border-indigo-500 text-white font-medium ring-1 ring-indigo-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block font-medium">Tout le lot</span>
                  <span className="text-[10px] text-neutral-400">Toutes les {slides.length} diapos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlayImage((prev) => ({ ...prev, applyToAll: false }));
                  }}
                  className={`py-2 px-3 rounded-lg border text-left transition-colors ${
                    overlayImage.applyToAll === false
                      ? 'bg-indigo-950/50 border-indigo-500 text-white font-medium ring-1 ring-indigo-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block font-medium">Diapo #{activeSlide.number}</span>
                  <span className="text-[10px] text-neutral-400">Uniquement cette diapo</span>
                </button>
              </div>
            </div>

            {/* Status notification banner if disabled */}
            {!currentOverlay.enabled && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse"></span>
                  <p className="text-xs text-amber-200">
                    Superposition en veille. Choisissez un badge ou téléversez une image pour l'activer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateOverlayConfig({ enabled: true })}
                  className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-md transition-colors shrink-0"
                >
                  Activer
                </button>
              </div>
            )}

            <div className="space-y-5">
              {/* Active Overlay Card if set */}
              {currentOverlay.url && (
                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner">
                    <img
                      src={currentOverlay.url}
                      alt="Aperçu superposition"
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: currentOverlay.rotation ? `rotate(${currentOverlay.rotation}deg)` : undefined,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate block">
                        {currentOverlay.fileName || 'Superposition active'}
                      </span>
                      {currentOverlay.enabled ? (
                        <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-1.5 py-0.2 rounded">
                          Visible
                        </span>
                      ) : (
                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded">
                          Masqué
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono block mt-0.5">
                      Taille: {Math.round((currentOverlay.scale ?? 1) * 100)}% · Rot: {currentOverlay.rotation ?? 0}° · Opacité: {Math.round((currentOverlay.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => overlayFileInputRef.current?.click()}
                      className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors"
                      title="Changer de fichier"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOverlayConfig({ url: '', fileName: undefined })}
                      className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                      title="Supprimer la superposition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Curated Badges & Stickers Library */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">
                      Catalogue de Stickers & Badges
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {PRESET_OVERLAYS.length} modèles
                  </span>
                </div>

                {/* Category Tabs: All, Confiance, Promo, Arabe, Social */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'trust', label: 'Confiance & Avis' },
                    { id: 'promo', label: 'Promos & Vente' },
                    { id: 'arabic', label: 'العربية / Arabe' },
                    { id: 'social', label: 'Réseaux & CTA' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setOverlayCategoryTab(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        overlayCategoryTab === cat.id
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Stickers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-0.5">
                  {PRESET_OVERLAYS.filter(
                    (b) => overlayCategoryTab === 'all' || b.category === overlayCategoryTab
                  ).map((badge) => {
                    const isSelected = currentOverlay.url === badge.url;
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() =>
                          updateOverlayConfig({
                            url: badge.url,
                            fileName: badge.name,
                            enabled: true,
                          })
                        }
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center group ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="w-12 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <img
                            src={badge.url}
                            alt={badge.name}
                            className="max-w-full max-h-full object-contain drop-shadow"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-neutral-300 line-clamp-1">
                          {badge.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Custom Upload & Direct URL */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Importer votre Propre Visuel ou Filigrane</span>
                </span>

                {/* Upload button & drop zone */}
                <input
                  type="file"
                  ref={overlayFileInputRef}
                  onChange={handleOverlayFileUpload}
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => overlayFileInputRef.current?.click()}
                  className="w-full py-3 px-3 border-2 border-dashed border-neutral-800 hover:border-indigo-500 rounded-xl bg-neutral-950 hover:bg-neutral-900 transition-all flex flex-col items-center justify-center gap-1 text-center group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-neutral-200">
                    Glisser ou cliquer pour téléverser
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    PNG transparent, SVG, sticker, filigrane
                  </span>
                </button>

                {/* Direct Image URL input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="url"
                    placeholder="Ou coller une URL d'image (PNG/SVG)..."
                    value={overlayUrlInput}
                    onChange={(e) => setOverlayUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && overlayUrlInput.trim()) {
                        updateOverlayConfig({
                          url: overlayUrlInput.trim(),
                          fileName: 'Image Web',
                          enabled: true,
                        });
                        setOverlayUrlInput('');
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={!overlayUrlInput.trim()}
                    onClick={() => {
                      if (overlayUrlInput.trim()) {
                        updateOverlayConfig({
                          url: overlayUrlInput.trim(),
                          fileName: 'Image Web',
                          enabled: true,
                        });
                        setOverlayUrlInput('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Charger
                  </button>
                </div>
              </div>

              {/* 3. Position Controls (9-Anchor Grid + Custom) */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Position de la superposition
                  </span>
                  {currentOverlay.position === 'custom' && (
                    <button
                      type="button"
                      onClick={() => updateOverlayConfig({ customX: 50, customY: 50, enabled: true })}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Centrer</span>
                    </button>
                  )}
                </div>

                {/* 9-position anchor grid + custom */}
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'top-left', label: 'Haut Gauche' },
                    { id: 'top-center', label: 'Haut Centre' },
                    { id: 'top-right', label: 'Haut Droite' },
                    { id: 'center', label: 'Plein Centre' },
                    { id: 'bottom-left', label: 'Bas Gauche' },
                    { id: 'bottom-center', label: 'Bas Centre' },
                    { id: 'bottom-right', label: 'Bas Droite' },
                    { id: 'custom', label: 'Libre (X/Y)' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => updateOverlayConfig({ position: pos.id as any, enabled: true })}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                        currentOverlay.position === pos.id
                          ? 'bg-indigo-600 text-white font-medium border-indigo-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                {/* Custom X & Y sliders if position === 'custom' */}
                {currentOverlay.position === 'custom' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-800/80 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400">
                        <span>Axe X</span>
                        <span className="font-mono text-indigo-300">
                          {currentOverlay.customX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="1"
                        value={currentOverlay.customX ?? 50}
                        onChange={(e) =>
                          updateOverlayConfig({ customX: parseInt(e.target.value), enabled: true })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400">
                        <span>Axe Y</span>
                        <span className="font-mono text-indigo-300">
                          {currentOverlay.customY ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="1"
                        value={currentOverlay.customY ?? 50}
                        onChange={(e) =>
                          updateOverlayConfig({ customY: parseInt(e.target.value), enabled: true })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-neutral-500 italic">
                  💡 En mode « Aperçu Unique », vous pouvez aussi glisser-déposer le sticker avec la souris.
                </p>
              </div>

              {/* 4. Scale & Dimensions */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Dimension / Échelle</span>
                  <span className="font-mono text-indigo-300 font-medium">
                    {Math.round((currentOverlay.scale ?? 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.8"
                  step="0.05"
                  value={currentOverlay.scale ?? 1.0}
                  onChange={(e) =>
                    updateOverlayConfig({ scale: parseFloat(e.target.value), enabled: true })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1.5 text-[10px]">
                  {[
                    { label: 'Mini (20%)', val: 0.2 },
                    { label: 'Normal (35%)', val: 0.35 },
                    { label: 'Grand (55%)', val: 0.55 },
                    { label: 'Max (100%)', val: 1.0 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => updateOverlayConfig({ scale: p.val, enabled: true })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Rotation Slider & Presets */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Rotation / Inclinaison</span>
                  <span className="font-mono text-indigo-300 font-medium">
                    {currentOverlay.rotation ?? 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={currentOverlay.rotation ?? 0}
                  onChange={(e) =>
                    updateOverlayConfig({ rotation: parseInt(e.target.value), enabled: true })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1.5 text-[10px]">
                  {[
                    { label: 'Droit (0°)', val: 0 },
                    { label: '-12° Incliné', val: -12 },
                    { label: '+12° Incliné', val: 12 },
                    { label: 'Diagonal (45°)', val: 45 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => updateOverlayConfig({ rotation: p.val, enabled: true })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Opacity & Blend Mode */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3.5">
                {/* Opacity */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-300">Opacité</span>
                    <span className="font-mono text-neutral-200">
                      {Math.round((currentOverlay.opacity ?? 1.0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={currentOverlay.opacity ?? 1.0}
                    onChange={(e) =>
                      updateOverlayConfig({ opacity: parseFloat(e.target.value), enabled: true })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Blend Mode */}
                <div>
                  <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                    Mode de Fusion
                  </label>
                  <select
                    value={currentOverlay.blendMode || 'normal'}
                    onChange={(e) =>
                      updateOverlayConfig({ blendMode: e.target.value as any, enabled: true })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal (Opaque)</option>
                    <option value="screen">Superposition claire (Screen)</option>
                    <option value="overlay">Incrustation (Overlay)</option>
                    <option value="multiply">Produit sombre (Multiply)</option>
                    <option value="soft-light">Lumière douce (Soft-light)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: FILTRES DÉGRADÉS (Flou & Couleurs)                         */}
        {/* ============================================================== */}
        {activeTab === 'filters' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Filtres Dégradés & Effets</h3>
              <p className="text-xs text-neutral-400">
                Flou directionnel progressif ou voiles de couleurs artistiques au choix pour sublimer vos visuels.
              </p>
            </div>

            {/* SECTION 1: FILTRE DE FLOU DÉGRADÉ */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <h4 className="text-xs font-semibold text-white">1. Filtre de Flou Dégradé</h4>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Flou progressif pour créer un espace lisible élégant
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gradientBlur.enabled}
                    onChange={(e) =>
                      setGradientBlur({ ...gradientBlur, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {gradientBlur.enabled ? (
                <div className="space-y-4 pt-3 border-t border-neutral-800/80">
                  {/* Presets rapides de flou */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                      Modèles Prédéfinis au Choix
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GRADIENT_BLUR_PRESETS.map((preset) => {
                        const isCurrent =
                          gradientBlur.direction === preset.direction &&
                          gradientBlur.positionY === preset.positionY;
                        return (
                          <button
                            key={preset.id}
                            onClick={() =>
                              setGradientBlur({
                                ...gradientBlur,
                                direction: preset.direction,
                                blurAmount: preset.blurAmount,
                                positionY: preset.positionY,
                                positionX: preset.positionX,
                                blurSize: preset.blurSize,
                                blurWidth: preset.blurWidth ?? 85,
                              })
                            }
                            className={`p-2 rounded-lg border text-left transition-all ${
                              isCurrent
                                ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500 text-white'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-semibold text-white truncate">
                              {preset.name}
                            </span>
                            <span className="block text-[9px] text-neutral-400 line-clamp-1">
                              {preset.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direction buttons with visual hints */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                      Style & Direction du Flou
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: 'bottom', label: 'Bas (Pied)', desc: 'Texte en bas' },
                        { id: 'top', label: 'Haut (En-tête)', desc: 'Texte en haut' },
                        { id: 'center', label: 'Bandeau Central', desc: 'Bande médiane' },
                        { id: 'tilt-shift', label: 'Tilt-Shift Horiz', desc: 'Centre net' },
                        { id: 'tilt-shift-vertical', label: 'Tilt-Shift Vert', desc: 'Colonne nette' },
                        { id: 'radial', label: 'Vignette Radiale', desc: 'Halo circulaire' },
                        { id: 'box', label: 'Zone Dépolie', desc: 'Boîte sous texte' },
                        { id: 'left', label: 'Vers la Gauche', desc: 'Dégradé latéral' },
                        { id: 'right', label: 'Vers la Droite', desc: 'Dégradé latéral' },
                        { id: 'full', label: 'Flou Intégral', desc: 'Fond complet' },
                      ].map((dir) => {
                        const isSelected = gradientBlur.direction === dir.id;
                        return (
                          <button
                            key={dir.id}
                            onClick={() =>
                              setGradientBlur({ ...gradientBlur, direction: dir.id as any })
                            }
                            className={`p-2 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 text-white'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-semibold">{dir.label}</span>
                            <span className="block text-[9px] text-neutral-400">{dir.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Position Y and Position X */}
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                    <span className="text-[11px] font-semibold text-neutral-300 block">
                      Positionnement & Dimensions de la Zone
                    </span>

                    {/* Position Y Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-400">Position Verticale (Hauteur Y)</span>
                        <span className="font-mono text-cyan-300 font-medium">
                          {gradientBlur.positionY ?? 75}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="1"
                        value={gradientBlur.positionY ?? 75}
                        onChange={(e) =>
                          setGradientBlur({ ...gradientBlur, positionY: parseInt(e.target.value) })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    {/* Position X Slider for radial/box */}
                    {['radial', 'box', 'left', 'right'].includes(gradientBlur.direction) && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-400">Position Horizontale (Centrage X)</span>
                          <span className="font-mono text-cyan-300 font-medium">
                            {gradientBlur.positionX ?? 50}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          step="1"
                          value={gradientBlur.positionX ?? 50}
                          onChange={(e) =>
                            setGradientBlur({ ...gradientBlur, positionX: parseInt(e.target.value) })
                          }
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    )}

                    {/* Blur Spread / Height Dimension */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-400">Envergure / Hauteur du Flou</span>
                        <span className="font-mono text-cyan-300 font-medium">
                          {gradientBlur.blurSize ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={gradientBlur.blurSize ?? 50}
                        onChange={(e) =>
                          setGradientBlur({ ...gradientBlur, blurSize: parseInt(e.target.value) })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    {/* Blur Width Dimension for box or radial */}
                    {['box', 'radial', 'center'].includes(gradientBlur.direction) && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-400">Largeur de la Zone Floue</span>
                          <span className="font-mono text-cyan-300 font-medium">
                            {gradientBlur.blurWidth ?? 85}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="5"
                          value={gradientBlur.blurWidth ?? 85}
                          onChange={(e) =>
                            setGradientBlur({ ...gradientBlur, blurWidth: parseInt(e.target.value) })
                          }
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Blur intensity and opacity sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-400">Rayon de flou</span>
                        <span className="font-mono text-cyan-300 font-semibold">
                          {gradientBlur.blurAmount} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="36"
                        step="2"
                        value={gradientBlur.blurAmount}
                        onChange={(e) =>
                          setGradientBlur({
                            ...gradientBlur,
                            blurAmount: parseInt(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-400">Opacité</span>
                        <span className="font-mono text-neutral-200">
                          {Math.round((gradientBlur.opacity ?? 1.0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={gradientBlur.opacity ?? 1.0}
                        onChange={(e) =>
                          setGradientBlur({
                            ...gradientBlur,
                            opacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 italic">
                  Activez pour ajouter un flou dégradé progressif qui préserve les détails de l'image tout en rendant le texte parfaitement lisible.
                </p>
              )}
            </div>

            {/* SECTION 2: FILTRE DE COULEURS DÉGRADÉES */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <h4 className="text-xs font-semibold text-white">2. Filtre de Couleurs Dégradées</h4>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Voile bicolore artistique (*duotone mood filter*)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colorFilter.enabled}
                    onChange={(e) =>
                      setColorFilter({ ...colorFilter, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {colorFilter.enabled ? (
                <div className="space-y-4 pt-3 border-t border-neutral-800/80">
                  {/* Preset Gradients Grid */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                      Palettes Prédéfinies au Choix
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_FILTER_PRESETS.map((p) => {
                        const isSelected = colorFilter.preset === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() =>
                              setColorFilter({
                                ...colorFilter,
                                preset: p.id,
                                colorStart: p.colorStart,
                                colorEnd: p.colorEnd,
                                angle: p.angle,
                                blendMode: p.blendMode,
                                opacity: p.opacity,
                              })
                            }
                            className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
                              isSelected
                                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className="w-6 h-6 rounded-md shrink-0 border border-white/20 shadow-sm"
                              style={{
                                background: `linear-gradient(${p.angle}deg, ${p.colorStart}, ${p.colorEnd})`,
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-white block truncate">
                                {p.name}
                              </span>
                              <span className="text-[9px] text-neutral-400 block font-mono">
                                {p.blendMode}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {/* Custom Picker button */}
                      <button
                        onClick={() =>
                          setColorFilter({ ...colorFilter, preset: 'custom' })
                        }
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
                          colorFilter.preset === 'custom'
                            ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md shrink-0 border border-white/20 shadow-sm"
                          style={{
                            background: `linear-gradient(${colorFilter.angle}deg, ${colorFilter.colorStart}, ${colorFilter.colorEnd})`,
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block">
                            Personnalisé
                          </span>
                          <span className="text-[9px] text-indigo-400 block">
                            Vos 2 couleurs
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Custom color controls */}
                  {colorFilter.preset === 'custom' && (
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                      <span className="text-[11px] font-semibold text-neutral-300 block">
                        Couleurs sur-mesure
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[10px] text-neutral-400 mb-1">
                            Couleur 1 (Début)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={colorFilter.colorStart}
                              onChange={(e) =>
                                setColorFilter({ ...colorFilter, colorStart: e.target.value })
                              }
                              className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                            />
                            <span className="text-xs font-mono text-neutral-200">
                              {colorFilter.colorStart}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] text-neutral-400 mb-1">
                            Couleur 2 (Fin)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={colorFilter.colorEnd}
                              onChange={(e) =>
                                setColorFilter({ ...colorFilter, colorEnd: e.target.value })
                              }
                              className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                            />
                            <span className="text-xs font-mono text-neutral-200">
                              {colorFilter.colorEnd}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode de Fusion & Angle */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                        Mode de Fusion
                      </label>
                      <select
                        value={colorFilter.blendMode}
                        onChange={(e) =>
                          setColorFilter({
                            ...colorFilter,
                            blendMode: e.target.value as any,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="overlay">Incrustation (Overlay)</option>
                        <option value="soft-light">Lumière douce (Soft-light)</option>
                        <option value="multiply">Produit sombre (Multiply)</option>
                        <option value="screen">Superposition claire (Screen)</option>
                        <option value="color">Couleur pure (Color)</option>
                        <option value="normal">Normal (Opaque)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                        Angle ({colorFilter.angle}°)
                      </label>
                      <select
                        value={colorFilter.angle}
                        onChange={(e) =>
                          setColorFilter({
                            ...colorFilter,
                            angle: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="0">0° (Horizontal G ➔ D)</option>
                        <option value="45">45° (Diagonal)</option>
                        <option value="90">90° (Vertical H ➔ B)</option>
                        <option value="120">120° (Oblique)</option>
                        <option value="135">135° (Diagonal inverse)</option>
                        <option value="180">180° (Vertical B ➔ H)</option>
                        <option value="270">270° (Inversé)</option>
                      </select>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400 font-medium">Opacité du voile</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {Math.round(colorFilter.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={colorFilter.opacity}
                      onChange={(e) =>
                        setColorFilter({
                          ...colorFilter,
                          opacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 italic">
                  Activez pour appliquer une harmonie bicolore stylisée sur l'ensemble de vos photos pour une charte visuelle uniforme.
                </p>
              )}
            </div>

            {/* Quick reset button */}
            {(gradientBlur.enabled || colorFilter.enabled) && (
              <button
                onClick={() => {
                  setGradientBlur({ ...gradientBlur, enabled: false });
                  setColorFilter({ ...colorFilter, enabled: false });
                }}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Désactiver tous les filtres
              </button>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: RATIOS & PLATFORMS */}
        {/* ============================================================== */}
        {activeTab === 'ratios' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Formats & Ratios</h3>
              <p className="text-xs text-neutral-400">
                Adaptez instantanément toutes les images aux dimensions des réseaux
              </p>
            </div>

            <div className="space-y-2.5">
              {ASPECT_RATIOS.map((option) => {
                const isSelected = option.id === aspectRatio.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setAspectRatio(option)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">
                        {option.label}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {option.sublabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {option.platforms.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-neutral-300 bg-neutral-800/80 px-2 py-0.5 rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Image Pan & Zoom Crop for this Ratio */}
            {activeSlide && (
              <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recadrer l'Image (Diapo #{activeSlide.number})</span>
                  </span>
                  <button
                    onClick={() => updateActiveSlide({ imageZoom: 1, imagePanX: 0, imagePanY: 0 })}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Recentrer</span>
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 leading-normal">
                  Lors du changement de format ({aspectRatio.id}), ajustez la zone de la photo à afficher en zoomant ou en glissant l'image :
                </p>

                {/* Zoom */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-400">Zoom / Échelle</span>
                    <span className="font-mono text-indigo-300 font-medium">
                      {Math.round((activeSlide.imageZoom ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={activeSlide.imageZoom ?? 1}
                    onChange={(e) => updateActiveSlide({ imageZoom: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Pan X and Pan Y */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-neutral-400 mb-0.5">Pan X: {activeSlide.imagePanX ?? 0}%</span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={activeSlide.imagePanX ?? 0}
                      onChange={(e) => updateActiveSlide({ imagePanX: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="block text-neutral-400 mb-0.5">Pan Y: {activeSlide.imagePanY ?? 0}%</span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={activeSlide.imagePanY ?? 0}
                      onChange={(e) => updateActiveSlide({ imagePanY: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() => updateActiveSlide({ imagePanY: -35 })}
                    className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                  >
                    Haut
                  </button>
                  <button
                    onClick={() => updateActiveSlide({ imagePanX: 0, imagePanY: 0 })}
                    className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                  >
                    Centre
                  </button>
                  <button
                    onClick={() => updateActiveSlide({ imagePanY: 35 })}
                    className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
                  >
                    Bas
                  </button>
                </div>

                <p className="text-[10px] text-neutral-500 italic">
                  💡 En mode "Aperçu Unique", cliquez sur <strong>Cadrer l'image</strong> pour glisser directement avec la souris ou le doigt.
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <span className="font-semibold text-white">Astuce format :</span>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Le ratio <strong>4:5 (Portrait)</strong> offre jusqu'à 30% de visibilité en plus dans le flux Instagram et LinkedIn par rapport au carré 1:1.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TYPOGRAPHY & TEXT STYLES */}
        {/* ============================================================== */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-400" />
                <span>Typographie, Arabe & Dimensions</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Polices Google Fonts instantanées (FR & Arabe), orientation BiDi et calibrage des dimensions
              </p>
            </div>

            {/* SECTION 1: GOOGLE FONTS INSTANT LOADING & SELECTION */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Polices Google Fonts</span>
                  </span>
                  {/* Small Font-Family Label visible immediately without scrolling */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px]"
                    title={`Police active : ${currentDisplayFontName}`}
                  >
                    <span className="text-neutral-500 font-medium">Active :</span>
                    <span
                      className="font-bold text-white truncate max-w-[130px]"
                      style={{ fontFamily: `'${currentDisplayFontName}', sans-serif` }}
                    >
                      {currentDisplayFontName}
                    </span>
                  </div>
                </div>

                {/* Language Switcher: Français vs Arabe */}
                <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setFontLanguageTab('french')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      fontLanguageTab === 'french'
                        ? 'bg-neutral-800 text-white font-medium shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Français / Latin
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontLanguageTab('arabic')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      fontLanguageTab === 'arabic'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-medium shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    العربية / Arabe
                  </button>
                </div>
              </div>

              {/* VISUAL PREVIEW CARD OF CURRENTLY SELECTED FONT */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  fontLanguageTab === 'arabic'
                    ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-900/80 to-neutral-950 border-emerald-800/60 shadow-sm'
                    : 'bg-gradient-to-br from-indigo-950/40 via-neutral-900/80 to-neutral-950 border-indigo-800/60 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400"></span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Police sélectionnée
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span
                      className={`text-xs font-bold truncate ${
                        fontLanguageTab === 'arabic' ? 'text-emerald-300' : 'text-indigo-300'
                      }`}
                    >
                      {currentDisplayFontName}
                    </span>
                  </div>

                  {/* Dual quick toggle chips showing both Latin and Arabic active fonts */}
                  <div className="flex items-center gap-1 shrink-0 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFontLanguageTab('french')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        fontLanguageTab === 'french'
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                      title={`Police Latine active : ${activeLatinFontName}`}
                    >
                      Latin: <span className="font-semibold">{activeLatinFontName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontLanguageTab('arabic')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        fontLanguageTab === 'arabic'
                          ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                          : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                      title={`Police Arabe active : ${activeArabicFontName}`}
                    >
                      Arabe: <span className="font-semibold">{activeArabicFontName}</span>
                    </button>
                  </div>
                </div>

                {/* Live visual preview box rendered in the selected font */}
                <div
                  className="p-3 rounded-lg bg-neutral-950/90 border border-neutral-800/80 space-y-1.5 shadow-inner"
                  dir={fontLanguageTab === 'arabic' ? 'rtl' : 'ltr'}
                >
                  <p
                    className="text-sm font-semibold text-white leading-snug tracking-wide"
                    style={{ fontFamily: `'${currentDisplayFontName}', sans-serif` }}
                  >
                    {fontLanguageTab === 'arabic'
                      ? (activeSlide?.kicker || 'الوضوح والتركيز يصنعان الفارق دائماً')
                      : (activeSlide?.kicker || 'L\'inspiration transforme la vision en réalité.')}
                  </p>
                  <p
                    className="text-xs text-neutral-300 line-clamp-2 leading-relaxed"
                    style={{ fontFamily: `'${currentDisplayFontName}', sans-serif` }}
                  >
                    {fontLanguageTab === 'arabic'
                      ? (activeSlide?.text || 'العلم في الصغر كالنقش على الحجر، والعمل المستمر سر النجاح والتفوق.')
                      : (activeSlide?.text || 'La constance bat l\'intensité : un travail soigné crée un impact durable.')}
                  </p>
                  <div className="pt-1.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span style={{ fontFamily: `'${currentDisplayFontName}', sans-serif` }}>
                      {fontLanguageTab === 'arabic'
                        ? 'أ ب ت ث ج ح خ · ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩'
                        : 'Aa Bb Cc Dd Ee Ff Gg · 0 1 2 3 4 5 6 7 8 9'}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {fontLanguageTab === 'arabic'
                        ? (typography.customArabicFontFamily ? 'Google Fonts (Perso)' : 'Catalogue Standard')
                        : (typography.customFontFamily ? 'Google Fonts (Perso)' : 'Catalogue Standard')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Search or Custom Google Font input */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={fontLanguageTab === 'arabic' ? 'Ex: Cairo, Amiri, Alexandria...' : 'Ex: Playfair Display, Outfit, Cinzel...'}
                      value={customFontInput}
                      onChange={(e) => setCustomFontInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCustomGoogleFont(customFontInput, fontLanguageTab === 'arabic');
                        }
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!customFontInput.trim() || isLoadingFont}
                    onClick={() => handleApplyCustomGoogleFont(customFontInput, fontLanguageTab === 'arabic')}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    {isLoadingFont ? 'Chargement...' : 'Appliquer'}
                  </button>
                </div>

                {fontLoadSuccess && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{fontLoadSuccess}</span>
                  </div>
                )}
              </div>

              {/* Curated Fonts Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {fontLanguageTab === 'arabic' ? 'Catalogue Google Fonts Arabe' : 'Catalogue Google Fonts Recommandé'}
                </span>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-0.5">
                  {(fontLanguageTab === 'arabic' ? CURATED_ARABIC_FONTS : CURATED_FRENCH_FONTS).map((f) => {
                    const isSelected = fontLanguageTab === 'arabic'
                      ? (typography.customArabicFontFamily === f.name || (!typography.customArabicFontFamily && typography.arabicFont === f.name.toLowerCase().replace(/\s+/g, '-')))
                      : (typography.customFontFamily === f.name || (!typography.customFontFamily && typography.fontStyle === f.name.toLowerCase().replace(/\s+/g, '-')));

                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={async () => {
                          await handleApplyCustomGoogleFont(f.name, fontLanguageTab === 'arabic');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? fontLanguageTab === 'arabic'
                              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-white'
                              : 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white truncate">{f.name}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                          )}
                        </div>
                        <p
                          className="text-xs text-neutral-300 mt-1 truncate"
                          style={{ fontFamily: `'${f.name}', sans-serif` }}
                        >
                          {fontLanguageTab === 'arabic' ? (f.sampleTextAr || 'العربية جميلة') : (f.sampleTextFr || 'Aperçu Élégant')}
                        </p>
                        <span className="text-[9px] text-neutral-500 line-clamp-1 mt-0.5">
                          {f.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 2: TEXT DIRECTION & ARABIC NUMBER ORIENTATION */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>Direction du Texte & Nombres</span>
              </span>

              {/* Text Direction: Auto / RTL / LTR */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Orientation du texte
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'auto', label: 'Auto (Détection)', desc: 'Détecte l\'arabe' },
                    { id: 'rtl', label: 'RTL (Arabe)', desc: 'Droite à gauche' },
                    { id: 'ltr', label: 'LTR (Français)', desc: 'Gauche à droite' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setTypography({ ...typography, direction: d.id as any })}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        (typography.direction || 'auto') === d.id
                          ? 'bg-neutral-800 border-indigo-500 text-white font-medium'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs font-semibold">{d.label}</span>
                      <span className="block text-[9px] text-neutral-500">{d.desc}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyDirectionToAll(typography.direction || 'auto')}
                  className="w-full mt-2 py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Appliquer cette orientation (RTL / LTR / Auto) à l'ensemble des images"
                >
                  <Copy className="w-3 h-3 text-indigo-400" />
                  <span>Appliquer l&apos;orientation ({typography.direction === 'rtl' ? 'RTL Arabe' : typography.direction === 'ltr' ? 'LTR Français' : 'Auto'}) à tout</span>
                </button>
              </div>

              {/* Number Format: Western (1, 2, 3 ordered LTR) vs Eastern Arabic (١، ٢، ٣) */}
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-neutral-300">Format des Chiffres</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {typography.easternNumerals ? '٠١٢٣٤٥٦٧٨٩' : '1 2 3 4 5... (LTR)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTypography({ ...typography, easternNumerals: false })}
                    className={`py-2 px-3 rounded-lg border text-left transition-colors ${
                      !typography.easternNumerals
                        ? 'bg-neutral-800 border-indigo-500 text-white font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-medium">Chiffres Occidentaux</span>
                    <span className="text-[10px] text-neutral-400">1, 2, 3 (Ordre LTR garanti)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypography({ ...typography, easternNumerals: true })}
                    className={`py-2 px-3 rounded-lg border text-left transition-colors ${
                      typography.easternNumerals
                        ? 'bg-neutral-800 border-indigo-500 text-white font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-medium">Chiffres Arabes Orientaux</span>
                    <span className="text-[10px] text-neutral-400">١، ٢، ٣، ٤...</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: TEXT DIMENSIONS & SCALING (Phrase, Kicker, Subtitle, Number, Line Height) */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dimensions des Textes (jusqu'à 1000%)</span>
              </span>

              {/* 1. Main Phrase Size Slider & Quick Presets */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-300 font-medium">Dimension Phrase Principale</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={Math.round(typography.fontSize * 100)}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                        setTypography({ ...typography, fontSize: val });
                      }}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-indigo-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={typography.fontSize}
                  onChange={(e) =>
                    setTypography({ ...typography, fontSize: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1 mt-1 text-[10px] overflow-x-auto pb-0.5">
                  {[
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.0 },
                    { label: '150%', val: 1.5 },
                    { label: '250%', val: 2.5 },
                    { label: '500%', val: 5.0 },
                    { label: '1000%', val: 10.0 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, fontSize: p.val })}
                      className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Kicker Title Size */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-300">Dimension Titre (Kicker)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={Math.round((typography.kickerSize ?? 1.0) * 100)}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                        setTypography({ ...typography, kickerSize: val });
                      }}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-neutral-200"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={typography.kickerSize ?? 1.0}
                  onChange={(e) =>
                    setTypography({ ...typography, kickerSize: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* 3. Subtitle Size */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-300">Dimension Sous-titre / Signature</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={Math.round((typography.subtitleSize ?? 1.0) * 100)}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                        setTypography({ ...typography, subtitleSize: val });
                      }}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-neutral-200"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={typography.subtitleSize ?? 1.0}
                  onChange={(e) =>
                    setTypography({ ...typography, subtitleSize: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* 4. Slide Number Size (Badge Compteur 01 / 06) */}
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typography.showSlideNumber}
                      onChange={(e) =>
                        setTypography({ ...typography, showSlideNumber: e.target.checked })
                      }
                      className="rounded bg-neutral-900 border-neutral-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-neutral-200 font-medium">Numéros d'Images (Badge 01 / 06)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={Math.round((typography.slideNumberSize ?? 1.0) * 100)}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                        setTypography({ ...typography, slideNumberSize: val });
                      }}
                      className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-xs text-right font-mono text-emerald-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={typography.slideNumberSize ?? 1.0}
                  onChange={(e) =>
                    setTypography({ ...typography, slideNumberSize: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />

                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { label: '50%', val: 0.5 },
                    { label: '100%', val: 1.0 },
                    { label: '150%', val: 1.5 },
                    { label: '250%', val: 2.5 },
                    { label: '500%', val: 5.0 },
                    { label: '1000%', val: 10.0 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, slideNumberSize: p.val })}
                      className="flex-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Line Height / Interligne */}
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-200 font-medium">Interligne (Hauteur de ligne)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={typography.lineHeight ?? 1.35}
                      onChange={(e) => {
                        const val = Math.max(0.8, Math.min(2.5, parseFloat(e.target.value) || 1.35));
                        setTypography({ ...typography, lineHeight: val });
                      }}
                      className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-indigo-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={typography.lineHeight ?? 1.35}
                  onChange={(e) =>
                    setTypography({ ...typography, lineHeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { label: 'Serré (1.1x)', val: 1.1 },
                    { label: 'Normal (1.35x)', val: 1.35 },
                    { label: 'Aéré (1.6x)', val: 1.6 },
                    { label: 'Large (2.0x)', val: 2.0 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, lineHeight: p.val })}
                      className="flex-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5b. Espacement Titre ↔ Texte */}
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-200 font-medium">Espacement Titre ↔ Phrase</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={typography.titleSpacing ?? 1.0}
                      onChange={(e) => {
                        const val = Math.max(0.2, Math.min(3.0, parseFloat(e.target.value) || 1.0));
                        setTypography({ ...typography, titleSpacing: val });
                      }}
                      className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-indigo-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={typography.titleSpacing ?? 1.0}
                  onChange={(e) =>
                    setTypography({ ...typography, titleSpacing: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { label: 'Compact (0.5x)', val: 0.5 },
                    { label: 'Standard (1.0x)', val: 1.0 },
                    { label: 'Espacé (1.8x)', val: 1.8 },
                    { label: 'Grand (2.5x)', val: 2.5 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, titleSpacing: p.val })}
                      className="flex-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5c. Espacement Texte ↔ Sous-titre */}
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-200 font-medium">Espacement Phrase ↔ Sous-titre</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={typography.subtitleSpacing ?? 1.0}
                      onChange={(e) => {
                        const val = Math.max(0.2, Math.min(3.0, parseFloat(e.target.value) || 1.0));
                        setTypography({ ...typography, subtitleSpacing: val });
                      }}
                      className="w-16 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-indigo-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={typography.subtitleSpacing ?? 1.0}
                  onChange={(e) =>
                    setTypography({ ...typography, subtitleSpacing: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { label: 'Compact (0.5x)', val: 0.5 },
                    { label: 'Standard (1.0x)', val: 1.0 },
                    { label: 'Espacé (1.8x)', val: 1.8 },
                    { label: 'Grand (2.5x)', val: 2.5 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, subtitleSpacing: p.val })}
                      className="flex-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Text Block Max Width (avec renvoi à la ligne automatique garanti) */}
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-200 font-medium block">Largeur Maximale du Bloc Texte</span>
                    <span className="text-[10px] text-indigo-300">Renvoi à la ligne automatique (Titre, Phrase, Sous-titre)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="30"
                      max="100"
                      value={typography.textWidth ?? 88}
                      onChange={(e) => {
                        const val = Math.max(30, Math.min(100, parseInt(e.target.value) || 88));
                        setTypography({ ...typography, textWidth: val });
                      }}
                      className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-right font-mono text-indigo-300 font-bold"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="2"
                  value={typography.textWidth ?? 88}
                  onChange={(e) =>
                    setTypography({ ...typography, textWidth: parseInt(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { label: 'Étroit (65%)', val: 65 },
                    { label: 'Normal (78%)', val: 78 },
                    { label: 'Recommandé (88%)', val: 88 },
                    { label: 'Plein (96%)', val: 96 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypography({ ...typography, textWidth: p.val })}
                      className="flex-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  ✓ S'applique pixel-par-pixel dans l'aperçu web et dans les images haute résolution exportées (JPG/PNG/ZIP).
                </p>
              </div>

              {/* Quick apply all button */}
              <div className="pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() =>
                    handleApplySizesToAll(
                      typography.fontSize,
                      typography.kickerSize,
                      typography.subtitleSize,
                      typography.slideNumberSize
                    )
                  }
                  className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Appliquer ces dimensions à toutes les ({slides.length}) images</span>
                </button>
              </div>
            </div>

            {/* SECTION 4: PLACEMENT & ALIGNMENT */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3.5">
              <span className="text-xs font-semibold text-white block">
                Position & Alignement
              </span>

              {/* Vertical Position */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Position Verticale
                </label>
                <div className="grid grid-cols-4 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                  {(['top', 'center', 'bottom', 'free'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setTypography({ ...typography, position: pos })}
                      className={`py-1.5 rounded transition-colors ${
                        typography.position === pos
                          ? 'bg-neutral-800 text-white shadow-sm font-medium'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pos === 'top' ? 'Haut' : pos === 'center' ? 'Milieu' : pos === 'bottom' ? 'Bas' : 'Libre'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free drag & drop position sliders */}
              {typography.position === 'free' && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-medium">Position Libre (X & Y)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTypography((prev) => ({ ...prev, freePositionX: 50, freePositionY: 75 }))
                      }
                      className="text-[10px] text-neutral-400 hover:text-white bg-neutral-800 px-2 py-0.5 rounded"
                    >
                      Recentrer
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] text-neutral-400">Position X: {typography.freePositionX ?? 50}%</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={typography.freePositionX ?? 50}
                        onChange={(e) =>
                          setTypography({ ...typography, freePositionX: parseInt(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400">Position Y: {typography.freePositionY ?? 75}%</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={typography.freePositionY ?? 75}
                        onChange={(e) =>
                          setTypography({ ...typography, freePositionY: parseInt(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Text Alignment */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Alignement du Texte
                </label>
                <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  {[
                    { id: 'left', icon: AlignLeft, label: 'Gauche' },
                    { id: 'center', icon: AlignCenter, label: 'Centré' },
                    { id: 'right', icon: AlignRight, label: 'Droite' },
                  ].map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() =>
                          setTypography({ ...typography, align: al.id as any, phraseAlign: al.id as any })
                        }
                        className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs rounded transition-colors ${
                          (typography.phraseAlign || typography.align) === al.id
                            ? 'bg-neutral-800 text-white shadow-sm font-medium'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{al.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10.5px] text-neutral-400 leading-normal">
                  💡 <span className="text-neutral-300 font-medium">Bilingue intelligent :</span> Pour l&apos;arabe (RTL), l&apos;alignement de phrase s&apos;adapte automatiquement (commence à droite, l&apos;inverse du français). « Gauche » correspond au début de phrase en français, et « Droite » au début de phrase en arabe.
                </p>
              </div>

              {/* Actions de propagation et réinitialisation globale */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyAllFormattingToAllSlides(
                      (activeSlide.customAlign || (typography.phraseAlign && typography.phraseAlign !== 'inherit' ? typography.phraseAlign : typography.align)) as TextAlign,
                      activeSlide.customDirection || typography.direction || 'auto',
                      activeSlide.customKickerAlign || typography.kickerAlign || 'inherit',
                      activeSlide.customTextX ?? typography.freePositionX,
                      activeSlide.customTextY ?? typography.freePositionY,
                      activeSlide.customTextScale ?? typography.fontSize,
                      activeSlide.customKickerScale ?? typography.kickerSize,
                      activeSlide.customSubtitleScale ?? typography.subtitleSize
                    )
                  }
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  title="Propager l'orientation RTL/LTR, l'alignement, la position et les dimensions sur toutes les images"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Appliquer à TOUT (Orientation RTL/LTR, Alignement, Position & Tailles)</span>
                </button>

                {/* Quick individual propagate buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyAlignToAll(
                        (activeSlide.customAlign || (typography.phraseAlign && typography.phraseAlign !== 'inherit' ? typography.phraseAlign : typography.align)) as TextAlign
                      )
                    }
                    className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                    title="Appliquer uniquement l'alignement actuel à toutes les images"
                  >
                    Alignement seul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDirectionToAll(activeSlide.customDirection || typography.direction || 'auto')}
                    className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                    title="Appliquer uniquement l'orientation RTL/LTR actuelle à toutes les images"
                  >
                    Orientation RTL/LTR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPositionToAll()}
                    className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                    title="Appliquer uniquement la position X/Y à toutes les images"
                  >
                    Position seule (X/Y)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySizesToAll()}
                    className="py-1 px-2 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors text-center truncate"
                    title="Appliquer uniquement les tailles des textes à toutes les images"
                  >
                    Tailles seules
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCurrentSlideFormatting}
                    className="flex-1 py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-neutral-400" />
                    <span>Réinitialiser cette image</span>
                  </button>

                  {!confirmResetAll ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResetAll(true)}
                      className="py-1.5 px-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 hover:border-rose-700/60 text-rose-300 hover:text-rose-200 rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-400" />
                      <span>Réinitialiser tout</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleResetAllSlidesFormatting}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 shadow animate-pulse"
                      >
                        <span>Confirmer ?</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetAll(false)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10.5px]"
                      >
                        Non
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5: COULEURS DE LA TYPOGRAPHIE */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Couleurs de la Typographie</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (setSlides) {
                      setSlides((prev) =>
                        prev.map((s) => ({
                          ...s,
                          customKickerColor: typography.accentColor,
                          customTextColor: typography.textColor,
                          customSubtitleColor: typography.subtitleColor,
                        }))
                      );
                    }
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800"
                  title="Synchroniser ces couleurs sur toutes les diapos du carrousel"
                >
                  Appliquer à tout le lot
                </button>
              </div>

              {/* Quick Palettes */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Harmonies de Couleurs Prédéfinies
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      name: 'Épuré & Indigo',
                      kicker: '#818cf8',
                      text: '#ffffff',
                      subtitle: '#d1d5db',
                    },
                    {
                      name: 'Or Solaire & Luxe',
                      kicker: '#f59e0b',
                      text: '#fef3c7',
                      subtitle: '#fbbf24',
                    },
                    {
                      name: 'Émeraude & Ivoire',
                      kicker: '#34d399',
                      text: '#f8fafc',
                      subtitle: '#a7f3d0',
                    },
                    {
                      name: 'Rose & Glamour',
                      kicker: '#f472b6',
                      text: '#ffffff',
                      subtitle: '#fbcfe8',
                    },
                    {
                      name: 'Cyan Cyberpunk',
                      kicker: '#22d3ee',
                      text: '#ffffff',
                      subtitle: '#a5f3fc',
                    },
                    {
                      name: 'Monochrome Chaud',
                      kicker: '#fcd34d',
                      text: '#ffffff',
                      subtitle: '#94a3b8',
                    },
                  ].map((theme) => {
                    const isSelected =
                      typography.accentColor === theme.kicker &&
                      typography.textColor === theme.text &&
                      typography.subtitleColor === theme.subtitle;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => {
                          setTypography((prev) => ({
                            ...prev,
                            accentColor: theme.kicker,
                            textColor: theme.text,
                            subtitleColor: theme.subtitle,
                          }));
                          if (setSlides) {
                            setSlides((prev) =>
                              prev.map((s) => ({
                                ...s,
                                customKickerColor: theme.kicker,
                                customTextColor: theme.text,
                                customSubtitleColor: theme.subtitle,
                              }))
                            );
                          }
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-[11px] font-medium truncate">{theme.name}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.kicker }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.text }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.subtitle }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Color Pickers (Titre, Phrase, Sous-titre) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Titre (Kicker) */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">1. Titre (Kicker)</span>
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: typography.accentColor || '#6366f1' }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={getSafeHex(typography.accentColor, '#6366f1')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, accentColor: val }));
                        updateActiveSlide({ customKickerColor: val });
                      }}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={typography.accentColor || '#6366f1'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, accentColor: val }));
                        updateActiveSlide({ customKickerColor: val });
                      }}
                      className="w-full px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-200 uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                    {['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#ffffff', '#f43f5e'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTypography((prev) => ({ ...prev, accentColor: c }));
                          updateActiveSlide({ customKickerColor: c });
                        }}
                        className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c }}
                        title={`Titre: ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Phrase Principale */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">2. Phrase Principale</span>
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: typography.textColor || '#ffffff' }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={getSafeHex(typography.textColor, '#ffffff')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, textColor: val }));
                        updateActiveSlide({ customTextColor: val });
                      }}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={typography.textColor || '#ffffff'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, textColor: val }));
                        updateActiveSlide({ customTextColor: val });
                      }}
                      className="w-full px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-200 uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                    {['#ffffff', '#fef3c7', '#fef08a', '#bae6fd', '#a7f3d0', '#fed7aa', '#0a0a0a'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTypography((prev) => ({ ...prev, textColor: c }));
                          updateActiveSlide({ customTextColor: c });
                        }}
                        className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c }}
                        title={`Phrase: ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* 3. Sous-titre / Signature */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">3. Sous-titre / Auteur</span>
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: typography.subtitleColor || '#d1d5db' }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={getSafeHex(typography.subtitleColor, '#d1d5db')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, subtitleColor: val }));
                        updateActiveSlide({ customSubtitleColor: val });
                      }}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={typography.subtitleColor || '#d1d5db'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypography((prev) => ({ ...prev, subtitleColor: val }));
                        updateActiveSlide({ customSubtitleColor: val });
                      }}
                      className="w-full px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-200 uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                    {['#d1d5db', '#ffffff', '#fbbf24', '#818cf8', '#34d399', '#f472b6', '#38bdf8'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTypography((prev) => ({ ...prev, subtitleColor: c }));
                          updateActiveSlide({ customSubtitleColor: c });
                        }}
                        className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c }}
                        title={`Sous-titre: ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: BOX STYLE / SCRIM */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <label className="block text-xs font-semibold text-white mb-1">
                Style d'Arrière-plan du Texte
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'scrim', label: 'Dégradé Cinématographique (Recommandé)', desc: 'Dégradé subtil sans coupure' },
                  { id: 'frosted', label: 'Carte en Verre Dépoli', desc: 'Effet glassmorphism moderne' },
                  { id: 'minimal-shadow', label: 'Ombre Portée Épurée', desc: 'Texte flottant lisible' },
                  { id: 'solid-card', label: 'Cadre Minimaliste Bordé', desc: 'Boîte structurée chic' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setTypography({ ...typography, boxStyle: b.id as any })}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      typography.boxStyle === b.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-medium text-white">{b.label}</p>
                    <p className="text-[10px] text-neutral-400">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 6: META ELEMENTS TOGGLES */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-neutral-300">Afficher le titre Kicker</span>
                <input
                  type="checkbox"
                  checked={typography.showKicker}
                  onChange={(e) =>
                    setTypography({ ...typography, showKicker: e.target.checked })
                  }
                  className="rounded bg-neutral-900 border-neutral-700 text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-neutral-300">Afficher la signature / Sous-titre</span>
                <input
                  type="checkbox"
                  checked={typography.showSubtitle}
                  onChange={(e) =>
                    setTypography({ ...typography, showSubtitle: e.target.checked })
                  }
                  className="rounded bg-neutral-900 border-neutral-700 text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-neutral-300">Afficher le numéro de diapo (01/06)</span>
                <input
                  type="checkbox"
                  checked={typography.showSlideNumber}
                  onChange={(e) =>
                    setTypography({ ...typography, showSlideNumber: e.target.checked })
                  }
                  className="rounded bg-neutral-900 border-neutral-700 text-indigo-600 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: LOGO & BRANDING */}
        {/* ============================================================== */}
        {activeTab === 'branding' && (
          <div className="space-y-5">
            {/* Sub-tabs switcher between Brand Logo and Watermark */}
            <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 gap-1">
              <button
                onClick={() => setBrandingSubTab('logo')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  brandingSubTab === 'logo'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Logo de Marque</span>
              </button>
              <button
                onClick={() => setBrandingSubTab('watermark')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors relative ${
                  brandingSubTab === 'watermark'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Stamp className="w-3.5 h-3.5 text-amber-400" />
                <span>Filigrane</span>
                {watermark.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* -------------------------------------------------------- */}
            {/* SUB-PANEL 1: LOGO DE MARQUE */}
            {/* -------------------------------------------------------- */}
            {brandingSubTab === 'logo' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Logo de Marque</h3>
                    <p className="text-xs text-neutral-400">
                      Incrustez automatiquement votre logo prédéfini ou personnalisé
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logo.enabled}
                      onChange={(e) => setLogo({ ...logo, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {logo.enabled && (
                  <div className="space-y-4">
                    {/* Logo Type Selector */}
                    <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                      <button
                        onClick={() => setLogo({ ...logo, type: 'predefined' })}
                        className={`py-1.5 text-xs font-medium rounded transition-colors ${
                          logo.type === 'predefined'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Logo Prédéfini
                      </button>
                      <button
                        onClick={() => setLogo({ ...logo, type: 'custom' })}
                        className={`py-1.5 text-xs font-medium rounded transition-colors ${
                          logo.type === 'custom'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Téléverser Fichier
                      </button>
                    </div>

                    {/* Predefined Logo Models */}
                    {logo.type === 'predefined' ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-neutral-300">
                          Modèle de Logo Prédéfini
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {PREDEFINED_LOGOS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() =>
                                setLogo({
                                  ...logo,
                                  predefinedId: item.id,
                                  brandText: logo.brandText || item.defaultText,
                                  brandHandle: logo.brandHandle || item.defaultHandle,
                                })
                              }
                              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                                logo.predefinedId === item.id
                                  ? 'bg-indigo-950/40 border-indigo-500 text-white'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span className="font-semibold text-white block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {item.defaultText}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 text-center space-y-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        {logo.customUrl ? (
                          <div className="space-y-2">
                            <img
                              src={logo.customUrl}
                              alt="Logo personnalisé"
                              className="h-12 mx-auto object-contain bg-white/10 p-1.5 rounded-lg"
                            />
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => logoInputRef.current?.click()}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                              >
                                Remplacer le fichier
                              </button>
                              <span className="text-neutral-600">·</span>
                              <button
                                onClick={() => setLogo({ ...logo, customUrl: '' })}
                                className="text-xs text-rose-400 hover:text-rose-300"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-neutral-300">
                              Logo PNG ou SVG transparent
                            </p>
                            <button
                              onClick={() => logoInputRef.current?.click()}
                              className="mt-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Sélectionner un fichier
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Brand Name & Handle */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                          Nom de la Marque
                        </label>
                        <input
                          type="text"
                          value={logo.brandText}
                          onChange={(e) => setLogo({ ...logo, brandText: e.target.value })}
                          placeholder="Ex: AUTOPOST STUDIO"
                          className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                          Pseudo / Handle Réseau
                        </label>
                        <input
                          type="text"
                          value={logo.brandHandle || ''}
                          onChange={(e) => setLogo({ ...logo, brandHandle: e.target.value })}
                          placeholder="Ex: @moncompte"
                          className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* 1. Redimensionnement précis & Échelle Ultra (Option A) */}
                    <div className="space-y-3 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Taille & Échelle Ultra</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                            Option A
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                              const next = Math.max(0.2, Number((cur - 0.1).toFixed(2)));
                              setLogo({ ...logo, scale: next, size: 'custom' });
                            }}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Réduire de 10%"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 focus-within:border-indigo-500">
                            <input
                              type="number"
                              min="20"
                              max="800"
                              step="5"
                              value={Math.round(
                                (logo.scale ??
                                  (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0)) *
                                  100
                              )}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  const clamped = Math.max(0.2, Math.min(8.0, val / 100));
                                  setLogo({ ...logo, scale: clamped, size: 'custom' });
                                }
                              }}
                              className="w-10 text-right bg-transparent text-xs font-mono font-bold text-indigo-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-neutral-400 font-mono ml-0.5">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                              const next = Math.min(8.0, Number((cur + 0.1).toFixed(2)));
                              setLogo({ ...logo, scale: next, size: 'custom' });
                            }}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Agrandir de 10%"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Range slider up to 8.0 (800%) */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0.2"
                          max="8.0"
                          step="0.05"
                          value={
                            logo.scale ??
                            (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0)
                          }
                          onChange={(e) =>
                            setLogo({ ...logo, scale: parseFloat(e.target.value), size: 'custom' })
                          }
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span>20% (Mini)</span>
                          <span>100% (Standard)</span>
                          <span>400% (Grand)</span>
                          <span>800% (Géant)</span>
                        </div>
                      </div>

                      {/* Quick Scale Presets (Option A) */}
                      <div>
                        <span className="text-[10px] text-neutral-400 font-medium block mb-1.5">
                          Préréglages d'échelle rapides :
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: '50%', scale: 0.5, size: 'small' as const },
                            { label: '75%', scale: 0.75, size: 'small' as const },
                            { label: '100%', scale: 1.0, size: 'medium' as const },
                            { label: '150%', scale: 1.5, size: 'large' as const },
                            { label: '250%', scale: 2.5, size: 'large' as const },
                            { label: '400%', scale: 4.0, size: 'large' as const },
                            { label: '600%', scale: 6.0, size: 'large' as const },
                            { label: '800%', scale: 8.0, size: 'large' as const },
                          ].map((btn) => {
                            const currentScale = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                            const isSelected = Math.abs(currentScale - btn.scale) < 0.03;
                            return (
                              <button
                                key={btn.label}
                                onClick={() =>
                                  setLogo({ ...logo, scale: btn.scale, size: btn.size })
                                }
                                className={`py-1 text-[11px] font-mono rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-sm'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                                }`}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Option A Layout Modes */}
                      <div className="pt-2 border-t border-neutral-800/80">
                        <span className="text-[10px] text-neutral-400 font-medium block mb-1.5">
                          Styles d'impact visuel (Option A) :
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setLogo({
                                ...logo,
                                scale: 1.0,
                                opacity: 1.0,
                                position: 'top-left',
                                size: 'medium',
                              })
                            }
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60 text-left transition-all"
                          >
                            <span className="text-[11px] font-semibold text-neutral-200 block">
                              1. Standard (100%)
                            </span>
                            <span className="text-[9.5px] text-neutral-400 block">
                              Coin supérieur discret
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setLogo({
                                ...logo,
                                scale: 2.2,
                                opacity: 1.0,
                                size: 'large',
                              })
                            }
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60 text-left transition-all"
                          >
                            <span className="text-[11px] font-semibold text-indigo-300 block">
                              2. Grand Emblème (220%)
                            </span>
                            <span className="text-[9.5px] text-neutral-400 block">
                              Signature de marque nette
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setLogo({
                                ...logo,
                                scale: 3.8,
                                opacity: 1.0,
                                position: 'center',
                                size: 'custom',
                              })
                            }
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60 text-left transition-all"
                          >
                            <span className="text-[11px] font-semibold text-amber-300 block">
                              3. Hero Centré (380%)
                            </span>
                            <span className="text-[9.5px] text-neutral-400 block">
                              Impact central maximal
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setLogo({
                                ...logo,
                                scale: 6.5,
                                opacity: 0.16,
                                position: 'center',
                                size: 'custom',
                              })
                            }
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60 text-left transition-all"
                          >
                            <span className="text-[11px] font-semibold text-cyan-300 block">
                              4. Watermark Géant (650%)
                            </span>
                            <span className="text-[9.5px] text-neutral-400 block">
                              Fond tramé stylisé subtil
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Positionnement Précis: 9-Anchor Grid vs Custom X/Y */}
                    <div className="space-y-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                          <Grid3X3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Positionnement Précis</span>
                        </span>
                        <button
                          onClick={() =>
                            setLogo({
                              ...logo,
                              position: logo.position === 'custom' ? 'top-left' : 'custom',
                              customX: logo.customX ?? 10,
                              customY: logo.customY ?? 8,
                            })
                          }
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            logo.position === 'custom'
                              ? 'bg-indigo-600 text-white'
                              : 'text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800'
                          }`}
                        >
                          {logo.position === 'custom' ? 'Mode Libre Actif' : 'Coordonnées Libres'}
                        </button>
                      </div>

                      {logo.position === 'custom' ? (
                        <div className="space-y-2.5 pt-1">
                          <div>
                            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                              <span>Position Horizontale (X)</span>
                              <span className="font-mono text-white font-semibold">
                                {Math.round(logo.customX ?? 10)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={logo.customX ?? 10}
                              onChange={(e) =>
                                setLogo({ ...logo, customX: parseFloat(e.target.value) })
                              }
                              className="w-full accent-indigo-500"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                              <span>Position Verticale (Y)</span>
                              <span className="font-mono text-white font-semibold">
                                {Math.round(logo.customY ?? 8)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={logo.customY ?? 8}
                              onChange={(e) =>
                                setLogo({ ...logo, customY: parseFloat(e.target.value) })
                              }
                              className="w-full accent-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[11px] text-neutral-400">
                            Grille d'ancrage (9 points cardinaux)
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'top-left', label: 'Haut Gauche', icon: '↖' },
                              { id: 'top-center', label: 'Haut Centre', icon: '↑' },
                              { id: 'top-right', label: 'Haut Droite', icon: '↗' },
                              { id: 'center-left', label: 'Milieu Gauche', icon: '←' },
                              { id: 'center', label: 'Centre', icon: '•' },
                              { id: 'center-right', label: 'Milieu Droite', icon: '→' },
                              { id: 'bottom-left', label: 'Bas Gauche', icon: '↙' },
                              { id: 'bottom-center', label: 'Bas Centre', icon: '↓' },
                              { id: 'bottom-right', label: 'Bas Droite', icon: '↘' },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                onClick={() => setLogo({ ...logo, position: pos.id as any })}
                                className={`py-2 px-1 text-center rounded border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                                  logo.position === pos.id
                                    ? 'bg-neutral-800 border-indigo-500 text-white shadow-sm'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                <span className="text-xs font-mono font-bold leading-none">
                                  {pos.icon}
                                </span>
                                <span className="text-[10px] leading-tight truncate">
                                  {pos.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Marge depuis les bords */}
                      {logo.position !== 'custom' && (
                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                            <span>Marge des bords</span>
                            <span className="font-mono text-white font-semibold">
                              {logo.margin ?? 6}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={logo.margin ?? 6}
                            onChange={(e) =>
                              setLogo({ ...logo, margin: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      )}

                      {/* Rotation du Logo */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-400 mb-1">
                          <span className="flex items-center gap-1">
                            <RotateCw className="w-3 h-3 text-indigo-400" />
                            <span>Rotation</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-semibold">
                              {logo.rotation ?? 0}°
                            </span>
                            {logo.rotation !== 0 && (
                              <button
                                onClick={() => setLogo({ ...logo, rotation: 0 })}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300"
                              >
                                Reset 0°
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="1"
                          value={logo.rotation ?? 0}
                          onChange={(e) =>
                            setLogo({ ...logo, rotation: parseInt(e.target.value, 10) })
                          }
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>

                    {/* 3. Opacité du Logo */}
                    <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-200">
                          Opacité du Logo
                        </span>
                        <span className="font-mono text-indigo-400 font-bold text-[11px]">
                          {Math.round(logo.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={logo.opacity}
                        onChange={(e) =>
                          setLogo({ ...logo, opacity: parseFloat(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    {/* 4. Couleurs: Inversion et Unification */}
                    <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                      <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Couleurs & Inversion</span>
                      </span>

                      {/* Invert Color Toggle */}
                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <div className="flex items-center gap-2">
                          <Contrast className="w-4 h-4 text-neutral-400" />
                          <div>
                            <span className="text-xs text-white font-medium block">
                              Inverser les Couleurs
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Bascule Blanc / Noir pour contraster avec le fond
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(logo.invertColor)}
                          onChange={(e) => setLogo({ ...logo, invertColor: e.target.checked })}
                          className="w-4 h-4 accent-indigo-600 rounded bg-neutral-950 border-neutral-700"
                        />
                      </label>

                      {/* Unify Color Toggle */}
                      <div className="pt-2 border-t border-neutral-800 space-y-2.5">
                        <label className="flex items-center justify-between cursor-pointer py-1">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-indigo-400" />
                            <div>
                              <span className="text-xs text-white font-medium block">
                                Unifier la Couleur (Monochrome)
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                Applique une teinte unie sur l'ensemble du logo
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(logo.unifyColor)}
                            onChange={(e) =>
                              setLogo({
                                ...logo,
                                unifyColor: e.target.checked,
                                unifiedColor: logo.unifiedColor || '#ffffff',
                              })
                            }
                            className="w-4 h-4 accent-indigo-600 rounded bg-neutral-950 border-neutral-700"
                          />
                        </label>

                        {/* Swatches & Color Picker if Unify is active */}
                        {logo.unifyColor && (
                          <div className="space-y-2 pt-1 pl-1">
                            <span className="text-[11px] text-neutral-400 block">
                              Teinte unifiée :
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { color: '#ffffff', name: 'Blanc' },
                                { color: '#000000', name: 'Noir' },
                                { color: '#f59e0b', name: 'Or' },
                                { color: '#6366f1', name: 'Indigo' },
                                { color: '#10b981', name: 'Émeraude' },
                                { color: '#f43f5e', name: 'Rose' },
                                { color: '#06b6d4', name: 'Cyan' },
                                { color: '#94a3b8', name: 'Argent' },
                              ].map((c) => (
                                <button
                                  key={c.color}
                                  title={c.name}
                                  onClick={() => setLogo({ ...logo, unifiedColor: c.color })}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    logo.unifiedColor === c.color
                                      ? 'border-indigo-400 scale-110 shadow-md ring-2 ring-indigo-500/50'
                                      : 'border-white/20 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c.color }}
                                />
                              ))}

                              {/* Custom Hex Color Picker */}
                              <div className="flex items-center gap-1.5 ml-auto">
                                <input
                                  type="color"
                                  value={logo.unifiedColor || '#ffffff'}
                                  onChange={(e) =>
                                    setLogo({ ...logo, unifiedColor: e.target.value })
                                  }
                                  className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                                />
                                <span className="font-mono text-[10px] text-neutral-400 uppercase">
                                  {logo.unifiedColor || '#ffffff'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Reset to Default Logo */}
                    <button
                      onClick={() => setLogo(INITIAL_LOGO)}
                      className="w-full py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les paramètres du logo</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* SUB-PANEL 2: CRÉATION DE FILIGRANE (WATERMARK) */}
            {/* -------------------------------------------------------- */}
            {brandingSubTab === 'watermark' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Filigrane (Watermark)</h3>
                    <p className="text-xs text-neutral-400">
                      Protégez vos visuels avec un filigrane unique ou en motif répété
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watermark.enabled}
                      onChange={(e) => setWatermark({ ...watermark, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {watermark.enabled && (
                  <div className="space-y-4">
                    {/* Quick Presets for Watermarks */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Modèles Prédéfinis de Filigrane
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {WATERMARK_PRESETS.map((p) => {
                          const isSelected =
                            watermark.style === p.style &&
                            watermark.text === p.text &&
                            watermark.position === p.position;
                          return (
                            <button
                              key={p.id}
                              onClick={() =>
                                setWatermark({
                                  ...watermark,
                                  enabled: true,
                                  text: p.text,
                                  style: p.style,
                                  position: p.position,
                                  scale: p.scale,
                                  opacity: p.opacity,
                                  rotation: p.rotation,
                                  color: p.color,
                                  gap: p.gap,
                                  showBorder: p.showBorder,
                                })
                              }
                              className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-500 text-white'
                                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-white block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {p.desc}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400 shrink-0">
                                {p.style === 'repeated' ? 'Mosaïque' : 'Unique'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Watermark Text Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Texte du Filigrane
                      </label>
                      <input
                        type="text"
                        value={watermark.text}
                        onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
                        placeholder="Ex: © AUTOPOST STUDIO"
                        className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                      {/* Quick Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { label: '+ ©', insert: '© ' },
                          { label: '+ @', insert: '@' },
                          { label: `+ ${new Date().getFullYear()}`, insert: ` ${new Date().getFullYear()}` },
                          { label: '+ CONFIDENTIEL', insert: 'CONFIDENTIEL · ' },
                          { label: '+ STUDIO', insert: 'STUDIO HORIZON' },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            onClick={() =>
                              setWatermark({ ...watermark, text: `${watermark.text}${chip.insert}` })
                            }
                            className="px-2 py-0.5 text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded transition-colors"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Watermark Distribution Style */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Mode de Distribution
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                        <button
                          onClick={() => setWatermark({ ...watermark, style: 'single' })}
                          className={`py-1.5 text-xs font-medium rounded transition-colors ${
                            watermark.style === 'single'
                              ? 'bg-neutral-800 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Emplacement Unique
                        </button>
                        <button
                          onClick={() => setWatermark({ ...watermark, style: 'repeated' })}
                          className={`py-1.5 text-xs font-medium rounded transition-colors ${
                            watermark.style === 'repeated'
                              ? 'bg-neutral-800 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Mosaïque Diagonale
                        </button>
                      </div>
                    </div>

                    {/* If Single: Position and Border */}
                    {watermark.style === 'single' ? (
                      <div className="space-y-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                        <label className="block text-xs font-semibold text-neutral-300">
                          Emplacement du Filigrane
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'bottom-right', label: 'Bas Droite' },
                            { id: 'bottom-left', label: 'Bas Gauche' },
                            { id: 'bottom-center', label: 'Bas Centre' },
                            { id: 'top-right', label: 'Haut Droite' },
                            { id: 'top-left', label: 'Haut Gauche' },
                            { id: 'top-center', label: 'Haut Centre' },
                            { id: 'center', label: 'Centre' },
                            { id: 'custom', label: 'Sur Mesure (X/Y)' },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              onClick={() =>
                                setWatermark({ ...watermark, position: pos.id as any })
                              }
                              className={`py-1.5 px-2 text-xs rounded border text-center transition-colors ${
                                watermark.position === pos.id
                                  ? 'bg-neutral-800 border-amber-500 text-white font-medium'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>

                        {watermark.position === 'custom' && (
                          <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <div>
                              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                                <span>Coordonnée X</span>
                                <span className="font-mono text-white">{watermark.customX ?? 85}%</span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="95"
                                step="1"
                                value={watermark.customX ?? 85}
                                onChange={(e) =>
                                  setWatermark({ ...watermark, customX: parseFloat(e.target.value) })
                                }
                                className="w-full accent-amber-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                                <span>Coordonnée Y</span>
                                <span className="font-mono text-white">{watermark.customY ?? 92}%</span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="95"
                                step="1"
                                value={watermark.customY ?? 92}
                                onChange={(e) =>
                                  setWatermark({ ...watermark, customY: parseFloat(e.target.value) })
                                }
                                className="w-full accent-amber-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Pill badge border */}
                        <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-neutral-800">
                          <span className="text-xs text-neutral-300">
                            Encadrer en badge / pilule translucide
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(watermark.showBorder)}
                            onChange={(e) =>
                              setWatermark({ ...watermark, showBorder: e.target.checked })
                            }
                            className="w-4 h-4 accent-amber-500 rounded bg-neutral-950 border-neutral-700"
                          />
                        </label>
                      </div>
                    ) : (
                      /* If Repeated: Gap & Diagonal Angle */
                      <div className="space-y-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                            <span>Espacement de la mosaïque</span>
                            <span className="font-mono text-white font-semibold">
                              {watermark.gap ?? 180} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="320"
                            step="10"
                            value={watermark.gap ?? 180}
                            onChange={(e) =>
                              setWatermark({ ...watermark, gap: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                            <span>Angle de la diagonale</span>
                            <span className="font-mono text-white font-semibold">
                              {watermark.rotation ?? -28}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            step="2"
                            value={watermark.rotation ?? -28}
                            onChange={(e) =>
                              setWatermark({ ...watermark, rotation: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Scale and Opacity Controls */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-neutral-300">Taille (jusqu'à 1000%)</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="10"
                              max="1000"
                              value={Math.round((watermark.scale ?? 1.0) * 100)}
                              onChange={(e) => {
                                const val = Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) / 100;
                                setWatermark({ ...watermark, scale: val });
                              }}
                              className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[10px] text-right font-mono text-amber-400 font-bold"
                            />
                            <span className="text-[10px] text-neutral-400">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10.0"
                          step="0.05"
                          value={watermark.scale ?? 1.0}
                          onChange={(e) =>
                            setWatermark({ ...watermark, scale: parseFloat(e.target.value) })
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-neutral-300">Opacité</span>
                          <span className="font-mono text-amber-400 font-bold text-[11px]">
                            {Math.round(watermark.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.85"
                          step="0.05"
                          value={watermark.opacity}
                          onChange={(e) =>
                            setWatermark({ ...watermark, opacity: parseFloat(e.target.value) })
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>

                    {/* Font Family Selection */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Police du Filigrane
                      </label>
                      <select
                        value={watermark.fontFamily || "'Plus Jakarta Sans', sans-serif"}
                        onChange={(e) =>
                          setWatermark({ ...watermark, fontFamily: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Moderne)</option>
                        <option value="'Syne', sans-serif">Syne (Design & Impact)</option>
                        <option value="'Outfit', sans-serif">Outfit (Géométrique)</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono (Tech & Code)</option>
                        <option value="'Cinzel', serif">Cinzel (Luxe & Édition)</option>
                        <option value="'Playfair Display', serif">Playfair Display (Élégant)</option>
                        <option value="'Cairo', sans-serif">Cairo (Arabe & Bilingue)</option>
                        <option value="'Amiri', serif">Amiri (Calligraphie)</option>
                      </select>
                    </div>

                    {/* Watermark Color & Palette */}
                    <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                      <span className="text-xs font-semibold text-neutral-300 block">
                        Couleur du Filigrane
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { color: '#ffffff', name: 'Blanc' },
                          { color: '#000000', name: 'Noir' },
                          { color: '#f59e0b', name: 'Or' },
                          { color: '#6366f1', name: 'Indigo' },
                          { color: '#10b981', name: 'Émeraude' },
                          { color: '#ef4444', name: 'Rouge Alerte' },
                          { color: '#06b6d4', name: 'Cyan' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            title={c.name}
                            onClick={() => setWatermark({ ...watermark, color: c.color })}
                            className={`w-6 h-6 rounded-full border transition-all ${
                              watermark.color === c.color
                                ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-500/50'
                                : 'border-white/20 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.color }}
                          />
                        ))}

                        <div className="flex items-center gap-1.5 ml-auto">
                          <input
                            type="color"
                            value={watermark.color || '#ffffff'}
                            onChange={(e) =>
                              setWatermark({ ...watermark, color: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-neutral-400 uppercase">
                            {watermark.color || '#ffffff'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reset Watermark Button */}
                    <button
                      onClick={() => setWatermark(INITIAL_WATERMARK)}
                      className="w-full py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser le filigrane aux valeurs d'origine</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: AUTOMATION & SOCIAL EXPORT */}
        {/* ============================================================== */}
        {activeTab === 'automation' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Automatisation & Export Réseaux
              </h3>
              <p className="text-xs text-neutral-400">
                Exportez en lot ou déclenchez vos scénarios Zapier / Make / Buffer
              </p>
            </div>

            {/* Quick Export Actions */}
            <div className="space-y-2">
              <button
                onClick={onOpenExportModal}
                className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors shadow-lg shadow-indigo-950/50"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Télécharger les {slides.length} visuels (ZIP HD)</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-700/60 px-2 py-0.5 rounded">
                  {aspectRatio.id}
                </span>
              </button>

              <button
                onClick={onOpenSocialCopyModal}
                className="w-full p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-xs font-medium flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Générer les Légendes & Hashtags (IA)</span>
                </div>
                <span className="text-[10px] text-neutral-400">Prêt</span>
              </button>
            </div>

            {/* Scheduled Planner Overview */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Planning de Publication</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {slides.length} dates
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {slides.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950 border border-neutral-800/80"
                  >
                    <span className="font-mono text-neutral-400">Diapo #{s.number}</span>
                    <span className="text-[11px] text-neutral-300">
                      {s.scheduledTime
                        ? new Date(s.scheduledTime).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Non programmé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Webhook Info */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webhooks & Automatisation</span>
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Connectez Make.com, Zapier ou Buffer pour publier automatiquement les visuels générés selon votre calendrier.
              </p>
              <button
                onClick={onOpenExportModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 pt-1"
              >
                <span>Configurer le Webhook d'automatisation</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
