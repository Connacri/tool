import React, { useRef, useState } from 'react';
import {
  Type,
  Image as ImageIcon,
  Ratio,
  Sliders,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Palette,
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
} from 'lucide-react';
import { AspectRatioOption, AspectRatioType, ColorFilterConfig, GradientBlurConfig, LogoConfig, OverlayImageConfig, SlideItem, TextAlign, TextDirectionType, TypographyConfig, WebhookConfig } from '../types';
import { ARABIC_FONTS, ASPECT_RATIOS, COLOR_FILTER_PRESETS, PREDEFINED_LOGOS, PRESET_IMAGES } from '../constants/presets';
import { isArabicText } from '../utils/canvasRenderer';

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
  isAiGenerating: boolean;
  mobileView?: 'editor' | 'preview';
  gradientBlur: GradientBlurConfig;
  setGradientBlur: React.Dispatch<React.SetStateAction<GradientBlurConfig>>;
  colorFilter: ColorFilterConfig;
  setColorFilter: React.Dispatch<React.SetStateAction<ColorFilterConfig>>;
  overlayImage: OverlayImageConfig;
  setOverlayImage: React.Dispatch<React.SetStateAction<OverlayImageConfig>>;
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
  isAiGenerating,
  mobileView = 'editor',
  gradientBlur,
  setGradientBlur,
  colorFilter,
  setColorFilter,
  overlayImage,
  setOverlayImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const overlayFileInputRef = useRef<HTMLInputElement>(null);

  const activeSlide = slides[currentSlideIndex] || slides[0];

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
      className={`border-r border-neutral-800 bg-neutral-950 flex flex-col h-[calc(100vh-4rem)] shrink-0 transition-all ${
        mobileView === 'preview' ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'
      }`}
    >
      {/* Sub Tabs header for small screens / mobile */}
      <div className="flex lg:hidden overflow-x-auto p-2 border-b border-neutral-800 bg-neutral-900/40 gap-1 custom-scrollbar">
        {[
          { id: 'slides', label: 'Diapos' },
          { id: 'media', label: 'Médias' },
          { id: 'overlay', label: 'Superposition' },
          { id: 'filters', label: 'Filtres' },
          { id: 'ratios', label: 'Ratios' },
          { id: 'typography', label: 'Typo & Arabe' },
          { id: 'branding', label: 'Logo' },
          { id: 'automation', label: 'Export' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === t.id ? 'bg-neutral-800 text-white' : 'text-neutral-400'
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

                {/* Kicker / Category tag */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                    Titre Kicker / Thématique
                  </label>
                  <input
                    type="text"
                    value={activeSlide.kicker || ''}
                    onChange={(e) => updateActiveSlide({ kicker: e.target.value })}
                    placeholder="Ex: VISION & LEADERSHIP"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Main Phrase text */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                    Phrase Principale (Texte du visuel)
                  </label>
                  <textarea
                    rows={4}
                    value={activeSlide.text}
                    onChange={(e) => updateActiveSlide({ text: e.target.value })}
                    placeholder="Votre phrase ou citation percutante..."
                    className="w-full p-3 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Subtitle / Citation signature */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                    Sous-titre / Signature / Auteur
                  </label>
                  <input
                    type="text"
                    value={activeSlide.subtitle || ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                    placeholder="Ex: Épisode 01 · @moncompte"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Alignment & Direction Controls for this slide */}
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-300">
                      Alignement & Direction de texte
                    </span>
                    {isArabicText(`${activeSlide.kicker || ''} ${activeSlide.text || ''}`) && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300 font-medium">
                        Arabe détecté (RTL)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Main Phrase Alignment */}
                    <div>
                      <span className="block text-[10px] text-neutral-400 mb-1">
                        Alignement Phrase
                      </span>
                      <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                        {[
                          { id: 'left', icon: AlignLeft, title: 'Gauche' },
                          { id: 'center', icon: AlignCenter, title: 'Centré' },
                          { id: 'right', icon: AlignRight, title: 'Droite' },
                        ].map((al) => {
                          const Icon = al.icon;
                          const currentAlign =
                            activeSlide.customAlign || typography.phraseAlign || typography.align;
                          const isActive = currentAlign === al.id;
                          return (
                            <button
                              key={al.id}
                              onClick={() => {
                                updateActiveSlide({ customAlign: al.id as any });
                                setTypography((prev) => ({
                                  ...prev,
                                  align: al.id as any,
                                  phraseAlign: al.id as any,
                                }));
                              }}
                              title={al.title}
                              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                                isActive
                                  ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direction RTL / LTR / Auto */}
                    <div>
                      <span className="block text-[10px] text-neutral-400 mb-1">
                        Sens d'écriture
                      </span>
                      <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[10px]">
                        {[
                          { id: 'auto', label: 'Auto' },
                          { id: 'rtl', label: 'RTL (عربي)' },
                          { id: 'ltr', label: 'LTR' },
                        ].map((dir) => {
                          const currentDir =
                            activeSlide.customDirection || typography.direction || 'auto';
                          const isActive = currentDir === dir.id;
                          return (
                            <button
                              key={dir.id}
                              onClick={() => {
                                updateActiveSlide({ customDirection: dir.id as any });
                                setTypography((prev) => ({ ...prev, direction: dir.id as any }));
                              }}
                              className={`flex-1 py-1 rounded transition-colors ${
                                isActive
                                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              {dir.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500">
                    💡 Les nombres et compteurs (ex: 2026, 01/06) restent toujours lisibles de gauche à droite.
                  </p>
                </div>

                {/* Text Elements Resizing Controls */}
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <span className="text-[11px] font-semibold text-neutral-300 block">
                    Dimensions & Tailles des Textes (Échelle)
                  </span>

                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-neutral-400">Taille Phrase Principale</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round((activeSlide.phraseScale ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={activeSlide.phraseScale ?? 1}
                      onChange={(e) => updateActiveSlide({ phraseScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-neutral-400">Taille Kicker</span>
                        <span className="font-mono text-neutral-300">
                          {Math.round((activeSlide.kickerScale ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={activeSlide.kickerScale ?? 1}
                        onChange={(e) => updateActiveSlide({ kickerScale: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-neutral-400">Taille Sous-titre</span>
                        <span className="font-mono text-neutral-300">
                          {Math.round((activeSlide.subtitleScale ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={activeSlide.subtitleScale ?? 1}
                        onChange={(e) => updateActiveSlide({ subtitleScale: parseFloat(e.target.value) })}
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
                <h4 className="text-xs font-semibold text-white">Générer 6 phrases par IA</h4>
              </div>
              <p className="text-[11px] text-neutral-300 leading-normal">
                Créer instantanément un carrousel cohérent avec des accroches percutantes adaptées aux réseaux.
              </p>
              <button
                onClick={onQuickAiGenerate}
                disabled={isAiGenerating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'Génération en cours...' : 'Générer 6 nouvelles phrases'}</span>
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

                {/* Background Image Pan & Zoom framing controls */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <span className="text-xs font-semibold text-white block">
                    Cadrage & Repositionnement Photo
                  </span>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-400">Zoom Image</span>
                      <span className="font-mono text-neutral-200">
                        {Math.round((activeSlide.imageZoom ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={activeSlide.imageZoom ?? 1}
                      onChange={(e) =>
                        updateActiveSlide({ imageZoom: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Width / Height dimensions for custom shapes */}
                  {(gradientBlur.direction === 'custom-rect' || gradientBlur.direction === 'custom-circle' || gradientBlur.direction === 'radial') && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60">
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-neutral-400">Largeur / Diamètre</span>
                          <span className="font-mono text-neutral-200">{gradientBlur.width ?? 80}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={gradientBlur.width ?? 80}
                          onChange={(e) =>
                            setGradientBlur({ ...gradientBlur, width: parseInt(e.target.value) })
                          }
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      {gradientBlur.direction === 'custom-rect' && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-neutral-400">Hauteur Zone</span>
                            <span className="font-mono text-neutral-200">{gradientBlur.height ?? 40}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={gradientBlur.height ?? 40}
                            onChange={(e) =>
                              setGradientBlur({ ...gradientBlur, height: parseInt(e.target.value) })
                            }
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-neutral-400">Pan H. (X)</span>
                        <span className="font-mono text-neutral-300">
                          {activeSlide.imagePanX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeSlide.imagePanX ?? 50}
                        onChange={(e) =>
                          updateActiveSlide({ imagePanX: parseInt(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-neutral-400">Pan V. (Y)</span>
                        <span className="font-mono text-neutral-300">
                          {activeSlide.imagePanY ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeSlide.imagePanY ?? 50}
                        onChange={(e) =>
                          updateActiveSlide({ imagePanY: parseInt(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
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

            {/* Gradient Blur Section */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Filtre de Flou Dégradé</h4>
                  <p className="text-[10px] text-neutral-400">
                    Flou progressif pour sublimer la lisibilité du texte
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
                  <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {gradientBlur.enabled && (
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  {/* Direction */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                      Direction du Dégradé
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { id: 'bottom', label: 'Vers le Bas', desc: 'Texte en bas' },
                        { id: 'top', label: 'Vers le Haut', desc: 'Texte en haut' },
                        { id: 'tilt-shift', label: 'Tilt-Shift', desc: 'Bande nette' },
                        { id: 'radial', label: 'Radial', desc: 'Vignette' },
                        { id: 'full', label: 'Complet', desc: 'Flou total' },
                      ].map((dir) => (
                        <button
                          key={dir.id}
                          onClick={() =>
                            setGradientBlur({ ...gradientBlur, direction: dir.id as any })
                          }
                          className={`p-2 rounded-lg border text-center transition-colors ${
                            gradientBlur.direction === dir.id
                              ? 'bg-neutral-800 border-indigo-500 text-white font-medium'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="block text-[11px] font-semibold">{dir.label}</span>
                          <span className="block text-[9px] text-neutral-400">{dir.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blur Amount */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Intensité du flou</span>
                      <span className="font-mono text-neutral-200">
                        {gradientBlur.blurAmount}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      step="2"
                      value={gradientBlur.blurAmount}
                      onChange={(e) =>
                        setGradientBlur({
                          ...gradientBlur,
                          blurAmount: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Color Gradient Filter Section */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Filtre de Couleurs Dégradées</h4>
                  <p className="text-[10px] text-neutral-400">
                    Voile bicolore artistique (*duotone / mood filter*)
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
                  <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {colorFilter.enabled && (
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  {/* Preset Gradients */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                      Palettes Prédéfinies
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
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
                            className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                              style={{
                                background: `linear-gradient(${p.angle}deg, ${p.colorStart}, ${p.colorEnd})`,
                              }}
                            />
                            <span className="text-xs font-medium text-white truncate">
                              {p.name}
                            </span>
                          </button>
                        );
                      })}
                      {/* Custom option */}
                      <button
                        onClick={() =>
                          setColorFilter({ ...colorFilter, preset: 'custom' })
                        }
                        className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                          colorFilter.preset === 'custom'
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                          style={{
                            background: `linear-gradient(${colorFilter.angle}deg, ${colorFilter.colorStart}, ${colorFilter.colorEnd})`,
                          }}
                        />
                        <span className="text-xs font-medium text-white">Personnalisé</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom color pickers if custom is selected */}
                  {colorFilter.preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                      <div>
                        <span className="block text-[10px] text-neutral-400 mb-1">
                          Couleur Début
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
                          <span className="text-[11px] font-mono text-neutral-300">
                            {colorFilter.colorStart}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] text-neutral-400 mb-1">
                          Couleur Fin
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
                          <span className="text-[11px] font-mono text-neutral-300">
                            {colorFilter.colorEnd}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blend Mode and Angle */}
                  <div className="grid grid-cols-2 gap-2">
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
                        className="w-full px-2 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="overlay">Incrustation (Overlay)</option>
                        <option value="soft-light">Lumière douce</option>
                        <option value="multiply">Produit (Sombre)</option>
                        <option value="screen">Superposition (Clair)</option>
                        <option value="color">Couleur pure</option>
                        <option value="normal">Normal</option>
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
                        className="w-full px-2 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="0">0° (Horizontal)</option>
                        <option value="45">45° (Diagonal)</option>
                        <option value="90">90° (Vertical Haut)</option>
                        <option value="135">135° (Diagonal inverse)</option>
                        <option value="180">180° (Vertical Bas)</option>
                        <option value="270">270° (Inversé)</option>
                      </select>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Intensité du voile</span>
                      <span className="font-mono text-neutral-200">
                        {Math.round(colorFilter.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
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
              )}
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
                  {/* Direction buttons with visual hints */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                      Direction du Flou Dégradé
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'bottom', label: 'Vers le Bas', desc: 'Bas du visuel' },
                        { id: 'top', label: 'Vers le Haut', desc: 'Haut du visuel' },
                        { id: 'left', label: 'Vers la Gauche', desc: 'Gauche du visuel' },
                        { id: 'right', label: 'Vers la Droite', desc: 'Droite du visuel' },
                        { id: 'tilt-shift', label: 'Tilt-Shift', desc: 'Bande nette' },
                        { id: 'radial', label: 'Radial Center', desc: 'Vignette floue' },
                        { id: 'custom-rect', label: 'Zone Rectangulaire', desc: 'Cadre déplaçable' },
                        { id: 'custom-circle', label: 'Zone Circulaire', desc: 'Cercle déplaçable' },
                        { id: 'full', label: 'Flou Complet', desc: 'Fond ultra-doux' },
                      ].map((dir) => {
                        const isSelected = gradientBlur.direction === dir.id;
                        return (
                          <button
                            key={dir.id}
                            onClick={() =>
                              setGradientBlur({ ...gradientBlur, direction: dir.id as any })
                            }
                            className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 text-white'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-xs font-semibold">{dir.label}</span>
                            <span className="block text-[9px] text-neutral-400 mt-0.5">{dir.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Blur intensity slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-neutral-400 font-medium">Intensité du flou</span>
                      <span className="font-mono text-cyan-300 font-semibold">
                        {gradientBlur.blurAmount} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="28"
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
                    <div className="flex justify-between text-[9px] text-neutral-500 mt-1">
                      <span>Léger (4px)</span>
                      <span>Moyen (14px)</span>
                      <span>Prononcé (28px)</span>
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
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Typographie & Cadre</h3>
              <p className="text-xs text-neutral-400">
                Personnalisez la police, le positionnement et l'effet de superposition
              </p>
            </div>

            {/* Font Style Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Famille de Police
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'editorial', label: 'Éditorial Serif', sample: 'Fraunces' },
                  { id: 'avant-garde', label: 'Avant-Garde Bold', sample: 'Syne' },
                  { id: 'modern', label: 'Moderne Pro', sample: 'Jakarta' },
                  { id: 'mono', label: 'Code & Tech', sample: 'JetBrains' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      setTypography({ ...typography, fontStyle: f.id as any })
                    }
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      typography.fontStyle === f.id
                        ? 'bg-neutral-800 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-white">{f.label}</p>
                    <p className="text-[10px] text-neutral-400">{f.sample}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Box Style / Scrim */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
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
                    onClick={() =>
                      setTypography({ ...typography, boxStyle: b.id as any })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      typography.boxStyle === b.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-medium text-white">{b.label}</p>
                    <p className="text-[10px] text-neutral-400">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Placement & Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Position Verticale
                </label>
                <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTypography({ ...typography, position: pos })}
                      className={`flex-1 py-1 text-xs capitalize rounded ${
                        typography.position === pos
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pos === 'top' ? 'Haut' : pos === 'center' ? 'Milieu' : 'Bas'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Alignement Texte
                </label>
                <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                  {[
                    { id: 'left', icon: AlignLeft },
                    { id: 'center', icon: AlignCenter },
                    { id: 'right', icon: AlignRight },
                  ].map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        onClick={() =>
                          setTypography({ ...typography, align: al.id as any })
                        }
                        className={`flex-1 py-1 flex items-center justify-center rounded ${
                          typography.align === al.id
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-300">Taille de police relative</span>
                <span className="font-mono text-neutral-400">
                  {Math.round(typography.fontSize * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={typography.fontSize}
                onChange={(e) =>
                  setTypography({ ...typography, fontSize: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Meta Elements Toggles */}
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Logo & Marque</h3>
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
                    Téléverser Logo
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
                          className="h-10 mx-auto object-contain bg-white/10 p-1 rounded"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Changer le fichier logo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-neutral-300">
                          Logo PNG ou SVG transparent
                        </p>
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-2 px-3 py-1.5 bg-neutral-800 text-white rounded text-xs"
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

                {/* Logo Placement */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Emplacement du Logo
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'top-left', label: 'Haut Gauche' },
                      { id: 'top-right', label: 'Haut Droite' },
                      { id: 'bottom-left', label: 'Bas Gauche' },
                      { id: 'bottom-right', label: 'Bas Droite' },
                      { id: 'top-center', label: 'Haut Centré' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setLogo({ ...logo, position: pos.id as any })}
                        className={`py-1.5 px-2 text-xs rounded border text-center transition-colors ${
                          logo.position === pos.id
                            ? 'bg-neutral-800 border-indigo-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size and Opacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Taille
                    </label>
                    <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                      {(['small', 'medium', 'large'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setLogo({ ...logo, size: s })}
                          className={`flex-1 py-1 text-xs rounded capitalize ${
                            logo.size === s
                              ? 'bg-neutral-800 text-white'
                              : 'text-neutral-400'
                          }`}
                        >
                          {s === 'small' ? 'S' : s === 'medium' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Opacité ({Math.round(logo.opacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.05"
                      value={logo.opacity}
                      onChange={(e) =>
                        setLogo({ ...logo, opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500 mt-2"
                    />
                  </div>
                </div>

                {/* Custom Logo Scale multiplier for active slide */}
                {activeSlide && (
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-300">Échelle Sur-Mesure (Diapo #{activeSlide.number})</span>
                      <span className="font-mono text-indigo-400">
                        {Math.round((activeSlide.logoScale ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={activeSlide.logoScale ?? 1}
                      onChange={(e) =>
                        updateActiveSlide({ logoScale: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500"
                    />
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
