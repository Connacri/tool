import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  CheckCheck,
  Check,
  Lightbulb,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface BatchFormatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSample?: () => void;
  onCopyTemplate?: () => void;
}

export const BatchFormatInfoModal: React.FC<BatchFormatInfoModalProps> = ({
  isOpen,
  onClose,
  onInsertSample,
  onCopyTemplate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleCopy = () => {
    if (onCopyTemplate) {
      onCopyTemplate();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const template = `:Titre de la diapo :\n.Votre phrase principale percutante.\n/date d'aujourd'hui\n\n:Deuxième titre :\n.Deuxième phrase percutante.\n/Votre signature`;
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onInsertSample) {
      onInsertSample();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <span>Format requis pour coller un lot</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Guide pratique
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Découpez automatiquement vos diapos en quelques secondes grâce à 3 préfixes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Overview Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-neutral-950 to-neutral-950 border border-indigo-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white text-xs">
                Chaque ligne débute par un symbole qui indique son rôle :
              </p>
              <p className="text-neutral-300 text-[11.5px] leading-relaxed">
                Le symbole <strong className="text-indigo-300 font-mono">.</strong> (point) est le plus important : <strong className="text-white">chaque point crée automatiquement une nouvelle diapo</strong> dans votre carrousel.
              </p>
            </div>
          </div>

          {/* 3 Main Rules Cards */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-1.5">
              <span>Les 3 éléments du format :</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Element 1 : Titre */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-amber-500/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 border border-amber-500/30 text-base">
                    :
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">:Titre :</span>
                      <span className="text-[10px] text-amber-400/90 font-medium">Titre Kicker en haut</span>
                      <span className="text-[9.5px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-mono">Optionnel</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Commencez la ligne par deux-points <code className="text-amber-300 font-mono">:</code> pour le titre de catégorie ou l'accroche en majuscules.
                    </p>
                  </div>
                </div>
                <div className="sm:self-center shrink-0">
                  <span className="font-mono text-[11px] text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2 py-1 rounded-md block">
                    :Les secrets du marketing :
                  </span>
                </div>
              </div>

              {/* Element 2 : Phrase (Primary) */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-indigo-500/40 bg-indigo-950/10 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center shrink-0 border border-indigo-500/40 text-base">
                    .
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">.Phrase</span>
                      <span className="text-[10px] text-indigo-300 font-semibold">Phrase principale du visuel</span>
                      <span className="text-[9.5px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">Obligatoire</span>
                    </div>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      Commencez la ligne par un point <code className="text-indigo-300 font-mono font-bold">.</code>. <strong className="text-white">Chaque point indique au système de créer une nouvelle diapo</strong>.
                    </p>
                  </div>
                </div>
                <div className="sm:self-center shrink-0">
                  <span className="font-mono text-[11px] text-indigo-200 bg-indigo-950/60 border border-indigo-700/60 px-2 py-1 rounded-md block max-w-xs truncate">
                    .Votre attention est précieuse...
                  </span>
                </div>
              </div>

              {/* Element 3 : Signature / Date */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-base">
                    /
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">/Signature ou Date</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Sous-titre ou signature</span>
                      <span className="text-[9.5px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-mono">Optionnel</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Commencez par <code className="text-emerald-300 font-mono">/</code> pour ajouter une signature, un compte ou un auteur.
                    </p>
                    <p className="text-[10.5px] text-emerald-300/90 flex items-center gap-1 font-medium pt-0.5">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>Tapez <strong>/date d'aujourd'hui</strong> ou <strong>/date</strong> pour insérer la date du jour automatiquement !</span>
                    </p>
                  </div>
                </div>
                <div className="sm:self-center shrink-0">
                  <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-md block">
                    /date d'aujourd'hui
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Side-by-Side: Input vs Result Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Démonstration : du texte brut au visuel</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              {/* Left: Raw text */}
              <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
                    1. Ce que vous collez :
                  </span>
                  <div className="font-mono text-[11px] leading-relaxed p-2.5 rounded bg-neutral-950 border border-neutral-800/80 space-y-1">
                    <p className="text-amber-300">:Les secrets du marketing :</p>
                    <p className="text-indigo-300">.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.</p>
                    <p className="text-emerald-300">/date d'aujourd'hui</p>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 mt-2">
                  (Répétez ce bloc pour chaque diapo souhaitée)
                </p>
              </div>

              {/* Right: Rendered slide mockup */}
              <div className="p-3 rounded-lg bg-neutral-900/90 border border-indigo-500/30 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1.5">
                  2. Ce que le studio génère :
                </span>
                <div className="relative p-4 rounded-lg bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 shadow-inner flex flex-col justify-between min-h-[140px]">
                  {/* Kicker badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      LES SECRETS DU MARKETING
                    </span>
                    <span className="text-[8px] font-mono text-neutral-500">01 / 06</span>
                  </div>

                  {/* Main text */}
                  <p className="text-xs text-white font-bold my-2 leading-snug">
                    Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.
                  </p>

                  {/* Subtitle / Date */}
                  <div className="text-[9.5px] text-emerald-400 font-mono flex items-center gap-1">
                    <span>/</span>
                    <span>{todayFormatted}</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Mise en page automatique avec typographie et centrage</span>
                </p>
              </div>
            </div>
          </div>

          {/* Good to know bullet points */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
            <p className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Bon à savoir :</span>
            </p>
            <p>
              • <strong>Sauts de ligne :</strong> Vous pouvez aérer votre texte avec des lignes vides entre vos diapos, elles sont automatiquement ignorées.
            </p>
            <p>
              • <strong>Deux-points optionnels :</strong> Écrire <code className="text-amber-300 font-mono">:Titre</code> ou <code className="text-amber-300 font-mono">:Titre :</code> fonctionne de la même manière.
            </p>
            <p>
              • <strong>Format simple :</strong> Si vous préférez, vous pouvez aussi coller une simple liste de phrases sans aucun symbole (1 phrase par ligne).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Modèle copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copier le modèle vierge</span>
                </>
              )}
            </button>

            {onInsertSample && (
              <button
                type="button"
                onClick={handleInsert}
                className="px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Insérer cet exemple</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-md shadow-indigo-950/40"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};
