import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Check,
  Calendar,
  Lightbulb,
  BookOpen,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
} from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'guide'>('edit');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [copiedSample, setCopiedSample] = useState(false);

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

  const handleInsertUserSample = () => {
    const sample = [
      `:Les secrets du marketing :`,
      `.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.`,
      `/date d'aujourd'hui`,
      ``,
      `:Croissance & Impact :`,
      `.Ne cherchez pas plus de clients avant d'avoir des clients absolument émerveillés.`,
      `/AutoPost Studio`,
      ``,
      `:Discipline Digitale :`,
      `.La constance bat le talent chaque jour de la semaine sans aucune exception.`,
      `/Conseil #03`,
    ].join('\n');
    setRawText(sample);
    setActiveTab('edit');
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
    setActiveTab('edit');
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
    setActiveTab('edit');
  };

  const handleCopyTemplate = () => {
    const template = `:Titre de la diapo :\n.Votre phrase principale percutante.\n/date d'aujourd'hui\n\n:Deuxième titre :\n.Deuxième phrase percutante.\n/Votre signature`;
    navigator.clipboard.writeText(template);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne']">
                Coller un lot de phrases
              </h2>
              <p className="text-[11px] text-neutral-400">
                Génération rapide de tout un carrousel en copiant-collant vos textes
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

        {/* Syntax Quick Helper Bar */}
        <div className="bg-neutral-950/70 px-4 sm:px-6 py-2 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-400 font-medium">Syntaxe :</span>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/25 px-1.5 py-0.5 rounded font-mono">
              <strong>:Titre :</strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-1.5 py-0.5 rounded font-mono">
              <strong>.Phrase</strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono">
              <strong>/Signature ou /date</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertUserSample}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium bg-amber-950/40 hover:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-800/60 transition-colors flex items-center gap-1"
              title="Insérer l'exemple type :Titre: .Phrase /date"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Exemple type</span>
            </button>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              title="Copier le modèle dans le presse-papier"
            >
              {copiedSample ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-neutral-400" />
                  <span>Copier modèle</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Tabs for Editor vs Live Preview vs Interactive Guide */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'guide'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mode d'emploi</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-400">
              {parsedSlides.length} diapo{parsedSlides.length > 1 ? 's' : ''} prête{parsedSlides.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* TAB 1: TEXT EDITOR */}
          {activeTab === 'edit' && (
            <div className="space-y-3">
              {/* Collapsible Explanatory Guide Box */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white">
                      Comment formater vos phrases pour découper vos diapos ?
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <span>{isGuideOpen ? 'Réduire' : 'Afficher l\'explication'}</span>
                    {isGuideOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {isGuideOpen && (
                  <div className="px-3.5 pb-3 pt-1 border-t border-neutral-800/80 text-[11px] space-y-2.5">
                    <p className="text-neutral-300">
                      Vous pouvez écrire ou coller vos diapos directement en utilisant 3 symboles très simples :
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Step 1: Titre */}
                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-amber-500/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                            <span>: Titre Kicker :</span>
                          </div>
                          <p className="text-neutral-400 text-[10.5px] leading-tight">
                            Commencez par <code className="text-amber-300 font-mono">:</code> pour le titre de catégorie en haut.
                          </p>
                        </div>
                        <div className="mt-2 bg-neutral-950 p-1.5 rounded font-mono text-[10px] text-amber-200/90 border border-neutral-800">
                          :Les secrets du marketing :
                        </div>
                      </div>

                      {/* Step 2: Phrase */}
                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-indigo-500/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-indigo-300 font-bold mb-1">
                            <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">2</span>
                            <span>. Phrase principale</span>
                          </div>
                          <p className="text-neutral-400 text-[10.5px] leading-tight">
                            Commencez par un point <code className="text-indigo-300 font-mono">.</code>. <strong className="text-neutral-200">Chaque point crée une nouvelle diapo !</strong>
                          </p>
                        </div>
                        <div className="mt-2 bg-neutral-950 p-1.5 rounded font-mono text-[10px] text-indigo-200/90 border border-neutral-800">
                          .Votre attention est précieuse...
                        </div>
                      </div>

                      {/* Step 3: Sous-titre */}
                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-emerald-500/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                            <span>/ Signature ou Date</span>
                          </div>
                          <p className="text-neutral-400 text-[10.5px] leading-tight">
                            Commencez par <code className="text-emerald-300 font-mono">/</code>. Tapez <code className="text-emerald-300 font-mono">/date</code> pour la date du jour automatique !
                          </p>
                        </div>
                        <div className="mt-2 bg-neutral-950 p-1.5 rounded font-mono text-[10px] text-emerald-200/90 border border-neutral-800">
                          /date d'aujourd'hui
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Collez ou tapez votre texte ci-dessous :</span>
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="text-neutral-500 hover:text-neutral-300 underline"
                  >
                    Effacer tout
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`:Les secrets du marketing :\n.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.\n/date d'aujourd'hui\n\n:Croissance & Impact :\n.Ne cherchez pas plus de clients avant d'avoir des clients émerveillés.\n/AutoPost Studio`}
                  className="w-full p-3.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y custom-scrollbar"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-neutral-500">Insérer un modèle pré-rempli :</span>
                  <button
                    type="button"
                    onClick={handleInsertUserSample}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1"
                  >
                    <span>Modèle avec votre syntaxe</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertStructuredSample}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  >
                    Lot complet (6 diapos)
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertSimpleSample}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  >
                    Format simple (1 par ligne)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETECTED LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {parsedSlides.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                  <p>Aucun texte détecté.</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Tapez ou collez vos phrases dans l'onglet « Texte brut » ou cliquez sur « Exemple type ».
                  </p>
                </div>
              ) : (
                parsedSlides.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-neutral-950 border border-neutral-800/90 rounded-xl flex flex-col gap-2 transition-all hover:border-indigo-500/40"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-neutral-400 font-semibold">
                        Diapo #{idx + 1}
                      </span>
                      {item.kicker ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider text-[10px]">
                          {item.kicker}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">Sans titre</span>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/60">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      {item.subtitle ? (
                        <p className="text-emerald-400/90 flex items-center gap-1 font-mono text-[10.5px]">
                          <span className="text-emerald-500 font-bold">/</span>
                          <span>{item.subtitle}</span>
                        </p>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">Sans signature</span>
                      )}
                      <span className="text-[10px] font-mono text-neutral-500">
                        {item.text.length} caractères
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ILLUSTRATED USER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 max-h-[390px] overflow-y-auto custom-scrollbar pr-1 text-xs">
              {/* Introduction Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-neutral-950 to-neutral-950 border border-indigo-500/30">
                <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Comment fonctionne le collage par lot ?</span>
                </h3>
                <p className="text-neutral-300 text-[11px] mt-1 leading-relaxed">
                  Au lieu de modifier chaque diapo une par une, vous pouvez copier-coller tout votre contenu d'un coup. Le système découpe automatiquement les diapos grâce à 3 préfixes au début de chaque ligne.
                </p>
              </div>

              {/* The 3 Core Rules with Visual Illustration */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-neutral-400">
                  Les 3 règles simples à retenir :
                </h4>

                {/* Rule 1 */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 border border-amber-500/30 text-sm">
                    :
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Deux-points = Le Titre (Kicker)</span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Optionnel</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Commencez la ligne par <code className="text-amber-300 font-mono">:</code> pour définir le titre thématique en haut de la diapo (ex: <code className="text-amber-300 font-mono">:Les secrets du marketing :</code>).
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 text-sm">
                    .
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Le Point = La Phrase Principale</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">Créateur de diapo</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Commencez la ligne par un point <code className="text-indigo-300 font-mono">.</code>. <strong className="text-neutral-200">C'est le point qui indique au système qu'il s'agit d'une nouvelle diapo !</strong> Chaque point crée la diapo suivante (ex: <code className="text-indigo-300 font-mono">.Votre attention est votre ressource la plus précieuse...</code>).
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-sm">
                    /
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Le Slash = Le Sous-titre ou la Signature</span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Optionnel</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Commencez par un slash <code className="text-emerald-300 font-mono">/</code> pour ajouter une signature, un auteur ou un appel à l'action.
                    </p>
                    <p className="text-[10.5px] text-emerald-400/90 font-medium">
                      💡 <strong>Astuce magique date :</strong> Écrivez simplement <code className="font-mono bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/60">/date d'aujourd'hui</code> ou <code className="font-mono bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/60">/date</code> pour insérer automatiquement la date du jour en toutes lettres (ex: {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}) !
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Real-world Example Box */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Exemple complet prêt à tester</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleInsertUserSample}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>Charger dans l'éditeur</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-neutral-900 p-3 rounded-lg font-mono text-[11px] text-neutral-300 border border-neutral-800/80 leading-relaxed whitespace-pre-wrap">
                  <span className="text-amber-300">:Les secrets du marketing :</span>{'\n'}
                  <span className="text-indigo-300">.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.</span>{'\n'}
                  <span className="text-emerald-300">/date d'aujourd'hui</span>{'\n\n'}
                  <span className="text-amber-300">:Croissance & Impact :</span>{'\n'}
                  <span className="text-indigo-300">.Ne cherchez pas plus de clients avant d'avoir des clients absolument émerveillés.</span>{'\n'}
                  <span className="text-emerald-300">/AutoPost Studio</span>
                </div>
              </div>

              {/* FAQ / Clarification */}
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/70 space-y-2 text-[11px] text-neutral-400">
                <p className="font-semibold text-neutral-200">Questions fréquentes :</p>
                <p>
                  • <strong>Et si je n'ai pas de titre ou de sous-titre ?</strong><br />
                  Mettez simplement votre phrase commençant par un point (ex: <code className="text-indigo-300 font-mono">.Ma phrase seule</code>).
                </p>
                <p>
                  • <strong>Est-ce que je peux sauter des lignes ?</strong><br />
                  Oui, vous pouvez aérer vos diapos avec des sauts de ligne vides, le système les ignore automatiquement.
                </p>
                <p>
                  • <strong>Et si je veux coller une liste simple sans symboles ?</strong><br />
                  Collez simplement 1 phrase par ligne sans aucun symbole : chaque ligne deviendra une diapo classique.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-[11px] text-neutral-400">
              {parsedSlides.length > 0
                ? `${parsedSlides.length} diapo${parsedSlides.length > 1 ? 's seront créées' : ' sera créée'}`
                : 'Aucune diapo détectée'}
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
