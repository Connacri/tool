import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  Maximize2,
  Minus,
  Plus,
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
  UploadCloud,
  Layers,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Stamp,
  Droplets,
  Hand,
  Check,
} from 'lucide-react';
import {
  AspectRatioOption,
  ColorFilterConfig,
  GradientBlurConfig,
  LogoConfig,
  OverlayImageConfig,
  SlideItem,
  TextAlign,
  TypographyConfig,
  WatermarkConfig,
} from '../types';
import {
  renderSlideToCanvas,
  downloadCanvasAsPng,
  resolveLayoutDirection,
  resolveEffectiveAlignment,
  resolveEffectiveKickerAlignment,
  isArabicText,
} from '../utils/canvasRenderer';
import { formatArabicDigits, loadGoogleFont } from '../utils/googleFonts';

interface CanvasPreviewProps {
  slides: SlideItem[];
  setSlides?: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  currentSlideIndex: number;
  setCurrentSlideIndex: (idx: number) => void;
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  setTypography?: React.Dispatch<React.SetStateAction<TypographyConfig>>;
  logo: LogoConfig;
  setLogo?: React.Dispatch<React.SetStateAction<LogoConfig>>;
  onSelectSlide: (idx: number) => void;
  onOpenExportModal: () => void;
  gradientBlur?: GradientBlurConfig;
  setGradientBlur?: React.Dispatch<React.SetStateAction<GradientBlurConfig>>;
  colorFilter?: ColorFilterConfig;
  setColorFilter?: React.Dispatch<React.SetStateAction<ColorFilterConfig>>;
  overlayImage?: OverlayImageConfig;
  setOverlayImage?: React.Dispatch<React.SetStateAction<OverlayImageConfig>>;
  watermark?: WatermarkConfig;
  setWatermark?: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
  mobileView?: 'editor' | 'preview';
  setMobileView?: (view: 'editor' | 'preview') => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  slides,
  setSlides,
  currentSlideIndex,
  setCurrentSlideIndex,
  aspectRatio,
  typography,
  setTypography,
  logo,
  setLogo,
  onSelectSlide,
  onOpenExportModal,
  gradientBlur,
  setGradientBlur,
  colorFilter,
  setColorFilter,
  overlayImage,
  setOverlayImage,
  watermark,
  setWatermark,
  mobileView = 'preview',
  setMobileView,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'single' | 'mockup'>('grid');
  const [gridDensity, setGridDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Canvas interactive tool mode in Single View
  const [activeCanvasTool, setActiveCanvasTool] = useState<'auto' | 'image' | 'text' | 'logo' | 'blur'>('auto');

  // Dragging interaction state
  const [dragTarget, setDragTarget] = useState<'image' | 'text' | 'logo' | 'logo-resize' | 'blur' | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    initialPanX: number;
    initialPanY: number;
    initialTextX: number;
    initialTextY: number;
    initialLogoX: number;
    initialLogoY: number;
    initialLogoScale: number;
    initialBlurY: number;
  }>({
    x: 0,
    y: 0,
    initialPanX: 0,
    initialPanY: 0,
    initialTextX: 50,
    initialTextY: 75,
    initialLogoX: 10,
    initialLogoY: 10,
    initialLogoScale: 1.0,
    initialBlurY: 75,
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mockupContainerRef = useRef<HTMLDivElement>(null);

  // Mesure de la largeur CSS réelle du canvas d'aperçu interactif, pour que la
  // typographie affichée à l'écran corresponde pixel pour pixel au rendu HD
  // exporté (voir SlideVisualContent : les tailles de police sont désormais
  // calculées proportionnellement à cette largeur, exactement comme dans
  // canvasRenderer.ts, au lieu d'utiliser des tailles fixes en pixels CSS).
  const [previewContainerWidth, setPreviewContainerWidth] = useState<number>(0);
  const [mockupContainerWidth, setMockupContainerWidth] = useState<number>(0);

  useLayoutEffect(() => {
    const editorEl = canvasContainerRef.current;
    const mockupEl = mockupContainerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === editorEl) setPreviewContainerWidth(entry.contentRect.width);
        else if (entry.target === mockupEl) setMockupContainerWidth(entry.contentRect.width);
      }
    });

