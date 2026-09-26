import React, { useState } from 'react';
import { X, Sparkles, FileText, Check } from 'lucide-react';
import { SlideItem } from '../types';

interface BatchInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  setSlides: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  setCurrentSlideIndex: (idx: number) => void;
}

export const BatchInputModal: React.FC<BatchInputModalProps> = ({
  isOpen,
  onClose,
  slides,
  setSlides,
  setCurrentSlideIndex,
}) => {
  const [rawText, setRawText] = useState<string>(() =>
    slides.map((s) => s.text).join('\n')
  );

  if (!isOpen) return null;

  const handleApply = () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newSlides: SlideItem[] = lines.map((line, index) => {
      // If we already have a slide at this index, keep its image and subtitle
      const existing = slides[index];
      const number = index + 1;
      return {
        id: existing?.id || `slide-${Date.now()}-${index}`,
        number,
        text: line,
        kicker: existing?.kicker || `CONSEIL #0${number}`,
        subtitle: existing?.subtitle || `Épisode 0${number} · AutoPost Studio`,
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

  const handleInsertSample = () => {
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white font-['Syne']">
              Coller un lot de phrases
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300">
              Collez vos phrases (1 phrase par ligne)
            </label>
            <button
              onClick={handleInsertSample}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Exemple de 6 phrases
            </button>
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Phrase 1...\nPhrase 2...\nPhrase 3...\nPhrase 4...\nPhrase 5...\nPhrase 6..."
            className="w-full p-3.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
          />

          <p className="text-[11px] text-neutral-400">
            Chaque ligne deviendra une diapo automatique. Les visuels et styles existants seront conservés.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Appliquer au carrousel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
