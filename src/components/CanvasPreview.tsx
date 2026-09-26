import React, { useState } from 'react';
import {
  Maximize2,
  Grid,
  Square,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AspectRatioOption,
  LogoConfig,
  SlideItem,
  TypographyConfig,
} from '../types';
import { renderSlideToCanvas, downloadCanvasAsPng } from '../utils/canvasRenderer';

interface CanvasPreviewProps {
  slides: SlideItem[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (idx: number) => void;
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  onSelectSlide: (idx: number) => void;
  onOpenExportModal: () => void;
  mobileView?: 'editor' | 'preview';
  setMobileView?: (view: 'editor' | 'preview') => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  aspectRatio,
  typography,
  logo,
  onSelectSlide,
  onOpenExportModal,
  mobileView = 'preview',
  setMobileView,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'single' | 'mockup'>('grid');
  const [isExportingSingle, setIsExportingSingle] = useState(false);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const handleDownloadSingle = async (slide: SlideItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExportingSingle(true);
    try {
      const canvas = await renderSlideToCanvas(
        slide,
        aspectRatio,
        typography,
        logo,
        slides.length
      );
      downloadCanvasAsPng(canvas, `autopost_slide_${slide.number}_${aspectRatio.id.replace(':', 'x')}.png`);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handleShareSingle = async (slide: SlideItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const canvas = await renderSlideToCanvas(
        slide,
        aspectRatio,
        typography,
        logo,
        slides.length
      );
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `slide_${slide.number}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: slide.kicker || 'Visuel Réseaux Sociaux',
            text: slide.text,
            files: [file],
          });
        } else {
          downloadCanvasAsPng(canvas, `slide_${slide.number}.png`);
        }
      });
    } catch {
      // fallback
    }
  };

  // Compute CSS aspect ratio string
  const cssAspectRatio = `${aspectRatio.width} / ${aspectRatio.height}`;

  return (
    <div
      className={`flex-1 flex flex-col h-[calc(100vh-4rem)] bg-neutral-950 overflow-hidden ${
        mobileView === 'editor' ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Top Preview Bar */}
      <div className="h-12 px-3 sm:px-6 border-b border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Segmented view controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 bg-neutral-900 rounded-lg border border-neutral-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 sm:gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grille du lot ({slides.length})</span>
              <span className="sm:hidden">Grille</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 sm:gap-1.5 transition-colors ${
                viewMode === 'single'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu Unique</span>
              <span className="sm:hidden">Unique</span>
            </button>
            <button
              onClick={() => setViewMode('mockup')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 sm:gap-1.5 transition-colors ${
                viewMode === 'mockup'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulation Réseau</span>
              <span className="sm:hidden">Réseau</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 pl-2">
            <span className="font-medium text-neutral-300">{aspectRatio.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{aspectRatio.sublabel}</span>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-neutral-900 px-1.5 sm:px-2 py-1 rounded-md border border-neutral-800 text-xs">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="text-neutral-400 hover:text-white disabled:opacity-30 p-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-neutral-200 px-1 text-[11px] sm:text-xs">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() =>
                  setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))
                }
                disabled={currentSlideIndex === slides.length - 1}
                className="text-neutral-400 hover:text-white disabled:opacity-30 p-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => handleDownloadSingle(activeSlide)}
            disabled={isExportingSingle}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
          >
            <Download className="w-3 h-3 text-neutral-400" />
            <span>HD PNG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start custom-scrollbar">
        {/* VIEW 1: GRID OF ALL 6 SLIDES */}
        {viewMode === 'grid' && (
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>Cliquez sur une diapo pour la modifier</span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{aspectRatio.platforms.join(', ')}</span>
              </div>
              <button
                onClick={onOpenExportModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Télécharger les {slides.length} visuels</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              className={`grid gap-3 sm:gap-5 ${
                aspectRatio.id === '9:16'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                  : aspectRatio.id === '16:9'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {slides.map((slide, idx) => {
                const isSelected = idx === currentSlideIndex;
                return (
                  <div
                    key={slide.id}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      onSelectSlide(idx);
                      if (setMobileView && window.innerWidth < 768) {
                        setMobileView('editor');
                      }
                    }}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg shadow-indigo-950/40'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40'
                    }`}
                  >
                    {/* Rendered Slide Card */}
                    <div
                      className="relative w-full overflow-hidden select-none"
                      style={{ aspectRatio: cssAspectRatio }}
                    >
                      <SlideVisualContent
                        slide={slide}
                        aspectRatio={aspectRatio}
                        typography={typography}
                        logo={logo}
                        totalSlides={slides.length}
                        scale="compact"
                      />

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
                        <span className="text-[11px] font-mono text-white/90 bg-neutral-950/80 px-2 py-0.5 rounded backdrop-blur">
                          Diapo {slide.number}
                        </span>
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <button
                            onClick={(e) => handleShareSingle(slide, e)}
                            className="p-1.5 rounded-lg bg-neutral-900/80 text-white hover:bg-neutral-800 backdrop-blur"
                            title="Partager"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadSingle(slide, e)}
                            className="p-1.5 rounded-lg bg-neutral-900/80 text-white hover:bg-neutral-800 backdrop-blur"
                            title="Télécharger PNG HD"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer info */}
                    <div className="p-2.5 bg-neutral-900/80 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300 truncate max-w-[180px]">
                        {slide.kicker || `Diapo ${slide.number}`}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        #{slide.number}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: SINGLE SLIDE FULL BLEED FOCUS */}
        {viewMode === 'single' && (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto">
            <div
              className="relative w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden border border-neutral-800 group"
              style={{ aspectRatio: cssAspectRatio }}
            >
              <SlideVisualContent
                slide={activeSlide}
                aspectRatio={aspectRatio}
                typography={typography}
                logo={logo}
                totalSlides={slides.length}
                scale="normal"
              />

              {/* Navigation overlays */}
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-950 text-white disabled:opacity-0 transition-opacity backdrop-blur border border-neutral-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))
                }
                disabled={currentSlideIndex === slides.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-950 text-white disabled:opacity-0 transition-opacity backdrop-blur border border-neutral-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick action bar */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => handleDownloadSingle(activeSlide)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Télécharger ce visuel en 1080p</span>
              </button>
              <button
                onClick={() => handleShareSingle(activeSlide)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Partager directement</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: SOCIAL MEDIA FEED MOCKUP */}
        {viewMode === 'mockup' && (
          <div className="w-full max-w-sm mx-auto my-auto bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
            {/* Mock phone status bar */}
            <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>5G</span>
              </div>
            </div>

            {/* Mock App Header */}
            <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-['Syne'] font-bold text-sm tracking-tight text-white">
                Instagram Feed
              </span>
              <Send className="w-4 h-4 text-neutral-300" />
            </div>

            {/* Post Header */}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center font-bold text-xs text-white">
                    {logo.brandText.slice(0, 2) || 'AP'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">
                    {logo.brandHandle || '@autopost.studio'}
                  </p>
                  <p className="text-[10px] text-neutral-400">Sponsorisé · Carrousel</p>
                </div>
              </div>
              <span className="text-neutral-500 text-lg">···</span>
            </div>

            {/* Post Media Container */}
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: cssAspectRatio }}
            >
              <SlideVisualContent
                slide={activeSlide}
                aspectRatio={aspectRatio}
                typography={typography}
                logo={logo}
                totalSlides={slides.length}
                scale="normal"
              />
            </div>

            {/* Post Action Icons */}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <MessageCircle className="w-5 h-5 text-neutral-300" />
                <Send className="w-5 h-5 text-neutral-300" />
              </div>
              <Bookmark className="w-5 h-5 text-neutral-300" />
            </div>

            {/* Post Caption */}
            <div className="px-4 pb-4 text-xs space-y-1">
              <p className="text-neutral-200">
                <span className="font-semibold text-white mr-1.5">
                  {logo.brandHandle || '@autopost.studio'}
                </span>
                {activeSlide.text}
              </p>
              <p className="text-indigo-400 text-[11px]">
                #{activeSlide.kicker?.toLowerCase().replace(/\s+/g, '') || 'conseil'} #autopost #mindset
              </p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider pt-1">
                Il y a 2 heures
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Visual render of the slide inside DOM matching canvas output
 */
interface SlideVisualContentProps {
  slide: SlideItem;
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  totalSlides: number;
  scale: 'compact' | 'normal';
}

const SlideVisualContent: React.FC<SlideVisualContentProps> = ({
  slide,
  typography,
  logo,
  totalSlides,
  scale,
}) => {
  // Font family class
  const fontClass =
    typography.fontStyle === 'editorial'
      ? "font-['Fraunces']"
      : typography.fontStyle === 'avant-garde'
      ? "font-['Syne']"
      : typography.fontStyle === 'mono'
      ? "font-['JetBrains_Mono']"
      : "font-['Plus_Jakarta_Sans']";

  // Box style class
  let boxClasses = '';
  if (typography.boxStyle === 'frosted') {
    boxClasses = 'bg-neutral-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl';
  } else if (typography.boxStyle === 'solid-card') {
    boxClasses = 'bg-black/90 border-2 border-indigo-500/80 p-4 rounded-xl shadow-xl';
  } else if (typography.boxStyle === 'minimal-shadow') {
    boxClasses = 'drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]';
  }

  // Position alignment
  const positionClass =
    typography.position === 'top'
      ? 'justify-start pt-12'
      : typography.position === 'center'
      ? 'justify-center'
      : 'justify-end pb-8';

  const alignClass =
    typography.align === 'center'
      ? 'text-center items-center'
      : typography.align === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  // Responsive font sizing based on compact/normal
  const textSizeClass =
    scale === 'compact'
      ? 'text-xs sm:text-sm md:text-base leading-snug'
      : 'text-sm sm:text-base md:text-xl lg:text-2xl leading-relaxed';

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-neutral-950">
      {/* Background Image */}
      <img
        src={slide.imageUrl}
        alt={slide.imageAlt || 'Slide visual'}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        style={{
          filter: `brightness(${slide.imageBrightness ?? 100}%)`,
          transform: `scale(${slide.imageZoom ?? 1})`,
        }}
        onError={(e) => {
          // If image fails, fallback to subtle dark gradient
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />

      {/* Base Dark Dimming Tint */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: slide.customOverlayOpacity ?? 0.45 }}
      />

      {/* Scrim Gradient if selected */}
      {typography.boxStyle === 'scrim' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              typography.position === 'top'
                ? `linear-gradient(to bottom, rgba(0,0,0,${typography.scrimOpacity}) 0%, rgba(0,0,0,0) 70%)`
                : `linear-gradient(to top, rgba(0,0,0,${typography.scrimOpacity}) 0%, rgba(0,0,0,${typography.scrimOpacity * 0.5}) 50%, rgba(0,0,0,0) 80%)`,
          }}
        />
      )}

      {/* Predefined or Custom Logo */}
      {logo.enabled && (
        <div
          className={`absolute z-10 flex items-center gap-2 pointer-events-none ${
            logo.position === 'top-left'
              ? 'top-4 left-4'
              : logo.position === 'top-right'
              ? 'top-4 right-4 text-right'
              : logo.position === 'bottom-left'
              ? 'bottom-4 left-4'
              : logo.position === 'bottom-right'
              ? 'bottom-4 right-4 text-right'
              : 'top-4 left-1/2 -translate-x-1/2 text-center'
          }`}
          style={{ opacity: logo.opacity }}
        >
          {logo.type === 'custom' && logo.customUrl ? (
            <img
              src={logo.customUrl}
              alt="Logo Marque"
              className={`object-contain ${
                logo.size === 'small' ? 'h-6' : logo.size === 'medium' ? 'h-8' : 'h-10'
              }`}
            />
          ) : (
            <div
              className={`flex items-center gap-2 ${
                logo.position.includes('right') ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`rounded border flex items-center justify-center font-bold font-['Syne'] ${
                  logo.size === 'small'
                    ? 'w-5 h-5 text-[9px]'
                    : logo.size === 'medium'
                    ? 'w-7 h-7 text-xs'
                    : 'w-9 h-9 text-sm'
                } ${
                  logo.theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : logo.theme === 'accent'
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-white/10 border-white/30 text-white backdrop-blur-sm'
                }`}
              >
                AP
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-['Syne'] font-bold tracking-tight text-white leading-tight ${
                    logo.size === 'small'
                      ? 'text-[10px]'
                      : logo.size === 'medium'
                      ? 'text-xs'
                      : 'text-sm'
                  }`}
                >
                  {logo.brandText || 'AUTOPOST STUDIO'}
                </span>
                {logo.brandHandle && (
                  <span className="text-[9px] text-neutral-300/80 font-medium">
                    {logo.brandHandle}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide Counter (01 / 06) */}
      {typography.showSlideNumber && (
        <div className="absolute bottom-3 right-4 z-10 pointer-events-none">
          <span className="text-[10px] font-mono font-medium text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur">
            {String(slide.number).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`relative z-10 w-full h-full p-6 sm:p-8 flex flex-col ${positionClass} ${alignClass}`}
      >
        <div className={`max-w-xl w-full flex flex-col ${alignClass} ${boxClasses}`}>
          {/* Kicker tag */}
          {typography.showKicker && slide.kicker && (
            <span
              className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: typography.accentColor || '#818cf8' }}
            >
              {slide.kicker}
            </span>
          )}

          {/* Main Phrase Text */}
          <h2
            className={`font-bold ${fontClass} ${textSizeClass} text-white tracking-tight`}
            style={{
              color: typography.textColor || '#ffffff',
            }}
          >
            {slide.text}
          </h2>

          {/* Subtitle / Citation */}
          {typography.showSubtitle && slide.subtitle && (
            <p className="mt-2 text-[11px] sm:text-xs text-neutral-300 font-normal leading-relaxed">
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
