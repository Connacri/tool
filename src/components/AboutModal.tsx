import React, { useEffect, useState } from 'react';
import { X, Info, ShieldCheck, FileText, Heart, Github } from 'lucide-react';
import { adManager } from '../services/adService';

/**
 * Version affichee dans l'ecran "A propos de".
 *
 * VITE_APP_VERSION est injecte au moment du build par la CI, depuis le meme job
 * qui resout la version de l'APK : le site affiche donc exactement la version
 * embarquee dans l'APK du meme commit, et non un numero qui lui est propre.
 *
 * Sans injection — un build local, ou une variable absente en CI — on affiche
 * le mode Vite (« production ») plutot qu'un numero invente. « production » est
 * peu parlant pour l'utilisateur final, mais un faux versionCode dans l'ecran
 * « A propos » serait pire : il ne correspondrait a aucun APK existant.
 */
const APP_VERSION = (import.meta.env.VITE_APP_VERSION || '').trim();

const VERSION_LABEL = APP_VERSION || import.meta.env.MODE;

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Interroge le SDK de consentement sans lancer d'annonce : si l'utilisateur
    // a déjà accordé son accord, Google exige un moyen de le retirer.
    void adManager
      .isPrivacyOptionsRequired()
      .then(setPrivacyOptionsRequired)
      .catch(() => setPrivacyOptionsRequired(false));
  }, [isOpen]);

  const handleOpenPrivacyOptions = async () => {
    await adManager.showPrivacyOptions();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md">
      <div
        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <Info className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 id="about-modal-title" className="text-sm font-bold text-neutral-100">
                À propos
              </h2>
              <p className="text-[11px] text-neutral-500">AutoPost Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          <div className="flex items-center justify-between gap-3 bg-neutral-950/60 border border-neutral-800 rounded-xl px-3.5 py-3">
            <span className="text-neutral-400 font-medium">Version</span>
            <span className="font-mono text-neutral-100 font-semibold">
              {VERSION_LABEL || 'dev'}
            </span>
          </div>

          <p className="text-neutral-400 leading-relaxed">
            Générateur de visuels pour réseaux sociaux : textes, images superposées, formats
            multi-ratios, logo et export automatisé. Tout se fait dans votre navigateur, aucune
            image n'est envoyée sur un serveur.
          </p>

          <div className="space-y-2.5 pt-1">
            <a
              href={`${import.meta.env.BASE_URL}privacy.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-neutral-300">Politique de confidentialité</span>
            </a>
            <a
              href="https://github.com/Connacri/tool"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/60 transition-colors"
            >
              <Github className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-neutral-300">Code source</span>
            </a>
          </div>

          <p className="flex items-start gap-2 pt-1 text-[11px] text-neutral-500 leading-relaxed">
            <FileText className="w-3.5 h-3.5 mt-px shrink-0" />
            <span>
              Cette application contient des publicités. Elles permettent de financer le
              développement et le service reste gratuit.
            </span>
          </p>

          {/* Google impose de pouvoir revenir sur le consentement publicitaire
              après l'avoir accordé : ce bouton n'apparaît que si le SDK UMP le
              signale, et il ouvre le formulaire officiel. */}
          {privacyOptionsRequired && (
            <button
              type="button"
              onClick={handleOpenPrivacyOptions}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/60 transition-colors text-left"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-neutral-300">Options de confidentialité</span>
            </button>
          )}

          {privacyOptionsRequired && (
            <p className="text-[10px] text-neutral-600 leading-relaxed">
              Vous pouvez modifier ou retirer votre accord sur les annonces personnalisées à
              tout moment.
            </p>
          )}

          <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-neutral-600">
            Fait avec <Heart className="w-3 h-3 text-rose-500" fill="currentColor" /> à Oran
          </p>
        </div>
      </div>
    </div>
  );
};
