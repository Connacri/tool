import React from 'react';
import { Sparkles, Download, Check, RotateCcw, PenTool, Eye, Menu } from 'lucide-react';
import { AspectRatioType } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aspectRatio: AspectRatioType;
  onOpenBatchModal: () => void;
  onOpenExportModal: () => void;
  onQuickAiGenerate: () => void;
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
  onQuickAiGenerate,
  isAiGenerating,
  totalSlides,
  lastSaved,
  onResetToDefaults,
  mobileView,
  setMobileView,
}) => {
  const navTabs = [
    { id: 'slides', label: 'Diapos & Textes' },
    { id: 'media', label: 'Visuels' },
    { id: 'filters', label: 'Filtres & Dégradés' },
    { id: 'ratios', label: 'Formats & Ratios' },
    { id: 'typography', label: 'Typographie' },
    { id: 'branding', label: 'Logo & Marque' },
    { id: 'automation', label: 'Automatisation' },
  ];

  // Format last saved time
  const formattedTime = lastSaved
    ? new Date(lastSaved).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Zone 1: Single text element wordmark + Autosave indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        <a href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm group-hover:bg-indigo-500 transition-colors">
            AP
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-white font-['Syne'] truncate">
            AutoPost Studio
          </span>
        </a>

        {/* Auto-save Status Badge (Clean unboxed text) */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 pl-3 border-l border-neutral-800">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sauvegarde auto</span>
          </span>
          {formattedTime && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-neutral-400 tabular-nums text-[11px]">
                {formattedTime}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <button
            onClick={onResetToDefaults}
            className="text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            title="Réinitialiser toutes les données"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[11px]">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Desktop Navigation Links */}
      <nav className="hidden xl:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-800">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileView('editor');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile / Tablet View Switcher Toggle */}
      <div className="flex md:hidden items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
        <button
          onClick={() => setMobileView('editor')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
            mobileView === 'editor'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <PenTool className="w-3 h-3" />
          <span>Édition</span>
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
            mobileView === 'preview'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Aperçu</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onQuickAiGenerate}
          disabled={isAiGenerating}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-800 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
          title="Générer 6 nouvelles phrases percutantes par IA"
        >
          <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isAiGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isAiGenerating ? 'Génération IA...' : 'Inspirer (IA)'}
          </span>
          <span className="sm:hidden">IA</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exporter le lot</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
};