    if (editorEl) {
      setPreviewContainerWidth(editorEl.clientWidth);
      observer.observe(editorEl);
    }
    if (mockupEl) {
      setMockupContainerWidth(mockupEl.clientWidth);
      observer.observe(mockupEl);
    }
    return () => observer.disconnect();
    // Ré-observe si le mode de vue change et remonte les conteneurs du DOM
  }, [viewMode]);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const updateActiveSlide = useCallback((fields: Partial<SlideItem>) => {
    if (!setSlides) return;
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentSlideIndex ? { ...s, ...fields } : s))
    );
  }, [currentSlideIndex, setSlides]);

  const handleDownloadSingle = async (slide: SlideItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExportingSingle(true);
    try {
      const canvas = await renderSlideToCanvas(
        slide,
        aspectRatio,
        typography,
        logo,
        slides.length,
        gradientBlur,
        colorFilter,
        overlayImage,
        watermark
      );
      downloadCanvasAsPng(
        canvas,
        `autopost_slide_${slide.number}_${aspectRatio.id.replace(':', 'x')}.png`
      );
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
        slides.length,
        gradientBlur,
        colorFilter,
        overlayImage,
        watermark
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

  // Drag and drop overlay image file handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (overlayImage?.applyToAll === false && setSlides) {
        setSlides((prev) =>
          prev.map((s, idx) =>
            idx === currentSlideIndex
              ? {
                  ...s,
                  customOverlayImage: {
                    enabled: true,
                    url: dataUrl,
                    fileName: file.name,
                    position: s.customOverlayImage?.position || 'bottom-right',
                    scale: s.customOverlayImage?.scale || 0.35,
                    opacity: s.customOverlayImage?.opacity || 0.9,
                    blendMode: s.customOverlayImage?.blendMode || 'normal',
                    applyToAll: false,
                  },
                }
              : s
          )
        );
      } else if (setOverlayImage) {
        setOverlayImage((prev) => ({
          ...prev,
          enabled: true,
          url: dataUrl,
          fileName: file.name,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Interactive Canvas Pointer Handlers (Pan Image, Drag Text, Drag Logo) ---
  const handlePointerDown = (
    e: React.PointerEvent,
    target: 'image' | 'text' | 'logo' | 'logo-resize' | 'blur'
  ) => {
    e.stopPropagation();
    setDragTarget(target);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const currentTextX = activeSlide.customTextX ?? typography.freePositionX ?? 50;
    const currentTextY = activeSlide.customTextY ?? typography.freePositionY ?? 75;
    const currentLogoX = logo.customX ?? 10;
    const currentLogoY = logo.customY ?? 8;
    const currentLogoScale = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
    const currentBlurY = (activeSlide.customBlur || gradientBlur)?.positionY ?? 75;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: activeSlide.imagePanX ?? 0,
      initialPanY: activeSlide.imagePanY ?? 0,
      initialTextX: currentTextX,
      initialTextY: currentTextY,
      initialLogoX: currentLogoX,
      initialLogoY: currentLogoY,
      initialLogoScale: currentLogoScale,
      initialBlurY: currentBlurY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTarget || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaPixelX = e.clientX - dragStartRef.current.x;
    const deltaPixelY = e.clientY - dragStartRef.current.y;

    const deltaPercentX = (deltaPixelX / rect.width) * 100;
    const deltaPercentY = (deltaPixelY / rect.height) * 100;

    if (dragTarget === 'image') {
      // Panning the background image (-50% to +50%)
      const zoom = activeSlide.imageZoom ?? 1;
      const sensitivity = 1 / zoom;
      const newPanX = Math.round(
        Math.max(-50, Math.min(50, dragStartRef.current.initialPanX + deltaPercentX * sensitivity * 1.5))
      );
      const newPanY = Math.round(
        Math.max(-50, Math.min(50, dragStartRef.current.initialPanY + deltaPercentY * sensitivity * 1.5))
      );
      updateActiveSlide({ imagePanX: newPanX, imagePanY: newPanY });
    } else if (dragTarget === 'text') {
      // Dragging the phrase / titles container
      const newX = Math.round(
        Math.max(10, Math.min(90, dragStartRef.current.initialTextX + deltaPercentX))
      );
      const newY = Math.round(
        Math.max(10, Math.min(90, dragStartRef.current.initialTextY + deltaPercentY))
      );
      updateActiveSlide({ customTextX: newX, customTextY: newY });
      if (setTypography) {
        setTypography((prev) => ({
          ...prev,
          position: 'free',
          freePositionX: newX,
          freePositionY: newY,
        }));
      }
    } else if (dragTarget === 'logo') {
      // Dragging the logo
      const newX = Math.round(
        Math.max(2, Math.min(95, dragStartRef.current.initialLogoX + deltaPercentX))
      );
      const newY = Math.round(
        Math.max(2, Math.min(95, dragStartRef.current.initialLogoY + deltaPercentY))
      );
      if (setLogo) {
        setLogo((prev) => ({
          ...prev,
          position: 'custom',
          customX: newX,
          customY: newY,
        }));
      }
    } else if (dragTarget === 'logo-resize') {
      // Dragging the corner resize handle of the logo (Option A)
      const delta = (deltaPixelX + deltaPixelY) / 2;
      const initialScale = dragStartRef.current.initialLogoScale ?? 1.0;
      const scaleDelta = delta / 80;
      const newScale = Math.max(0.2, Math.min(8.0, Number((initialScale + scaleDelta).toFixed(2))));
      if (setLogo) {
        setLogo((prev) => ({
          ...prev,
          scale: newScale,
          size: 'custom',
        }));
      }
    } else if (dragTarget === 'blur') {
      // Dragging the blur position
      const newY = Math.round(
        Math.max(5, Math.min(95, dragStartRef.current.initialBlurY + deltaPercentY))
      );
      if (setGradientBlur && gradientBlur) {
        setGradientBlur({ ...gradientBlur, positionY: newY });
      }
    }
  };

  const handlePointerUp = () => {
    setDragTarget(null);
  };

  // Mouse wheel on canvas to zoom background photo when in image pan mode
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (activeCanvasTool !== 'image' && e.ctrlKey === false && e.metaKey === false) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    const currentZoom = activeSlide.imageZoom ?? 1;
    const newZoom = Math.max(1, Math.min(3.5, Math.round((currentZoom + zoomDelta) * 10) / 10));
    updateActiveSlide({ imageZoom: newZoom });
  };

  // Compute CSS aspect ratio string
  const cssAspectRatio = `${aspectRatio.width} / ${aspectRatio.height}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col h-[calc(100vh-4rem)] bg-neutral-950 overflow-hidden ${
        mobileView === 'editor' ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Drag & Drop Visual Dropzone Indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-neutral-950/85 backdrop-blur-md border-4 border-dashed border-indigo-500 m-3 rounded-2xl flex flex-col items-center justify-center pointer-events-none p-6 text-center animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-300 mb-4 shadow-xl">
            <UploadCloud className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="text-xl font-bold text-white font-['Syne']">
            Déposez votre image de superposition ici
          </h3>
          <p className="text-sm text-neutral-300 mt-1.5 max-w-md">
            Sticker, filigrane, cadre, badge ou image PNG avec transparence
          </p>
        </div>
      )}

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

          {/* Active ratio pan / zoom helper badge */}
          {((activeSlide.imageZoom ?? 1) > 1 || (activeSlide.imagePanX ?? 0) !== 0 || (activeSlide.imagePanY ?? 0) !== 0) && (
            <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800/80 text-[11px] text-neutral-300 border border-neutral-700">
              <Move className="w-3 h-3 text-indigo-400" />
              <span>Cadrage: {Math.round((activeSlide.imageZoom ?? 1) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-neutral-900 px-1.5 sm:px-2 py-1 rounded-md border border-neutral-800 text-xs">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="text-neutral-400 hover:text-white disabled:opacity-30 p-0.5"
                title="Diapo précédente"
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
                title="Diapo suivante"
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
                <span>Cliquez sur une diapo pour modifier le texte ou cadrer</span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{aspectRatio.platforms.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                {/* Density toggle: Confortable vs Compacte */}
                <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGridDensity('comfortable')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      gridDensity === 'comfortable'
                        ? 'bg-neutral-800 text-white font-medium shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Vue Confortable (grandes cartes, texte très lisible)"
                  >
                    Grandes cartes
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('compact')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      gridDensity === 'compact'
                        ? 'bg-neutral-800 text-white font-medium shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Vue Compacte (vue d'ensemble de tout le lot)"
                  >
                    Vue d'ensemble
                  </button>
                </div>

                <button
                  onClick={onOpenExportModal}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <span>Télécharger ({slides.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`grid gap-3.5 sm:gap-5 ${
                gridDensity === 'comfortable'
                  ? aspectRatio.id === '9:16'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : aspectRatio.id === '16:9'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : aspectRatio.id === '9:16'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                  : aspectRatio.id === '16:9'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
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
                        blur={gradientBlur}
                        filter={colorFilter}
                        overlay={overlayImage}
                        watermark={watermark}
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

        {/* VIEW 2: SINGLE SLIDE FOCUS WITH DIRECT ON-CANVAS DRAG & RESIZING */}
        {viewMode === 'single' && (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto space-y-3">
            {/* Interactive Modes Toolbar */}
            <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 shadow-lg text-xs">
              <button
                onClick={() => setActiveCanvasTool('auto')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeCanvasTool === 'auto'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Sélectionner ou glisser n'importe quel élément"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Interactif</span>
              </button>

              <button
                onClick={() => setActiveCanvasTool('image')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeCanvasTool === 'image'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Glisser la photo pour repositionner le cadrage et zoomer"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Cadrer l'image</span>
              </button>

              <button
                onClick={() => setActiveCanvasTool('text')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeCanvasTool === 'text'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Déplacer et redimensionner la phrase et les titres"
              >
                <Type className="w-3.5 h-3.5" />
                <span>Texte & Titre</span>
              </button>

              <button
                onClick={() => setActiveCanvasTool('logo')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeCanvasTool === 'logo'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Déplacer et redimensionner le logo"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Logo</span>
              </button>

              {gradientBlur?.enabled && (
                <button
                  onClick={() => setActiveCanvasTool('blur')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeCanvasTool === 'blur'
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Ajuster la position et dimension du flou"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Flou</span>
                </button>
              )}
            </div>

            {/* Interactive Canvas Container */}
            <div
              ref={canvasContainerRef}
              onWheel={handleCanvasWheel}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden border border-neutral-800 select-none group touch-none ${
                activeCanvasTool === 'image'
                  ? dragTarget === 'image'
                    ? 'cursor-grabbing ring-2 ring-indigo-500'
                    : 'cursor-grab ring-1 ring-indigo-500/60'
                  : ''
              }`}
              style={{ aspectRatio: cssAspectRatio }}
            >
              {/* Background Slide Visual DOM */}
              <SlideVisualContent
                slide={activeSlide}
                aspectRatio={aspectRatio}
                typography={typography}
                logo={logo}
                totalSlides={slides.length}
                scale="normal"
                containerWidth={previewContainerWidth}
                blur={gradientBlur}
                filter={colorFilter}
                overlay={overlayImage}
                watermark={watermark}
              />

              {/* DIRECT DRAG LAYER: IMAGE PANNING */}
              {(activeCanvasTool === 'image' || activeCanvasTool === 'auto') && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'image')}
                  className={`absolute inset-0 z-10 ${
                    activeCanvasTool === 'image'
                      ? 'cursor-grab pointer-events-auto'
                      : 'pointer-events-none'
                  }`}
                >
                  {activeCanvasTool === 'image' && (
                    <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-700 text-[11px] text-white flex items-center gap-2">
                      <Move className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Glissez pour cadrer la zone visible</span>
                      <span className="font-mono text-indigo-300">
                        ({activeSlide.imagePanX ?? 0}%, {activeSlide.imagePanY ?? 0}%)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* DIRECT DRAG & RESIZE LAYER: LOGO (Option A) */}
              {logo.enabled && (activeCanvasTool === 'logo' || activeCanvasTool === 'auto') && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'logo')}
                  onWheel={(e) => {
                    if (activeCanvasTool === 'logo') {
                      e.stopPropagation();
                      const cur = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                      const delta = e.deltaY < 0 ? 0.1 : -0.1;
                      const next = Math.max(0.2, Math.min(8.0, Number((cur + delta).toFixed(2))));
                      if (setLogo) setLogo((prev) => ({ ...prev, scale: next, size: 'custom' }));
                    }
                  }}
                  className={`absolute z-30 group/logo cursor-move p-3 -m-3 rounded-2xl transition-all ${
                    activeCanvasTool === 'logo'
                      ? 'ring-2 ring-indigo-400 bg-indigo-500/10'
                      : 'hover:ring-1 hover:ring-indigo-400/60'
                  }`}
                  style={{
                    left: `${logo.customX ?? (logo.position.includes('right') ? 80 : logo.position.includes('center') ? 50 : 10)}%`,
                    top: `${logo.customY ?? (logo.position.includes('bottom') ? 90 : 8)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-opacity bg-neutral-950/95 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap flex items-center gap-1.5 border border-neutral-700">
                    <Move className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Déplacer · {Math.round((logo.scale ?? 1) * 100)}%</span>
                  </div>

                  {/* Corner Resize Handle (Option A) */}
                  {activeCanvasTool === 'logo' && (
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'logo-resize')}
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize border-2 border-neutral-950 transition-transform hover:scale-125 z-40 pointer-events-auto"
                      title="Glisser pour redimensionner le logo (Option A)"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              )}

              {/* DIRECT DRAG & RESIZE LAYER: PHRASE & TEXT BLOCK */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'text')}
                className={`absolute z-20 group/text cursor-move rounded-2xl transition-all ${
                  activeCanvasTool === 'text'
                    ? 'ring-2 ring-indigo-500 bg-indigo-500/10 pointer-events-auto'
                    : 'hover:ring-1 hover:ring-indigo-400/50 pointer-events-auto'
                }`}
                style={{
                  left: `${activeSlide.customTextX ?? typography.freePositionX ?? 50}%`,
                  top: `${activeSlide.customTextY ?? typography.freePositionY ?? 75}%`,
                  width: `${typography.textWidth ?? 88}%`,
                  transform: 'translate(-50%, -50%)',
                  padding: '16px',
                }}
              >
                {/* Visual drag indicator */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/text:opacity-100 transition-opacity bg-neutral-950/95 text-white text-[10px] px-2.5 py-0.5 rounded-full shadow border border-neutral-700 flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
                  <Move className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Glisser pour positionner · Phrase: {Math.round((activeSlide.customTextScale ?? typography.fontSize ?? 1.1) * 100)}%</span>
                </div>
              </div>

              {/* Navigation overlays */}
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-950 text-white disabled:opacity-0 transition-opacity backdrop-blur border border-neutral-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))
                }
                disabled={currentSlideIndex === slides.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-950 text-white disabled:opacity-0 transition-opacity backdrop-blur border border-neutral-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* QUICK ON-CANVAS ADJUSTMENT CONTROLS BASED ON ACTIVE TOOL */}
            {activeCanvasTool === 'image' && (
              <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Zoom & Cadrage de l'image</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-300">
                      {Math.round((activeSlide.imageZoom ?? 1) * 100)}%
                    </span>
                    <button
                      onClick={() => updateActiveSlide({ imageZoom: 1, imagePanX: 0, imagePanY: 0 })}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                      title="Réinitialiser zoom et cadrage"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Recentrer</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={activeSlide.imageZoom ?? 1}
                    onChange={(e) => updateActiveSlide({ imageZoom: parseFloat(e.target.value) })}
                    className="flex-1 accent-indigo-500"
                  />
                  <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <p className="text-[10px] text-neutral-400 text-center">
                  💡 Glissez directement sur la photo pour déplacer la zone visible (Pan X: {activeSlide.imagePanX ?? 0}%, Pan Y: {activeSlide.imagePanY ?? 0}%)
                </p>
              </div>
            )}

            {activeCanvasTool === 'text' && (
              <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Redimensionner la Phrase et les Titres</span>
                  </span>
                  <button
                    onClick={() => {
                      updateActiveSlide({ customTextX: 50, customTextY: 75, customTextScale: 1.1, customKickerScale: 1.0, customSubtitleScale: 1.0 });
                      if (setTypography) setTypography((prev) => ({ ...prev, fontSize: 1.1, kickerSize: 1.0, subtitleSize: 1.0, position: 'bottom' }));
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Réinitialiser</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Phrase Size */}
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="block text-[10px] text-neutral-400 mb-1">Taille Phrase</span>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const current = activeSlide.customTextScale ?? typography.fontSize ?? 1.1;
                          const next = Math.max(0.6, Math.round((current - 0.1) * 10) / 10);
                          updateActiveSlide({ customTextScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, fontSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-neutral-200 text-xs">
                        {Math.round((activeSlide.customTextScale ?? typography.fontSize ?? 1.1) * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          const current = activeSlide.customTextScale ?? typography.fontSize ?? 1.1;
                          const next = Math.min(2.5, Math.round((current + 0.1) * 10) / 10);
                          updateActiveSlide({ customTextScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, fontSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Kicker Title Size */}
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="block text-[10px] text-neutral-400 mb-1">Taille Titre</span>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const current = activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0;
                          const next = Math.max(0.5, Math.round((current - 0.1) * 10) / 10);
                          updateActiveSlide({ customKickerScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, kickerSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-neutral-200 text-xs">
                        {Math.round((activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0) * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          const current = activeSlide.customKickerScale ?? typography.kickerSize ?? 1.0;
                          const next = Math.min(2.5, Math.round((current + 0.1) * 10) / 10);
                          updateActiveSlide({ customKickerScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, kickerSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtitle Size */}
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="block text-[10px] text-neutral-400 mb-1">Sous-titre</span>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const current = activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;
                          const next = Math.max(0.5, Math.round((current - 0.1) * 10) / 10);
                          updateActiveSlide({ customSubtitleScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, subtitleSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-neutral-200 text-xs">
                        {Math.round((activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0) * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          const current = activeSlide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;
                          const next = Math.min(2.5, Math.round((current + 0.1) * 10) / 10);
                          updateActiveSlide({ customSubtitleScale: next });
                          if (setTypography) setTypography((prev) => ({ ...prev, subtitleSize: next }));
                        }}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCanvasTool === 'logo' && logo.enabled && (
              <div className="w-full max-w-lg bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Redimensionner et Placer le Logo</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                      Option A
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                        const next = Math.max(0.2, Number((cur - 0.2).toFixed(2)));
                        if (setLogo) setLogo({ ...logo, scale: next, size: 'custom' });
                      }}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Réduire"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-indigo-400 font-bold min-w-[48px] text-center">
                      {Math.round((logo.scale ?? 1.0) * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
                        const next = Math.min(8.0, Number((cur + 0.2).toFixed(2)));
                        if (setLogo) setLogo({ ...logo, scale: next, size: 'custom' });
                      }}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Agrandir"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-400">Échelle</span>
                  <input
                    type="range"
                    min="0.2"
                    max="8.0"
                    step="0.05"
                    value={logo.scale ?? 1.0}
                    onChange={(e) => {
                      if (setLogo) setLogo({ ...logo, scale: parseFloat(e.target.value), size: 'custom' });
                    }}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Quick scale presets in canvas toolbar */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {[
                    { label: '50%', scale: 0.5 },
                    { label: '100%', scale: 1.0 },
                    { label: '200%', scale: 2.0 },
                    { label: '350%', scale: 3.5 },
                    { label: '500%', scale: 5.0 },
                    { label: '800%', scale: 8.0 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => {
                        if (setLogo) setLogo({ ...logo, scale: btn.scale, size: 'custom' });
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        Math.abs((logo.scale ?? 1.0) - btn.scale) < 0.05
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      if (setLogo) setLogo({ ...logo, position: 'center', customX: 50, customY: 50 });
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white ml-auto px-2 py-0.5 rounded bg-neutral-800/80 whitespace-nowrap"
                  >
                    Centrer
                  </button>
                  <button
                    onClick={() => {
                      if (setLogo) setLogo({ ...logo, position: 'top-left', scale: 1.0, customX: 10, customY: 8, size: 'medium' });
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800/80 whitespace-nowrap"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px] text-neutral-400">
                  <span>💡 Glissez la poignée en bas à droite du logo ou la molette pour ajuster</span>
                </div>
              </div>
            )}

            {activeCanvasTool === 'blur' && gradientBlur?.enabled && (
              <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Position & Dimensions du Flou</span>
                  </span>
                  <span className="font-mono text-cyan-300">
                    {gradientBlur.blurAmount}px · Pos Y: {gradientBlur.positionY ?? 75}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-neutral-400 mb-0.5">Position Y (Hauteur)</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      step="1"
                      value={gradientBlur.positionY ?? 75}
                      onChange={(e) => {
                        if (setGradientBlur) setGradientBlur({ ...gradientBlur, positionY: parseInt(e.target.value) });
                      }}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 mb-0.5">Envergure / Hauteur floue</span>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      step="5"
                      value={gradientBlur.blurSize ?? 50}
                      onChange={(e) => {
                        if (setGradientBlur) setGradientBlur({ ...gradientBlur, blurSize: parseInt(e.target.value) });
                      }}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick action bar */}
            <div className="mt-2 flex items-center gap-3">
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
              ref={mockupContainerRef}
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
                containerWidth={mockupContainerWidth}
                blur={gradientBlur}
                filter={colorFilter}
                overlay={overlayImage}
                watermark={watermark}
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
  /**
   * Largeur CSS réelle (en px) du conteneur qui affiche ce composant, mesurée
   * via ResizeObserver côté parent. Sert à calculer une typographie
   * proportionnelle qui correspond pixel pour pixel au rendu HD exporté par
   * canvasRenderer.ts (même formule : taille = largeur × ratio × échelle).
   * Non fournie (0) en mode "compact" (grille), qui garde des tailles fixes
   * volontairement réduites pour une vue d'ensemble.
   */
  containerWidth?: number;
  blur?: GradientBlurConfig;
  filter?: ColorFilterConfig;
  overlay?: OverlayImageConfig;
  watermark?: WatermarkConfig;
}

const SlideVisualContent: React.FC<SlideVisualContentProps> = ({
  slide,
  aspectRatio,
  typography,
  logo,
  totalSlides,
  scale,
  containerWidth,
  blur,
  filter,
  overlay,
  watermark,
}) => {
  const effectiveBlur = slide.customBlur || blur;
  const effectiveFilter = slide.customFilter || filter;
  const effectiveOverlay = slide.customOverlayImage || overlay;
  const effectiveWatermark = watermark;

  // Determine per-element direction and Arabic script
  const kickerIsArabic = isArabicText(slide.kicker || '');
  const phraseIsArabic = isArabicText(slide.text || '');
  const subtitleIsArabic = isArabicText(slide.subtitle || '');

  const textSample = `${slide.kicker || ''} ${slide.text || ''} ${slide.subtitle || ''}`;
  const layoutDir = resolveLayoutDirection(textSample, typography.direction, slide.customDirection);
  const isRtl = layoutDir === 'rtl';

  const kickerDir: 'rtl' | 'ltr' =
    slide.customDirection === 'rtl' || typography.direction === 'rtl'
      ? 'rtl'
      : slide.customDirection === 'ltr' || typography.direction === 'ltr'
      ? 'ltr'
      : (kickerIsArabic ? 'rtl' : 'ltr');

  const phraseDir: 'rtl' | 'ltr' =
    slide.customDirection === 'rtl' || typography.direction === 'rtl'
      ? 'rtl'
      : slide.customDirection === 'ltr' || typography.direction === 'ltr'
      ? 'ltr'
      : (phraseIsArabic ? 'rtl' : 'ltr');

  const subtitleDir: 'rtl' | 'ltr' =
    slide.customDirection === 'rtl' || typography.direction === 'rtl'
      ? 'rtl'
      : slide.customDirection === 'ltr' || typography.direction === 'ltr'
      ? 'ltr'
      : (subtitleIsArabic ? 'rtl' : 'ltr');

  // Dynamic Google Font resolution
  const arabicFontFamily =
    typography.customArabicFontFamily ||
    (typography.arabicFont === 'noto-arabic'
      ? 'Noto Sans Arabic'
      : typography.arabicFont === 'tajawal'
      ? 'Tajawal'
      : typography.arabicFont === 'amiri'
      ? 'Amiri'
      : typography.arabicFont === 'alexandria'
      ? 'Alexandria'
      : typography.arabicFont === 'almarai'
      ? 'Almarai'
      : typography.arabicFont === 'readex'
      ? 'Readex Pro'
      : typography.arabicFont === 'el-messiri'
      ? 'El Messiri'
      : 'Cairo');

  const latinFontFamily =
    typography.customFontFamily ||
    (typography.fontStyle === 'editorial'
      ? 'Fraunces'
      : typography.fontStyle === 'avant-garde'
      ? 'Syne'
      : typography.fontStyle === 'playfair'
      ? 'Playfair Display'
      : typography.fontStyle === 'outfit'
      ? 'Outfit'
      : typography.fontStyle === 'cinzel'
      ? 'Cinzel'
      : typography.fontStyle === 'mono'
      ? 'JetBrains Mono'
      : 'Plus Jakarta Sans');

  const kickerFontName = kickerIsArabic ? arabicFontFamily : latinFontFamily;
  const phraseFontName = phraseIsArabic ? arabicFontFamily : latinFontFamily;
  const subtitleFontName = subtitleIsArabic ? arabicFontFamily : latinFontFamily;

  // Dynamically load Google Fonts into DOM on demand
  useEffect(() => {
    if (kickerIsArabic || phraseIsArabic || subtitleIsArabic || isRtl) {
      loadGoogleFont(arabicFontFamily);
    }
    loadGoogleFont(latinFontFamily);
  }, [arabicFontFamily, latinFontFamily, kickerIsArabic, phraseIsArabic, subtitleIsArabic, isRtl]);

  // Colors customizable by user for title (kicker), main phrase, and subtitle
  const kickerColor = slide.customKickerColor || typography.accentColor || '#6366f1';
  const phraseColor = slide.customTextColor || typography.textColor || '#ffffff';
  const subtitleColor = slide.customSubtitleColor || typography.subtitleColor || 'rgba(255, 255, 255, 0.75)';

  // BiDi numeral & handle rendering: strictly preserves LTR order for Western numbers & @handles in Arabic text
  const renderBiDiText = (text: string | undefined, isArabic: boolean) => {
    if (!text) return null;
    if (typography.easternNumerals) {
      return formatArabicDigits(text, true);
    }
    if (!isArabic) return text;
    // For RTL text: isolate Western digits (0-9, percentages, decimals) and handles (@pseudo)
    // so they maintain strict LTR order and Latin orientation!
    const parts = text.split(/(@[\w.-]+|\d+(?:[.,]\d+)?%?)/g);
    return parts.map((part, i) => {
      if (/^@[\w.-]+$/.test(part) || /^\d+(?:[.,]\d+)?%?$/.test(part)) {
        return (
          <span key={i} dir="ltr" className="inline-block tabular-nums unicode-bidi-isolate font-['Plus_Jakarta_Sans',sans-serif]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Box style class
  let boxClasses = '';
  if (typography.boxStyle === 'frosted') {
    boxClasses = scale === 'compact'
      ? 'bg-neutral-900/80 backdrop-blur-md border border-white/10 p-2 rounded-lg'
      : 'bg-neutral-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl';
  } else if (typography.boxStyle === 'solid-card') {
    boxClasses = scale === 'compact'
      ? 'bg-black/90 border p-2 rounded-lg shadow-md'
      : 'bg-black/90 border-2 p-4 rounded-xl shadow-xl';
  } else if (typography.boxStyle === 'minimal-shadow') {
    boxClasses = 'drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]';
  }

  // Individual user-selectable alignments:
  // For Arabic (RTL), sentence alignment is the inverse of LTR (standard start is on the right).
  const phraseAlign: TextAlign = resolveEffectiveAlignment(
    phraseDir,
    slide.customAlign,
    typography.phraseAlign,
    typography.align
  );

  const kickerAlign: TextAlign = resolveEffectiveKickerAlignment(
    kickerDir,
    phraseAlign,
    slide.customKickerAlign,
    typography.kickerAlign
  );

  const getAlignContainerClass = (align: TextAlign) => {
    if (align === 'center') return 'text-center items-center';
    if (align === 'right') return 'text-right items-end';
    return 'text-left items-start';
  };

  const alignClass = getAlignContainerClass(phraseAlign);

  // Scaled typography sizes.
  // IMPORTANT — cohérence Aperçu ↔️ Export HD :
  // En mode "normal", ces tailles sont calculées avec EXACTEMENT la même
  // formule que renderSlideToCanvas() dans utils/canvasRenderer.ts
  // (baseSize = largeur × 0.048 × phraseScale, etc.), mais en remplaçant la
  // largeur du canvas d'export (ex. 1080px) par la largeur CSS réellement
  // affichée à l'écran (containerWidth, mesurée par ResizeObserver côté
  // parent). Le texte occupe ainsi la même proportion visuelle du cadre dans
  // l'aperçu que dans le PNG final, quel que soit la taille d'écran ou le
  // niveau de zoom du navigateur — corrige l'écart de dimension du texte
  // entre l'édition et l'export final.
  // En mode "compact" (grille de lot), on garde des tailles fixes réduites :
  // c'est une vue d'ensemble volontairement non-WYSIWYG, pas un espace
  // d'édition (voir README « Vue d'ensemble »).
  const phraseScale = slide.customTextScale ?? typography.fontSize ?? 1.1;
  const kickerScale = slide.customKickerScale ?? typography.kickerSize ?? 1.0;
  const subtitleScale = slide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;

  // Largeur de référence pour le calcul proportionnel : la largeur CSS
  // mesurée du conteneur (obtenue de façon synchrone dès le premier rendu via
  // useLayoutEffect, donc quasiment jamais 0 en pratique). Le repli sur
  // aspectRatio.width ne sert que si ResizeObserver était totalement
  // indisponible dans le navigateur — cas résiduel qui ne se produit plus
  // avec les navigateurs actuels.
  const referenceWidth = containerWidth && containerWidth > 0 ? containerWidth : aspectRatio.width;

  const previewBaseSize = referenceWidth * 0.048 * phraseScale;

  const computedPhraseFontSize = scale === 'compact'
    ? Math.max(9, Math.round(10.5 * phraseScale))
    : Math.max(1, Math.round(previewBaseSize));

  const computedKickerFontSize = scale === 'compact'
    ? Math.max(7, Math.round(7.5 * kickerScale))
    : Math.max(1, Math.round(previewBaseSize * 0.38 * kickerScale));

  const computedSubtitleFontSize = scale === 'compact'
    ? Math.max(7, Math.round(8 * subtitleScale))
    : Math.max(1, Math.round(previewBaseSize * 0.42 * subtitleScale));

  // Background image pan & zoom coordinates
  const panX = slide.imagePanX ?? 0;
  const panY = slide.imagePanY ?? 0;
  const zoom = slide.imageZoom ?? 1;

  // Compute Blur mask
  let blurMaskCss: string | undefined = undefined;
  if (effectiveBlur && effectiveBlur.enabled && effectiveBlur.blurAmount > 0) {
    const posY = effectiveBlur.positionY ?? (effectiveBlur.direction === 'top' ? 25 : effectiveBlur.direction === 'bottom' ? 75 : 50);
    const posX = effectiveBlur.positionX ?? 50;
    const size = effectiveBlur.blurSize ?? 50;

    if (effectiveBlur.direction === 'bottom') {
      blurMaskCss = `linear-gradient(to bottom, transparent ${Math.max(0, posY - size * 0.7)}%, black 100%)`;
    } else if (effectiveBlur.direction === 'top') {
      blurMaskCss = `linear-gradient(to top, transparent ${Math.max(0, 100 - (posY + size * 0.7))}%, black 100%)`;
    } else if (effectiveBlur.direction === 'center') {
      blurMaskCss = `linear-gradient(to bottom, transparent ${Math.max(0, posY - size / 2)}%, black ${posY}%, transparent ${Math.min(100, posY + size / 2)}%)`;
    } else if (effectiveBlur.direction === 'tilt-shift') {
      blurMaskCss = `linear-gradient(to bottom, black 0%, transparent ${Math.max(5, posY - size / 2)}%, transparent ${Math.min(95, posY + size / 2)}%, black 100%)`;
    } else if (effectiveBlur.direction === 'tilt-shift-vertical') {
      blurMaskCss = `linear-gradient(to right, black 0%, transparent 35%, transparent 65%, black 100%)`;
    } else if (effectiveBlur.direction === 'left') {
      blurMaskCss = `linear-gradient(to right, black 0%, transparent ${Math.min(100, posX + size * 0.5)}%)`;
    } else if (effectiveBlur.direction === 'right') {
      blurMaskCss = `linear-gradient(to left, black 0%, transparent ${Math.min(100, 100 - (posX - size * 0.5))}%)`;
    } else if (effectiveBlur.direction === 'radial') {
      blurMaskCss = `radial-gradient(circle at ${posX}% ${posY}%, transparent ${Math.max(5, 20 - size * 0.2)}%, black ${Math.min(95, 20 + size * 0.8)}%)`;
    } else if (effectiveBlur.direction === 'box') {
      blurMaskCss = `radial-gradient(ellipse at ${posX}% ${posY}%, black 0%, black ${Math.min(80, size * 0.8)}%, transparent 100%)`;
    }
  }

  // Text container position
  const isCustomSlidePos = slide.customTextX !== undefined && slide.customTextY !== undefined;
  const isFreePos = typography.position === 'free' || isCustomSlidePos;
  const textLeft = isCustomSlidePos ? slide.customTextX! : typography.freePositionX ?? 50;
  const textTop = isCustomSlidePos ? slide.customTextY! : typography.freePositionY ?? 75;

  const positionClass =
    typography.position === 'top'
      ? scale === 'compact' ? 'justify-start pt-2 sm:pt-3' : 'justify-start pt-12'
      : typography.position === 'center'
      ? 'justify-center'
      : scale === 'compact' ? 'justify-end pb-2 sm:pb-3' : 'justify-end pb-8';

  // Logo Scale (scaled down in compact mode to leave full space for text)
  const logoScale = (logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0)) * (scale === 'compact' ? 0.55 : 1.0);
  const isCustomLogoPos = logo.position === 'custom';

  return (
    <div
      dir="ltr"
      className="relative w-full h-full overflow-hidden select-none bg-neutral-950"
    >
      {/* Background Image with Zoom and Pan */}
      <img
        src={slide.imageUrl}
        alt={slide.imageAlt || 'Slide visual'}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
        style={{
          filter: `brightness(${slide.imageBrightness ?? 100}%)`,
          transform: `scale(${zoom})`,
          objectPosition: `${50 + panX}% ${50 + panY}%`,
        }}
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />

      {/* Gradient Blur Layer if enabled */}
      {effectiveBlur && effectiveBlur.enabled && effectiveBlur.blurAmount > 0 && (
        <img
          src={slide.imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 pointer-events-none"
          style={{
            filter: `brightness(${slide.imageBrightness ?? 100}%) blur(${effectiveBlur.blurAmount}px)`,
            transform: `scale(${zoom})`,
            objectPosition: `${50 + panX}% ${50 + panY}%`,
            opacity: effectiveBlur.opacity ?? 1,
            WebkitMaskImage: blurMaskCss,
            maskImage: blurMaskCss,
          }}
        />
      )}

      {/* Color Gradient Filter Overlay if enabled */}
      {effectiveFilter && effectiveFilter.enabled && effectiveFilter.preset !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${effectiveFilter.angle ?? 135}deg, ${effectiveFilter.colorStart}, ${effectiveFilter.colorEnd})`,
            mixBlendMode: effectiveFilter.blendMode === 'normal' ? 'normal' : effectiveFilter.blendMode,
            opacity: effectiveFilter.opacity ?? 0.5,
          }}
        />
      )}

      {/* Base Dark Dimming Tint */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: slide.customOverlayOpacity ?? 0.45 }}
      />

      {/* Overlay Image (Image de superposition drag & drop with rotation) */}
      {effectiveOverlay && effectiveOverlay.enabled && effectiveOverlay.url && (
        <div
          className={`absolute z-20 pointer-events-none transition-all duration-200 ${
            effectiveOverlay.position === 'center'
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : effectiveOverlay.position === 'top-left'
              ? scale === 'compact' ? 'top-2 left-2' : 'top-5 left-5'
              : effectiveOverlay.position === 'top-right'
              ? scale === 'compact' ? 'top-2 right-2' : 'top-5 right-5'
              : effectiveOverlay.position === 'bottom-left'
              ? scale === 'compact' ? 'bottom-2 left-2' : 'bottom-5 left-5'
              : effectiveOverlay.position === 'bottom-right'
              ? scale === 'compact' ? 'bottom-2 right-2' : 'bottom-5 right-5'
              : effectiveOverlay.position === 'top-center'
              ? scale === 'compact' ? 'top-2 left-1/2 -translate-x-1/2' : 'top-5 left-1/2 -translate-x-1/2'
              : effectiveOverlay.position === 'bottom-center'
              ? scale === 'compact' ? 'bottom-2 left-1/2 -translate-x-1/2' : 'bottom-5 left-1/2 -translate-x-1/2'
              : ''
          }`}
          style={{
            opacity: effectiveOverlay.opacity ?? 1,
            mixBlendMode: effectiveOverlay.blendMode === 'normal' ? 'normal' : effectiveOverlay.blendMode,
            transform: `${effectiveOverlay.position === 'custom' ? 'translate(-50%, -50%) ' : ''}${effectiveOverlay.rotation ? `rotate(${effectiveOverlay.rotation}deg)` : ''}`,
            ...(effectiveOverlay.position === 'custom'
              ? {
                  left: `${effectiveOverlay.customX ?? 50}%`,
                  top: `${effectiveOverlay.customY ?? 50}%`,
                }
              : {}),
            width: `${Math.round((scale === 'compact' ? 26 : 35) * (effectiveOverlay.scale ?? 1))}%`,
            maxWidth: '90%',
          }}
        >
          <img
            src={effectiveOverlay.url}
            alt="Superposition"
            className="w-full h-auto object-contain pointer-events-none drop-shadow-md select-none"
          />
        </div>
      )}

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
          className={`absolute z-10 flex items-center gap-1.5 sm:gap-2 pointer-events-none transition-all ${
            isCustomLogoPos
              ? ''
              : logo.position === 'top-left'
              ? 'top-0 left-0'
              : logo.position === 'top-center'
              ? 'top-0 left-1/2 -translate-x-1/2 text-center'
              : logo.position === 'top-right'
              ? 'top-0 right-0 text-right'
              : logo.position === 'center-left'
              ? 'top-1/2 left-0 -translate-y-1/2'
              : logo.position === 'center'
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center'
              : logo.position === 'center-right'
              ? 'top-1/2 right-0 -translate-y-1/2 text-right'
              : logo.position === 'bottom-left'
              ? 'bottom-0 left-0'
              : logo.position === 'bottom-center'
              ? 'bottom-0 left-1/2 -translate-x-1/2 text-center'
              : 'bottom-0 right-0 text-right'
          }`}
          style={{
            opacity: Math.max(0.05, Math.min(1, logo.opacity)),
            ...(isCustomLogoPos
              ? {
                  left: `${logo.customX ?? 10}%`,
                  top: `${logo.customY ?? 8}%`,
                  transform: `translate(-50%, -50%) ${logo.rotation ? `rotate(${logo.rotation}deg)` : ''}`.trim(),
                }
              : {
                  margin: `${logo.margin ?? (scale === 'compact' ? 4 : 6)}%`,
                  transform: `${
                    logo.position === 'top-center' || logo.position === 'bottom-center'
                      ? 'translateX(-50%) '
                      : logo.position === 'center-left' || logo.position === 'center-right'
                      ? 'translateY(-50%) '
                      : logo.position === 'center'
                      ? 'translate(-50%, -50%) '
                      : ''
                  }${logo.rotation ? `rotate(${logo.rotation}deg)` : ''}`.trim() || undefined,
                }),
          }}
        >
          {logo.type === 'custom' && logo.customUrl ? (
            logo.unifyColor && logo.unifiedColor ? (
              <div
                className="relative inline-flex items-center justify-center max-w-full max-h-full"
                style={{
                  maxWidth: `${Math.round((scale === 'compact' ? 90 : 280) * logoScale)}px`,
                  maxHeight: `${Math.round((scale === 'compact' ? 32 : 110) * logoScale)}px`,
                }}
              >
                <img
                  src={logo.customUrl}
                  alt=""
                  className="opacity-0 pointer-events-none select-none w-auto h-auto max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: `${Math.round((scale === 'compact' ? 90 : 280) * logoScale)}px`,
                    maxHeight: `${Math.round((scale === 'compact' ? 32 : 110) * logoScale)}px`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    WebkitMaskImage: `url("${logo.customUrl}")`,
                    maskImage: `url("${logo.customUrl}")`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    backgroundColor: logo.unifiedColor || '#ffffff',
                    filter: logo.invertColor ? 'invert(1)' : undefined,
                  }}
                />
              </div>
            ) : (
              <img
                src={logo.customUrl}
                alt="Logo Marque"
                style={{
                  maxWidth: `${Math.round((scale === 'compact' ? 90 : 280) * logoScale)}px`,
                  maxHeight: `${Math.round((scale === 'compact' ? 32 : 110) * logoScale)}px`,
                  filter: logo.invertColor ? 'invert(1)' : undefined,
                }}
                className="w-auto h-auto max-w-full max-h-full object-contain select-none pointer-events-none"
              />
            )
          ) : (
            <div
              dir="ltr"
              className={`flex items-center gap-2 ${
                logo.position.includes('center') && !logo.position.includes('left') && !logo.position.includes('right')
                  ? 'flex-col items-center text-center'
                  : logo.position.includes('right')
                  ? 'flex-row-reverse text-right items-center'
                  : 'flex-row text-left items-center'
              }`}
            >
              <div
                style={{
                  width: `${Math.round((scale === 'compact' ? 18 : 36) * logoScale)}px`,
                  height: `${Math.round((scale === 'compact' ? 18 : 36) * logoScale)}px`,
                  fontSize: `${Math.round((scale === 'compact' ? 8 : 14) * logoScale)}px`,
                  color: logo.unifyColor && logo.unifiedColor ? logo.unifiedColor : undefined,
                  borderColor: logo.unifyColor && logo.unifiedColor ? logo.unifiedColor : undefined,
                  filter: logo.invertColor && (!logo.unifyColor || !logo.unifiedColor) ? 'invert(1)' : undefined,
                }}
                className={`rounded-lg border flex items-center justify-center font-bold font-['Syne'] shrink-0 ${
                  logo.unifyColor && logo.unifiedColor
                    ? 'bg-black/30 backdrop-blur-sm'
                    : logo.theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : logo.theme === 'accent'
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-white/10 border-white/30 text-white backdrop-blur-sm'
                }`}
              >
                AP
              </div>
              <div
                dir={isArabicText(logo.brandText || '') ? 'rtl' : 'ltr'}
                className={`flex flex-col ${
                  logo.position.includes('center') && !logo.position.includes('left') && !logo.position.includes('right')
                    ? 'items-center text-center'
                    : logo.position.includes('right')
                    ? 'items-end text-right'
                    : 'items-start text-left'
                }`}
              >
                <span
                  style={{
                    fontSize: `${Math.round((scale === 'compact' ? 8.5 : 14) * logoScale)}px`,
                    color: logo.unifyColor && logo.unifiedColor ? logo.unifiedColor : undefined,
                    filter: logo.invertColor && (!logo.unifyColor || !logo.unifiedColor) ? 'invert(1)' : undefined,
                    fontFamily: isArabicText(logo.brandText || '') ? `'${arabicFontFamily}', sans-serif` : "'Syne', sans-serif",
                  }}
                  className="font-bold tracking-tight text-white leading-tight"
                >
                  {logo.brandText || 'AUTOPOST STUDIO'}
                </span>
                {logo.brandHandle && (
                  <span
                    dir="ltr"
                    style={{
                      fontSize: `${Math.max(7, Math.round((scale === 'compact' ? 7 : 10.5) * logoScale))}px`,
                      color: logo.unifyColor && logo.unifiedColor ? logo.unifiedColor : undefined,
                      filter: logo.invertColor && (!logo.unifyColor || !logo.unifiedColor) ? 'invert(1)' : undefined,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    className={`inline-block tabular-nums unicode-bidi-isolate ${
                      logo.unifyColor && logo.unifiedColor ? 'opacity-80' : 'text-neutral-300/80'
                    } font-medium`}
                  >
                    {logo.brandHandle.startsWith('@') ? logo.brandHandle : `@${logo.brandHandle}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Watermark / Filigrane Overlay */}
      {effectiveWatermark && effectiveWatermark.enabled && effectiveWatermark.text && (
        effectiveWatermark.style === 'repeated' ? (
          <div
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center select-none"
            style={{
              opacity: effectiveWatermark.opacity,
              transform: `rotate(${effectiveWatermark.rotation ?? -28}deg) scale(1.6)`,
            }}
          >
            <div className="flex flex-col gap-6 sm:gap-10 text-center">
              {Array.from({ length: 12 }).map((_, r) => (
                <div
                  key={r}
                  className="flex gap-10 sm:gap-16 whitespace-nowrap"
                  style={{ transform: r % 2 === 0 ? 'none' : 'translateX(60px)' }}
                >
                  {Array.from({ length: 10 }).map((_, c) => (
                    <span
                      key={c}
                      style={{
                        color: effectiveWatermark.color || '#ffffff',
                        fontSize: `${Math.round((scale === 'compact' ? 10 : 18) * (effectiveWatermark.scale ?? 1))}px`,
                        fontFamily: effectiveWatermark.fontFamily || "'Plus Jakarta Sans', sans-serif",
                      }}
                      className="font-bold tracking-wider"
                    >
                      {effectiveWatermark.text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`absolute z-20 pointer-events-none select-none transition-all ${
              effectiveWatermark.position === 'center'
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : effectiveWatermark.position === 'bottom-right'
                ? scale === 'compact' ? 'bottom-2 right-2' : 'bottom-4 right-4'
                : effectiveWatermark.position === 'bottom-left'
                ? scale === 'compact' ? 'bottom-2 left-2' : 'bottom-4 left-4'
                : effectiveWatermark.position === 'bottom-center'
                ? scale === 'compact' ? 'bottom-2 left-1/2 -translate-x-1/2' : 'bottom-4 left-1/2 -translate-x-1/2'
                : effectiveWatermark.position === 'top-right'
                ? scale === 'compact' ? 'top-2 right-2' : 'top-4 right-4'
                : effectiveWatermark.position === 'top-left'
                ? scale === 'compact' ? 'top-2 left-2' : 'top-4 left-4'
                : effectiveWatermark.position === 'top-center'
                ? scale === 'compact' ? 'top-2 left-1/2 -translate-x-1/2' : 'top-4 left-1/2 -translate-x-1/2'
                : ''
            }`}
            style={{
              opacity: effectiveWatermark.opacity,
              ...(effectiveWatermark.position === 'custom'
                ? {
                    left: `${effectiveWatermark.customX ?? 85}%`,
                    top: `${effectiveWatermark.customY ?? 92}%`,
                    transform: `translate(-50%, -50%) ${effectiveWatermark.rotation ? `rotate(${effectiveWatermark.rotation}deg)` : ''}`.trim(),
                  }
                : {
                    transform: `${
                      effectiveWatermark.position === 'top-center' || effectiveWatermark.position === 'bottom-center'
                        ? 'translateX(-50%) '
                        : effectiveWatermark.position === 'center'
                        ? 'translate(-50%, -50%) '
                        : ''
                    }${effectiveWatermark.rotation ? `rotate(${effectiveWatermark.rotation}deg)` : ''}`.trim() || undefined,
                  }),
            }}
          >
            <div
              style={{
                color: effectiveWatermark.color || '#ffffff',
                fontSize: `${Math.round((scale === 'compact' ? 9 : 14) * (effectiveWatermark.scale ?? 1))}px`,
                fontFamily: effectiveWatermark.fontFamily || "'Plus Jakarta Sans', sans-serif",
              }}
              className={`font-bold tracking-wider whitespace-nowrap ${
                effectiveWatermark.showBorder
                  ? 'px-3 py-1 rounded-full border border-white/30 bg-black/40 backdrop-blur-sm shadow'
                  : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
              }`}
            >
              {effectiveWatermark.text}
            </div>
          </div>
        )
      )}

      {/* Slide Counter (01 / 06) - Strictly LTR for numbers! */}
      {typography.showSlideNumber && (
        <div
          className={`absolute z-10 pointer-events-none ${
            scale === 'compact' ? 'bottom-1.5 right-2' : 'bottom-3 right-4'
          }`}
          dir="ltr"
        >
          <span
            className={`font-mono font-medium text-white/70 bg-black/40 rounded backdrop-blur inline-block ${
              scale === 'compact' ? 'text-[8px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
            }`}
          >
            {String(slide.number).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      {isFreePos ? (
        <div
          className={`absolute z-10 flex flex-col pointer-events-none ${alignClass}`}
          style={{
            left: `${textLeft}%`,
            top: `${textTop}%`,
            width: `${typography.textWidth ?? 88}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`w-full flex flex-col ${alignClass} ${boxClasses}`}
            style={typography.boxStyle === 'solid-card' ? { borderColor: kickerColor } : undefined}
          >
            {/* Kicker tag with user chosen kicker alignment, scale & color */}
            {typography.showKicker && slide.kicker && (
              <span
                dir={kickerDir}
                className={`font-bold tracking-widest uppercase mb-1 block w-full ${
                  kickerAlign === 'center'
                    ? 'text-center'
                    : kickerAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${scale === 'compact' ? 'line-clamp-1' : ''}`}
                style={{
                  color: kickerColor,
                  fontSize: `${computedKickerFontSize}px`,
                  fontFamily: `'${kickerFontName}', sans-serif`,
                }}
              >
                {renderBiDiText(slide.kicker, kickerIsArabic)}
              </span>
            )}

            {/* Main Phrase Text with dynamic Google font, BiDi & scaling */}
            <h2
              dir={phraseDir}
              className={`font-bold tracking-tight block w-full ${
                phraseAlign === 'center'
                  ? 'text-center'
                  : phraseAlign === 'right'
                  ? 'text-right'
                  : 'text-left'
              } ${scale === 'compact' ? 'line-clamp-4' : ''}`}
              style={{
                color: phraseColor,
                fontSize: `${computedPhraseFontSize}px`,
                lineHeight: typography.lineHeight ?? 1.3,
                fontFamily: `'${phraseFontName}', sans-serif`,
              }}
            >
              {renderBiDiText(slide.text, phraseIsArabic)}
            </h2>

            {/* Subtitle / Citation with phrase alignment & scale */}
            {typography.showSubtitle && slide.subtitle && (
              <p
                dir={subtitleDir}
                className={`mt-1 font-normal leading-relaxed block w-full ${
                  phraseAlign === 'center'
                    ? 'text-center'
                    : phraseAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${scale === 'compact' ? 'line-clamp-2' : ''}`}
                style={{
                  color: subtitleColor,
                  fontSize: `${computedSubtitleFontSize}px`,
                  fontFamily: `'${subtitleFontName}', sans-serif`,
                }}
              >
                {renderBiDiText(slide.subtitle, subtitleIsArabic)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`relative z-10 w-full h-full flex flex-col pointer-events-none ${positionClass} ${alignClass} ${
            scale === 'compact' ? 'p-2.5 sm:p-3' : 'p-6 sm:p-8'
          }`}
        >
          <div
            className={`w-full flex flex-col ${alignClass} ${boxClasses}`}
            style={{
              maxWidth: `${typography.textWidth ?? 88}%`,
              ...(typography.boxStyle === 'solid-card' ? { borderColor: kickerColor } : {}),
            }}
          >
            {/* Kicker tag with user chosen kicker alignment, scale & color */}
            {typography.showKicker && slide.kicker && (
              <span
                dir={kickerDir}
                className={`font-bold tracking-widest uppercase mb-1 block w-full ${
                  kickerAlign === 'center'
                    ? 'text-center'
                    : kickerAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${scale === 'compact' ? 'line-clamp-1' : ''}`}
                style={{
                  color: kickerColor,
                  fontSize: `${computedKickerFontSize}px`,
                  fontFamily: `'${kickerFontName}', sans-serif`,
                }}
              >
                {renderBiDiText(slide.kicker, kickerIsArabic)}
              </span>
            )}

            {/* Main Phrase Text with dynamic Google font, BiDi & scaling */}
            <h2
              dir={phraseDir}
              className={`font-bold tracking-tight block w-full ${
                phraseAlign === 'center'
                  ? 'text-center'
                  : phraseAlign === 'right'
                  ? 'text-right'
                  : 'text-left'
              } ${scale === 'compact' ? 'line-clamp-4' : ''}`}
              style={{
                color: phraseColor,
                fontSize: `${computedPhraseFontSize}px`,
                lineHeight: typography.lineHeight ?? 1.3,
                fontFamily: `'${phraseFontName}', sans-serif`,
              }}
            >
              {renderBiDiText(slide.text, phraseIsArabic)}
            </h2>

            {/* Subtitle / Citation with phrase alignment & scale */}
            {typography.showSubtitle && slide.subtitle && (
              <p
                dir={subtitleDir}
                className={`mt-1 font-normal leading-relaxed block w-full ${
                  phraseAlign === 'center'
                    ? 'text-center'
                    : phraseAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${scale === 'compact' ? 'line-clamp-2' : ''}`}
                style={{
                  color: subtitleColor,
                  fontSize: `${computedSubtitleFontSize}px`,
                  fontFamily: `'${subtitleFontName}', sans-serif`,
                }}
              >
                {renderBiDiText(slide.subtitle, subtitleIsArabic)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
