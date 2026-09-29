import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Terminal,
  X,
  Layers,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'qr' | 'apk'>('install');

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-pre-hva2ek23wrmmyqass7qwe6-56100359979.europe-west3.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (success) {
        onClose();
      }
    } else {
      setActiveTab('qr');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    currentUrl
  )}&color=818cf8&bgcolor=0d0d16&margin=3`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Application Android AutoPost Studio
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Prêt
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Installez l'application sur votre smartphone sans toucher ni perdre ce projet web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Banner */}
        <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-6 py-2.5 flex items-center gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>
            <strong>Projet Préservé à 100% :</strong> Votre application web reste intacte avec tous vos slides, réglages et fonctions.
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installation Directe</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Flasher le QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Export APK / Play Store</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-200 flex-1">
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-4">
                <img
                  src="/pwa-192x192.png"
                  alt="AutoPost Studio Icon"
                  className="w-16 h-16 rounded-2xl shadow-md border border-neutral-700/60 object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">AutoPost Studio pour Android</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Fonctionne en plein écran comme une application Android native, avec icône sur l'écran d'accueil, tiroir d'applications et mode hors-ligne.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Zap className="w-3 h-3" /> Rapide & Léger
                    </span>
                    <span>•</span>
                    <span>Android 8.0+</span>
                    <span>•</span>
                    <span>Sans Play Store requis</span>
                  </div>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Application déjà installée !</p>
                    <p className="text-emerald-300/90 mt-0.5">
                      L'application est configurée et active sur votre appareil.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isInstallable
                        ? "Installer l'application Android maintenant"
                        : "Ouvrir les instructions pour Android"}
                    </span>
                  </button>

                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5 text-xs text-neutral-300">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Comment installer en 3 secondes sur Android :
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 pl-1 leading-relaxed">
                      <li>
                        Ouvrez le lien dans <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong> sur votre téléphone Android.
                      </li>
                      <li>
                        Appuyez sur la bannière <strong className="text-white">"Ajouter à l'écran d'accueil"</strong> ou dans le menu Chrome (les 3 points <strong>⋮</strong>) puis <strong className="text-white">"Installer l'application"</strong>.
                      </li>
                      <li>
                        L'icône AutoPost Studio s'ajoute à votre écran d'accueil et se lance en plein écran comme une véritable appli native !
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-neutral-300">
                Pointez l'appareil photo de votre smartphone Android sur ce QR Code pour ouvrir et installer l'application instantanément :
              </p>
              <div className="inline-block p-4 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-xl">
                <img
                  src={qrCodeUrl}
                  alt="QR Code AutoPost Studio"
                  className="w-52 h-52 mx-auto rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Méthode 1 : TWA / Bubblewrap (Recommandée pour Google Play)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Grâce au Web App Manifest PWA déjà configuré dans le projet, Google Bubblewrap génère un projet Android Studio complet avec APK et AAB en 1 minute :
                </p>
                <div className="p-2.5 rounded bg-black font-mono text-[11px] text-emerald-400 border border-neutral-800 overflow-x-auto select-all">
                  npm install -g @bubblewrap/cli<br />
                  bubblewrap init --manifest={currentUrl}/manifest.webmanifest<br />
                  bubblewrap build
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Méthode 2 : Capacitor (Configuration incluse)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Le fichier <code className="text-indigo-300">capacitor.config.json</code> est déjà prêt dans votre projet avec l'ID <code className="text-indigo-300">com.autopost.studio</code> :
                </p>
                <div className="p-2.5 rounded bg-black font-mono text-[11px] text-indigo-300 border border-neutral-800 overflow-x-auto select-all">
                  npm run build<br />
                  npx cap add android<br />
                  npx cap open android
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300">
                💡 <strong>Important :</strong> Ces méthodes n'altèrent en rien votre projet web. Elles utilisent simplement le code web existant pour l'embarquer dans un conteneur natif Android.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA WebAPK & Android Studio Ready</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
