import React, { useState, useMemo } from 'react';
import { X, FileText, Check, Sparkles, Info, Calendar, Lightbulb } from 'lucide-react';
import { SlideItem } from '../types';

interface BatchInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  setSlides: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  setCurrentSlideIndex: (idx: number) => void;
}

interface ParsedSlideInput {
  kicker?: string;
  text: string;
  subtitle?: string;
}

/**
 * Parses batch input text supporting both:
 * 1. Prefix format:
 *    :Titre ou Kicker:
 *    .Phrase principale
 *    /Sous-titre, citation ou /date d'aujourd'hui
 * 2. Standard format (1 phrase per line)
 */
function parseBatchInputText(rawText: string): ParsedSlideInput[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Check if prefix syntax is present
  const hasPrefixSyntax = lines.some(
    (l) => l.startsWith('.') || l.startsWith(':') || l.startsWith('/')
  );

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (!hasPrefixSyntax) {
    return lines.map((line) => ({
      text: line,
    }));
  }

  const result: ParsedSlideInput[] = [];
  let currentKicker: string | undefined = undefined;
  let currentText: string | undefined = undefined;
  let currentSubtitle: string | undefined = undefined;

  const pushCurrent = () => {
    if (currentText && currentText.trim().length > 0) {
      result.push({
        kicker: currentKicker,
        text: currentText.trim(),
        subtitle: currentSubtitle,
      });
      currentKicker = undefined;
      currentText = undefined;
      currentSubtitle = undefined;
    }
  };

  for (const line of lines) {
    if (line.startsWith(':')) {
      // If we already had a slide with text, push it first
      if (currentText) {
        pushCurrent();
      }
      let cleaned = line.replace(/^:+/, '').trim();
      cleaned = cleaned.replace(/:+$/, '').trim();
      currentKicker = cleaned;
    } else if (line.startsWith('.')) {
      // A dot indicates a new phrase
      if (currentText) {
        pushCurrent();
      }
      currentText = line.replace(/^\.+/, '').trim();
    } else if (line.startsWith('/')) {
      // Slash indicates subtitle / signature / date
      let sub = line.replace(/^\/+/, '').trim();
      if (/^date(\s+d'aujourd'hui)?$/i.test(sub) || sub.toLowerCase() === 'today') {
        sub = todayFormatted;
      }
      currentSubtitle = sub;
    } else {
      // Line without prefix
      if (!currentText) {
        currentText = line;
      } else {
        currentText += ' ' + line;
      }
    }
  }

  pushCurrent();
  return result;
}

