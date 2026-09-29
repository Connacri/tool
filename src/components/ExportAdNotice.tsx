import React, { useEffect, useState } from 'react';
import { adManager, AdTriggerOptions } from '../services/adService';
import { Megaphone, ShieldCheck, ArrowRight, Gift, X } from 'lucide-react';

/**
 * Message d'annonce AVANT un export.
 *
 * Ce composant remplace un ancien ecran qui presentait de fausses creations
 * publicitaires (« Canva Pro », « Buffer », « Hostinger »), avec des images
 * et des liens, presentees comme de veritables « Annonce Partenaire », et un
 * compte a rebours de 4 secondes bloquant l'export.
 *
 * Ces deux pratiques sont interdites :
 *  - simuler une annonce qui n'existe pas induit l'utilisateur en erreur et
 *    constitute du trafic invalide, expose de sanction Google AdSense ;
 *  - un decompte qui bloque l'action en imitant une fenetre systeme est
 *    explicitement rejete par les regles de Google Ads.
 *
 * Ce qui est affiche desormais est honnete et verifiable :
 *  - le label « Publicite » ;
 *  - ce qui va se passer reellement ;
 *  - un bouton de sortie, jamais bloque.
 *
 * Sur Android, l'utilisateur est prevenu de l'annonce AVANT qu'elle ne
 * s'affiche. Il peut annuler l'export plutot que de la subir.
 *
 * Une annonce recompensee avait ete retiree : l'export etant produit dans les
 * deux cas, la « recompense » n'existait pas. Google classe cela en trafic
 * invalide. Une video recompensee ne sera reintroduite que si les deux branches
 * offrent un resultat reellement different.
 */
export const ExportAdNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AdTriggerOptions | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    setIsNative(!!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()));

    adManager.registerModalListener((open, opts) => {
      setIsOpen(open);
      setOptions(opts);
    });

    return () => {
      adManager.unregisterModalListener();
      adManager.unregisterNoticeResolver();
    };
  }, []);

  if (!isOpen) return null;

  const actionTitle = options?.actionTitle || 'votre export';

  // Android : on annonce l'interstitielle, ou l'utilisateur annule l'export.
  const handleAccept = () => {
    if (isNative) {
      adManager.resolveNotice('accept');
      return;
    }
    adManager.completeAd();
  };

  // Sortie explicite. Sur Android, refuser l'annonce annule l'export plutot
  // que de laisser croire a une recompense qui n'existe pas.
  const handleDismiss = () => {
    if (isNative) {
      adManager.resolveNotice('dismiss');
      return;
    }
    adManager.cancelAd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-ad-notice-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>Publicité</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium truncate">
              {actionTitle}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
            title={isNative ? 'Annuler l\'export' : 'Annuler'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                {isNative ? (
                  <Megaphone className="w-5 h-5 text-indigo-300" />
                ) : (
                  <Gift className="w-5 h-5 text-indigo-300" />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 id="export-ad-notice-title" className="text-sm font-bold text-white">
                  {isNative ? 'Une publicité va être affichée' : 'Une publicité va être affichée'}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {isNative
                    ? 'Elle finance la gratuité de l\'application et s\'affichera juste avant votre export. Vous pouvez l\'annuler et ne pas lancer cet export si vous préférez ne pas la voir.'
                    : 'Des annonces financent la gratuité de cet outil. Votre export reste entièrement gratuit, quelle que soit l’annonce affichée.'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {isNative
                ? 'Aucune donnée personnelle n’est transmise par cette publicité. Vous pouvez la fermer à tout moment ; votre export se lancera ensuite normalement.'
                : 'Aucune donnée personnelle n’est transmise. Vous pouvez choisir de ne pas utiliser le service si vous ne souhaitez pas voir de publicités.'}
            </p>

        </div>

        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Export en haute définition, gratuit et sans filigrane</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isNative && (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
              >
                Annuler l'export
              </button>
            )}
            <button
              type="button"
              onClick={handleAccept}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>{isNative ? "Afficher l'annonce et exporter" : 'Continuer'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
