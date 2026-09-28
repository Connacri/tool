import React, { useEffect, useState } from 'react';
import { adManager, AdTriggerOptions } from '../services/adService';
import {
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  X,
  Volume2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const AdInterstitialModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AdTriggerOptions | null>(null);
  const [countdown, setCountdown] = useState<number>(4);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [adCreativeIndex, setAdCreativeIndex] = useState<number>(0);

  // Exemples d'annonces partenaires stylisées / AdSense mock
  const SPONSORED_ADS = [
    {
      sponsor: 'Canva Pro & Design Toolkit',
      tagline: 'Créez des visuels époustouflants pour vos réseaux en 3 clics',
      badge: 'Annonce Partenaire',
      description: 'Accédez à plus de 100 millions de photos, polices exclusives et modèles premium pour vos posts Instagram et LinkedIn.',
      cta: 'Découvrir gratuitement',
      url: 'https://www.canva.com',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      sponsor: 'Buffer & Hootsuite Publisher',
      tagline: 'Automatisez la publication de vos carrousels sur tous vos réseaux',
      badge: 'Recommandé Créateurs',
      description: 'Programmez vos posts sur LinkedIn, Instagram, TikTok et X à l\'heure de pointe de votre audience.',
      cta: 'Essayer l\'automatisation',
      url: 'https://buffer.com',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      color: 'from-purple-600 to-pink-600',
    },
    {
      sponsor: 'Hostinger Cloud Pro',
      tagline: 'Hébergez vos applications et projets web avec 99.9% d\'uptime',
      badge: 'Offre Spéciale',
      description: 'Déploiement en 1 clic pour serveurs Node.js, Next.js et bases de données ultra-rapides.',
      cta: 'Profiter de l\'offre',
      url: 'https://www.hostinger.fr',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      color: 'from-amber-600 to-rose-600',
    },
  ];

  useEffect(() => {
    adManager.registerModalListener((open, opts) => {
      setIsOpen(open);
      setOptions(opts);
      if (open) {
        setCountdown(4);
        setCanSkip(false);
        // Choisit une annonce au hasard
        setAdCreativeIndex(Math.floor(Math.random() * SPONSORED_ADS.length));
      }
    });

    return () => {
      adManager.unregisterModalListener();
    };
  }, []);

  // Décompte automatique de 4 secondes
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const currentAd = SPONSORED_ADS[adCreativeIndex] || SPONSORED_ADS[0];

  const handleProceedDownload = () => {
    adManager.completeAd();
  };

  const handleCancel = () => {
    adManager.cancelAd();
  };

  const actionTitle = options?.actionTitle || 'Téléchargement de votre visuel HD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec badge publicitaire et décompte */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Annonce Publicitaire</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium truncate max-w-[200px]">
              {actionTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Compteur de déverrouillage */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
              <Clock className="w-3 h-3 text-indigo-400 animate-pulse" />
              {countdown > 0 ? (
                <span>Déblocage dans {countdown}s</span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Prêt !
                </span>
              )}
            </div>

            <button
              onClick={handleCancel}
              className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Annuler le téléchargement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corps de l'Annonce Sponsorisée */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Bannière Visuelle de l'Annonce */}
          <div className="relative rounded-xl overflow-hidden aspect-video border border-neutral-800 shadow-inner group">
            <img
              src={currentAd.image}
              alt={currentAd.sponsor}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                {currentAd.badge}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-sm">
                {currentAd.sponsor}
              </h4>
              <p className="text-xs text-neutral-200 line-clamp-2 mt-1 drop-shadow-sm">
                {currentAd.tagline}
              </p>
            </div>
          </div>

          {/* Description de l'annonceur & Call To Action externe */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <p className="text-xs text-neutral-300 leading-relaxed">
              {currentAd.description}
            </p>
            <div className="flex items-center justify-between pt-1">
              <a
                href={currentAd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>{currentAd.cta}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-neutral-500">
                L'annonce finance la gratuité des exports HD
              </span>
            </div>
          </div>
        </div>

        {/* Footer avec bouton de téléchargement / déverrouillage */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Rendu haute définition 100% sans perte</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canSkip ? (
              <button
                type="button"
                onClick={handleProceedDownload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger mon fichier HD maintenant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Déblocage du téléchargement ({countdown}s)...</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
