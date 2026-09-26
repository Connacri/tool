import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { EditorSidebar } from './components/EditorSidebar';
import { CanvasPreview } from './components/CanvasPreview';
import { AutomatedExportModal } from './components/AutomatedExportModal';
import { BatchInputModal } from './components/BatchInputModal';
import { SocialCopyModal } from './components/SocialCopyModal';
import {
  ASPECT_RATIOS,
  INITIAL_LOGO,
  INITIAL_SLIDES,
  INITIAL_TYPOGRAPHY,
} from './constants/presets';
import { AspectRatioOption, LogoConfig, SlideItem, TypographyConfig } from './types';
import {
  loadSavedSlides,
  loadSavedAspectRatio,
  loadSavedTypography,
  loadSavedLogo,
  saveAllToLocalStorage,
  resetSavedData,
  getLastSavedTimestamp,
} from './utils/storage';

export default function App() {
  // Load initial states from localStorage with graceful fallback to presets
  const [slides, setSlides] = useState<SlideItem[]>(() => loadSavedSlides());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() => loadSavedAspectRatio());
  const [typography, setTypography] = useState<TypographyConfig>(() => loadSavedTypography());
  const [logo, setLogo] = useState<LogoConfig>(() => loadSavedLogo());
  const [activeTab, setActiveTab] = useState<string>('slides');

  // Mobile layout view switcher ('editor' vs 'preview')
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('preview');

  // Autosave status timestamp
  const [lastSaved, setLastSaved] = useState<number | null>(() => getLastSavedTimestamp());

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSocialCopyModalOpen, setIsSocialCopyModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Ref to prevent initial double-save
  const isFirstRender = useRef(true);

  // Automatic saving in localStorage whenever slides, aspect ratio, typography or logo change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const result = saveAllToLocalStorage(slides, aspectRatio, typography, logo);
      if (result.success) {
        setLastSaved(result.timestamp);
      }
    }, 300); // 300ms debounce for high performance

    return () => clearTimeout(timer);
  }, [slides, aspectRatio, typography, logo]);

  // Reset all data back to original default templates
  const handleResetToDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les diapos et paramètres aux valeurs d\'origine ?')) {
      resetSavedData();
      setSlides(INITIAL_SLIDES);
      setCurrentSlideIndex(0);
      setAspectRatio(ASPECT_RATIOS[0]);
      setTypography(INITIAL_TYPOGRAPHY);
      setLogo(INITIAL_LOGO);
      setLastSaved(Date.now());
    }
  };

  // AI batch phrases generator
  const handleQuickAiGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/generate-phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Croissance, Discipline et Créativité',
          count: 6,
          tone: 'Inspirant, Percurtant et Professionnel',
          language: 'fr',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.phrases && Array.isArray(data.phrases) && data.phrases.length > 0) {
          const updated: SlideItem[] = data.phrases.map((p: any, idx: number) => {
            const existing = slides[idx] || slides[0];
            return {
              id: `slide-ai-${Date.now()}-${idx}`,
              number: idx + 1,
              text: p.text || existing.text,
              kicker: p.kicker || existing.kicker,
              subtitle: p.subtitle || existing.subtitle,
              imageUrl: existing.imageUrl,
              imageZoom: existing.imageZoom ?? 1,
              imageBrightness: existing.imageBrightness ?? 100,
              customOverlayOpacity: existing.customOverlayOpacity ?? 0.45,
              scheduledTime: existing.scheduledTime,
            };
          });
          setSlides(updated);
          setCurrentSlideIndex(0);
          setIsAiGenerating(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Fallback creative batch if API key is not ready or offline
    const fallbackQuotes = [
      { text: "Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.", kicker: "FOCUS TOTAL" },
      { text: "Ne cherchez pas à tout faire en un jour, mais faites une chose remarquable aujourd'hui.", kicker: "PRIORITÉ ABSOLUE" },
      { text: "Le meilleur moment pour commencer était hier, le second meilleur moment est maintenant.", kicker: "ACTION IMMÉDIATE" },
      { text: "La clarté précède toujours le succès : sachez exactement où vous voulez aller.", kicker: "VISION STRATÉGIQUE" },
      { text: "Les détails ne sont pas des détails : ils définissent la qualité de l'ensemble.", kicker: "EXCELLENCE & CRAFT" },
      { text: "Osez penser différemment quand tout le monde suit la même trajectoire prévisible.", kicker: "AUDACE & AUDIENCE" },
    ];

    const fallbackSlides: SlideItem[] = fallbackQuotes.map((item, idx) => {
      const existing = slides[idx] || slides[0];
      return {
        ...existing,
        number: idx + 1,
        text: item.text,
        kicker: item.kicker,
        subtitle: `Épisode 0${idx + 1} · AutoPost Studio`,
      };
    });

    setSlides(fallbackSlides);
    setCurrentSlideIndex(0);
    setIsAiGenerating(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased">
      {/* 3-Zone Header Contract with Autosave indicator and responsive mode toggle */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aspectRatio={aspectRatio.id}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onQuickAiGenerate={handleQuickAiGenerate}
        isAiGenerating={isAiGenerating}
        totalSlides={slides.length}
        lastSaved={lastSaved}
        onResetToDefaults={handleResetToDefaults}
        mobileView={mobileView}
        setMobileView={setMobileView}
      />

      {/* Main Workspace: Sidebar Controls + Studio Canvas */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <EditorSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          slides={slides}
          setSlides={setSlides}
          currentSlideIndex={currentSlideIndex}
          setCurrentSlideIndex={setCurrentSlideIndex}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          typography={typography}
          setTypography={setTypography}
          logo={logo}
          setLogo={setLogo}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSocialCopyModal={() => setIsSocialCopyModalOpen(true)}
          onQuickAiGenerate={handleQuickAiGenerate}
          isAiGenerating={isAiGenerating}
          mobileView={mobileView}
        />

        <CanvasPreview
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          setCurrentSlideIndex={setCurrentSlideIndex}
          aspectRatio={aspectRatio}
          typography={typography}
          logo={logo}
          onSelectSlide={(idx) => {
            setCurrentSlideIndex(idx);
            setActiveTab('slides');
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          mobileView={mobileView}
          setMobileView={setMobileView}
        />
      </div>

      {/* Modals */}
      <AutomatedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        slides={slides}
        aspectRatio={aspectRatio}
        typography={typography}
        logo={logo}
      />

      <BatchInputModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        slides={slides}
        setSlides={setSlides}
        setCurrentSlideIndex={setCurrentSlideIndex}
      />

      <SocialCopyModal
        isOpen={isSocialCopyModalOpen}
        onClose={() => setIsSocialCopyModalOpen(false)}
        slides={slides}
        currentSlideIndex={currentSlideIndex}
      />
    </div>
  );
}