export const BatchInputModal: React.FC<BatchInputModalProps> = ({
  isOpen,
  onClose,
  slides,
  setSlides,
  setCurrentSlideIndex,
}) => {
  const [rawText, setRawText] = useState<string>(() => {
    // Generate initial text from existing slides with the prefix syntax
    return slides
      .map((s) => {
        const parts: string[] = [];
        if (s.kicker) parts.push(`:${s.kicker}:`);
        if (s.text) parts.push(`.${s.text}`);
        if (s.subtitle) parts.push(`/${s.subtitle}`);
        return parts.join('\n');
      })
      .join('\n\n');
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const parsedSlides = useMemo(() => parseBatchInputText(rawText), [rawText]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedSlides.length === 0) return;

    const newSlides: SlideItem[] = parsedSlides.map((parsed, index) => {
      const existing = slides[index];
      const number = index + 1;
      return {
        id: existing?.id || `slide-${Date.now()}-${index}`,
        number,
        text: parsed.text,
        kicker: parsed.kicker || existing?.kicker || `CONSEIL #0${number}`,
        subtitle: parsed.subtitle || existing?.subtitle || `Épisode 0${number} · AutoPost Studio`,
        imageUrl: existing?.imageUrl || slides[0]?.imageUrl || '',
        imageZoom: existing?.imageZoom ?? 1,
        imageBrightness: existing?.imageBrightness ?? 100,
        customOverlayOpacity: existing?.customOverlayOpacity ?? 0.45,
        scheduledTime: existing?.scheduledTime,
      };
    });

    setSlides(newSlides);
    setCurrentSlideIndex(0);
    onClose();
  };

  const handleInsertStructuredSample = () => {
    const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const sample = [
      `:LES SECRETS DU MARKETING :`,
      `.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.`,
      `/${todayFormatted}`,
      ``,
      `:CROISSANCE & IMPACT :`,
      `.Ne cherchez pas plus de clients avant d'avoir des clients absolument émerveillés.`,
      `/AutoPost Studio`,
      ``,
      `:DISCIPLINE DIGITALE :`,
      `.La constance bat le talent chaque jour de la semaine sans aucune exception.`,
      `/Conseil #03`,
      ``,
      `:SIMPLICITÉ :`,
      `.Simplifiez vos messages jusqu'à ce qu'il ne reste que la pure quintessence.`,
      `/Guide Stratégique`,
      ``,
      `:INNOVATION :`,
      `.L'audace n'est pas l'absence de doute, mais la décision d'agir malgré lui.`,
      `/${todayFormatted}`,
      ``,
      `:CONCLUSION VIRALE :`,
      `.Construisez pour traverser les époques, pas seulement pour capter un buzz éphémère.`,
      `/Sauvegardez ce post`,
    ].join('\n');
    setRawText(sample);
  };

  const handleInsertSimpleSample = () => {
    const sample = [
      "La créativité n'est pas un don rare, c'est une façon audacieuse de regarder le monde.",
      "Chaque grand accomplissement commence par une seule idée exécutée avec discipline.",
      "La régularité bat l'intensité chaque jour de la semaine sans exception.",
      "Simplifiez sans compromis jusqu'à ce qu'il ne reste que la pure quintessence.",
      "Construisez pour traverser les époques, pas seulement pour capter l'attention éphémère.",
      "L'innovation émerge toujours à l'intersection exacte de la passion et de la rigueur.",
    ].join('\n');
    setRawText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne']">
                Coller un lot de phrases
              </h2>
              <p className="text-[11px] text-neutral-400">
                Supporte le format structuré (<span className="text-amber-400 font-mono">:Titre:</span>, <span className="text-indigo-400 font-mono">.Phrase</span>, <span className="text-emerald-400 font-mono">/Sous-titre</span>) ou simple (1 par ligne)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Syntax Helper Bar */}
        <div className="bg-neutral-950/60 px-4 sm:px-6 py-2.5 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-400 font-medium">Syntaxe astuce :</span>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
              <strong>:Titre :</strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
              <strong>.Phrase</strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
              <strong>/Signature ou /date</strong>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleInsertStructuredSample}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-950/40 hover:bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-800/60 transition-colors"
            >
              Exemple structuré
            </button>
            <button
              type="button"
              onClick={handleInsertSimpleSample}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-0.5 rounded hover:bg-neutral-800 transition-colors"
            >
              Exemple simple
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Tabs for Editor vs Live Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Texte brut ({rawText.split('\n').filter((l) => l.trim().length > 0).length} lignes)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Aperçu détecté</span>
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {parsedSlides.length}
                </span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-400">
              {parsedSlides.length} diapo{parsedSlides.length > 1 ? 's' : ''} détectée{parsedSlides.length > 1 ? 's' : ''}
            </span>
          </div>

          {activeTab === 'edit' ? (
            <div className="space-y-2">
              <textarea
                rows={11}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`:Les secrets du marketing :\n.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.\n/date d'aujourd'hui\n\n:Croissance & Impact :\n.Ne cherchez pas plus de clients avant d'avoir des clients émerveillés.\n/AutoPost Studio`}
                className="w-full p-3.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y custom-scrollbar"
              />

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-neutral-400">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-neutral-300 font-medium">Astuces pour aller encore plus vite :</p>
                  <p>
                    • Chaque <span className="text-indigo-400 font-semibold font-mono">.</span> (point) déclenche automatiquement une nouvelle diapo.
                  </p>
                  <p>
                    • Écrire <span className="text-emerald-400 font-semibold font-mono">/date</span> ou <span className="text-emerald-400 font-semibold font-mono">/date d'aujourd'hui</span> insère automatiquement la date actuelle en français.
                  </p>
                  <p>
                    • Vous pouvez aussi coller de simples phrases sans aucun préfixe : chaque ligne sera une diapo classique.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {parsedSlides.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-xs">
                  Aucun texte détecté. Tapez ou collez vos phrases dans l'onglet Texte brut.
                </div>
              ) : (
                parsedSlides.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-950 border border-neutral-800/90 rounded-xl flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-neutral-500">Diapo #{idx + 1}</span>
                      {item.kicker && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase tracking-wider text-[10px]">
                          {item.kicker}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      {item.text}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-mono">
                        <span>/</span>
                        <span>{item.subtitle}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-[11px] text-neutral-400">
              {parsedSlides.length > 0
                ? `${parsedSlides.length} diapo${parsedSlides.length > 1 ? 's seront créées' : ' sera créée'}`
                : 'Aucune diapo'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                disabled={parsedSlides.length === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-950/50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Appliquer ({parsedSlides.length} diapos)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
