import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Info,
  Check,
  RotateCcw,
  PenTool,
  Eye,
  Smartphone,
  Menu,
  X,
  Layers,
  Sliders,
  Type,
  Maximize2,
  Stamp,
  SlidersHorizontal,
} from 'lucide-react';
import { AspectRatioType } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aspectRatio: AspectRatioType;
  onOpenBatchModal: () => void;
  onOpenExportModal: () => void;
  onOpenAndroidModal: () => void;
  onOpenAboutModal: () => void;
  onQuickAiGenerate: () => void;
  onOpenAiModal?: () => void;
  isAiGenerating: boolean;
  totalSlides: number;
  lastSaved: number | null;
  onResetToDefaults: () => void;
  mobileView: 'editor' | 'preview';
  setMobileView: (view: 'editor' | 'preview') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenAndroidModal,
  onOpenAboutModal,
  onQuickAiGenerate,
  onOpenAiModal,
  isAiGenerating,
  totalSlides,
  lastSaved,
  onResetToDefaults,
  mobileView,
  setMobileView,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navTabs = [
    { id: 'slides', label: 'Diapos & Textes', icon: Layers },
    { id: 'media', label: 'Visuels', icon: Eye },
    { id: 'typography', label: 'Typo & Tailles', icon: Type },
    { id: 'overlay', label: 'Superposition', icon: Sliders },
    { id: 'filters', label: 'Filtres', icon: SlidersHorizontal },
    { id: 'ratios', label: 'Formats', icon: Maximize2 },
    { id: 'branding', label: 'Logo', icon: Stamp },
    { id: 'automation', label: 'Auto', icon: Sparkles },
  ];

  const formattedTime = lastSaved
    ? new Date(lastSaved).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Le menu deroulant tablette a ete remplace par la seconde ligne d'onglets,
  // qui reste accessible sur tous les ecrans sous 1280 px.

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
      {/* Main Top Bar */}
      <div className="h-14 sm:h-16 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-2 max-w-full overflow-hidden">
        {/* Left Section: Logo + Autosave */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a href="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform shrink-0">
              AP
            </div>
            {/* Le titre est affiche en entier : le logo occupe sa propre
                ligne sur mobile, il n'y a plus de raison de l'abreger,
                ce qui tronquait le nom de l'application. */}
            <span className="text-sm sm:text-base font-bold tracking-tight text-white font-['Syne'] truncate">
              AutoPost Studio
            </span>
          </a>

          {/* Autosave status badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 pl-2.5 border-l border-neutral-800/80">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px]">Enregistré</span>
            </span>
            {formattedTime && (
              <span className="font-mono text-neutral-400 tabular-nums text-[10px]">
                {formattedTime}
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Desktop Tabs (Visible on large screens) */}
        <nav className="hidden xl:flex items-center gap-0.5 bg-neutral-900/70 p-1 rounded-lg border border-neutral-800/80">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileView('editor');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Primary Actions
            Le selecteur de vue (Edition / Apercu) et les onglets ne sont plus
            ici : ils passent sur la seconde ligne, sous le logo. Sur mobile, six
            elements sur une seule ligne ecrataient le titre et poussaient le
            menu hors de l'ecran. */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* AI Generator Button - opens full AI Modal */}
          <button
            onClick={onOpenAiModal || onQuickAiGenerate}
            disabled={isAiGenerating}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
            title="Générer des phrases et social pack par IA"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAiGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isAiGenerating ? 'Génération...' : 'Générer (IA)'}
            </span>
            <span className="sm:hidden">IA</span>
          </button>

          {/* Android App Button */}
          <button
            onClick={onOpenAndroidModal}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors whitespace-nowrap"
            title="Application Mobile Android (APK & Play Store)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">App Android</span>
          </button>

          {/* About / version de l'application */}
          <button
            onClick={onOpenAboutModal}
            className="flex items-center p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
            title="À propos de l'application"
            aria-label="À propos de l'application"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-700/80 rounded-lg transition-colors whitespace-nowrap"
            title="Exporter tous les visuels en PNG ou ZIP"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Exporter</span>
            <span className="sm:hidden font-medium">Export</span>
          </button>

          {/* Mobile hamburger menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
            title="Menu des onglets"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ============================================================
          SECONDE LIGNE — mobile et tablette uniquement (xl:hidden)

          Sur grand ecran, les onglets restent au centre de la premiere
          ligne. En dessous de 1280 px, ils passent ici : le logo et le
          titre disposent alors de toute la largeur de la ligne 1, et le
          menu principal est sur sa propre ligne, complet, sans
          debordement horizontal ni element tronque.

          La bande defile horizontalement si les onglets debordent, ce
          qui est preferable a les rendre inaccessibles.
          ============================================================ */}
      <div className="xl:hidden border-t border-neutral-800/80 bg-neutral-950/98">
        <div className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Selecteur de vue : Edition / Apercu */}
          <div className="flex items-center bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800 shrink-0">
            <button
              onClick={() => setMobileView('editor')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                mobileView === 'editor'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Passer en mode éditeur"
            >
              <PenTool className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Édition</span>
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                mobileView === 'preview'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Passer en mode aperçu"
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
          </div>

          {/* Separateur */}
          <span className="w-px h-5 bg-neutral-800 shrink-0" aria-hidden="true" />

          {/* Menu principal */}
          <nav className="flex items-center gap-0.5 shrink-0">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileView('editor');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-neutral-800/80 bg-neutral-950/98 p-3 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
            Navigation dans les réglages
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileView('editor');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-neutral-900/70 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                onOpenAndroidModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Télécharger l'App Android</span>
            </button>

            <button
              onClick={() => {
                onResetToDefaults();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
