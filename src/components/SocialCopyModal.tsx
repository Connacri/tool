import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Share2, Layers } from 'lucide-react';
import { SlideItem } from '../types';
import { getApiUrl } from '../utils/apiConfig';

interface SocialCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  currentSlideIndex: number;
}

export const SocialCopyModal: React.FC<SocialCopyModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
}) => {
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(currentSlideIndex);
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'linkedin' | 'twitter' | 'tiktok'>('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeSlide = slides[selectedSlideIdx] || slides[0];

  // Stored copy per slide
  const [copyCache, setCopyCache] = useState<Record<number, any>>({});

  useEffect(() => {
    if (isOpen && activeSlide && !copyCache[selectedSlideIdx]) {
      fetchSocialCopy(selectedSlideIdx);
    }
  }, [isOpen, selectedSlideIdx]);

  const fetchSocialCopy = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/generate-social-copy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrase: slide.text,
          kicker: slide.kicker,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.copy) {
          setCopyCache((prev) => ({ ...prev, [slideIndex]: data.copy }));
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // fallback to generated local copy
    }

    // High quality contextual fallback copy if server is offline or key missing
    const fallback = {
      instagram: {
        caption: `✨ ${slide.text}\n\nUne réflexion essentielle pour bien démarrer votre semaine. Qu'en pensez-vous ? Partagez votre avis en commentaire !\n\nSauvegardez ce post pour y revenir plus tard 📌`,
        hashtags: `#${slide.kicker?.toLowerCase().replace(/\s+/g, '') || 'conseil'} #motivation #entrepreneuriat #mindset #succes #creation #autopost`,
      },
      linkedin: {
        caption: `💡 "${slide.text}"\n\nDans un monde où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers de croissance.\n\nQuelle est votre expérience sur ce sujet dans vos équipes ?`,
        hashtags: `#Leadership #${slide.kicker?.replace(/\s+/g, '') || 'Business'} #Strategie #Innovation`,
      },
      twitter: {
        caption: `${slide.text}\n\nÀ méditer aujourd'hui.`,
        hashtags: `#Citation #Mindset`,
      },
      tiktok: {
        caption: `${slide.text} 👀 Swipe pour la suite de la série !`,
        hashtags: `#pourtoi #fyp #devperso #motivation`,
      },
    };
    setCopyCache((prev) => ({ ...prev, [slideIndex]: fallback }));
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const currentCopy = copyCache[selectedSlideIdx]?.[activePlatform] || {
    caption: 'Génération de la légende en cours...',
    hashtags: '',
  };

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white font-['Syne']">
              Légendes & Hashtags IA pour Réseaux
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Selector */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-950/50 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-xs text-neutral-400 shrink-0">Diapo :</span>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedSlideIdx(idx)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono shrink-0 transition-colors ${
                selectedSlideIdx === idx
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              #{s.number}
            </button>
          ))}
        </div>

        {/* Platform Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-neutral-800 flex gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'instagram', label: 'Instagram' },
            { id: 'linkedin', label: 'LinkedIn' },
            { id: 'twitter', label: 'X / Twitter' },
            { id: 'tiktok', label: 'TikTok' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePlatform(tab.id as any)}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all shrink-0 whitespace-nowrap ${
                activePlatform === tab.id
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block mb-1">
              Phrase du visuel sélectionné
            </span>
            <p className="text-xs text-neutral-200 font-medium">"{activeSlide.text}"</p>
          </div>

          {/* Caption Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                Légende suggérée ({activePlatform})
              </label>
              <button
                onClick={() =>
                  handleCopy(`${currentCopy.caption}\n\n${currentCopy.hashtags}`, 'all')
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedKey === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier tout</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center gap-2 text-neutral-400 py-4 justify-center">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Rédaction en cours par l'IA...</span>
                </div>
              ) : (
                <>
                  <p>{currentCopy.caption}</p>
                  {currentCopy.hashtags && (
                    <p className="text-indigo-400 mt-3">{currentCopy.hashtags}</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <button
              onClick={() => fetchSocialCopy(selectedSlideIdx)}
              disabled={isLoading}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Régénérer cette légende</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
