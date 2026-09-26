import React, { useState } from 'react';
import {
  X,
  Download,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  FileArchive,
  Copy,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  AspectRatioOption,
  ColorFilterConfig,
  GradientBlurConfig,
  LogoConfig,
  OverlayImageConfig,
  SlideItem,
  TypographyConfig,
  WebhookConfig,
} from '../types';
import { renderSlideToCanvas } from '../utils/canvasRenderer';

interface AutomatedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  gradientBlur?: GradientBlurConfig;
  colorFilter?: ColorFilterConfig;
  overlayImage?: OverlayImageConfig;
}

export const AutomatedExportModal: React.FC<AutomatedExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  aspectRatio,
  typography,
  logo,
  gradientBlur,
  colorFilter,
  overlayImage,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'webhook' | 'calendar'>('zip');
  
  // ZIP export states
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [zipStatusText, setZipStatusText] = useState<string>('');
  const [zipComplete, setZipComplete] = useState<boolean>(false);

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookPlatform, setWebhookPlatform] = useState<string>('make');
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copy toast state
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen) return null;

  // Handle batch ZIP generation and download
  const handleGenerateZip = async () => {
    try {
      setZipProgress(5);
      setZipStatusText('Initialisation de l archive ZIP...');
      setZipComplete(false);

      const zip = new JSZip();
      const folderName = `AutoPost_${aspectRatio.id.replace(':', 'x')}_${Date.now()}`;
      const imgFolder = zip.folder(folderName);

      // Render each slide to canvas at full resolution
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setZipProgress(Math.round(((i + 1) / (slides.length + 1)) * 90));
        setZipStatusText(`Rendu HD de la diapo ${i + 1} sur ${slides.length}...`);

        const canvas = await renderSlideToCanvas(
          slide,
          aspectRatio,
          typography,
          logo,
          slides.length,
          gradientBlur,
          colorFilter,
          overlayImage
        );

        // Convert canvas to blob/data
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `diapo_${String(slide.number).padStart(2, '0')}_${aspectRatio.id.replace(':', 'x')}.png`;
        imgFolder?.file(filename, base64Data, { base64: true });
      }

      // Add a summary JSON file with captions and metadata for automation tools
      const manifest = {
        app: 'AutoPost Studio',
        generatedAt: new Date().toISOString(),
        aspectRatio: {
          id: aspectRatio.id,
          resolution: `${aspectRatio.width}x${aspectRatio.height}`,
          platforms: aspectRatio.platforms,
        },
        branding: {
          brand: logo.brandText,
          handle: logo.brandHandle,
        },
        slides: slides.map((s) => ({
          number: s.number,
          kicker: s.kicker,
          text: s.text,
          subtitle: s.subtitle,
          scheduledTime: s.scheduledTime,
          filename: `diapo_${String(s.number).padStart(2, '0')}_${aspectRatio.id.replace(':', 'x')}.png`,
        })),
      };
      imgFolder?.file('automation_manifest.json', JSON.stringify(manifest, null, 2));

      setZipStatusText('Finalisation et compression du fichier ZIP...');
      setZipProgress(95);

      const content = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${folderName}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setZipProgress(100);
      setZipStatusText('Archive ZIP téléchargée avec succès !');
      setZipComplete(true);
    } catch (err: any) {
      console.error('Erreur export ZIP:', err);
      setZipStatusText(`Erreur: ${err.message || 'Impossible de créer le ZIP'}`);
    }
  };

  // Handle Webhook Dispatch to Zapier / Make / Buffer
  const handleDispatchWebhook = async () => {
    if (!webhookUrl) {
      setWebhookResult({
        success: false,
        message: 'Veuillez saisir l URL de votre Webhook (ex: https://hook.eu1.make.com/...)',
      });
      return;
    }

    setIsSendingWebhook(true);
    setWebhookResult(null);

    try {
      const payload = {
        source: 'AutoPost Studio Automation',
        createdAt: new Date().toISOString(),
        platformTarget: webhookPlatform,
        aspectRatio: aspectRatio.id,
        resolution: `${aspectRatio.width}x${aspectRatio.height}`,
        brand: {
          name: logo.brandText,
          handle: logo.brandHandle,
        },
        posts: slides.map((s) => ({
          slideNumber: s.number,
          title: s.kicker,
          text: s.text,
          subtitle: s.subtitle,
          scheduledAt: s.scheduledTime || new Date().toISOString(),
          imageUrl: s.imageUrl.startsWith('data:') ? '[IMAGE_BASE64]' : s.imageUrl,
        })),
      };

      const response = await fetch('/api/export-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          payload,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setWebhookResult({
          success: true,
          message: data.message || 'Les données ont été transmises avec succès à votre Webhook.',
        });
      } else {
        setWebhookResult({
          success: false,
          message: data.error || data.message || 'Erreur lors de la transmission.',
        });
      }
    } catch (err: any) {
      setWebhookResult({
        success: false,
        message: `Erreur de connexion: ${err.message}`,
      });
    } finally {
      setIsSendingWebhook(false);
    }
  };

  // Generate and download .ICS calendar schedule file
  const handleDownloadCalendar = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AutoPost Studio//Social Media Planner//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;

    slides.forEach((s) => {
      const dateStr = s.scheduledTime ? new Date(s.scheduledTime) : new Date();
      // Format YYYYMMDDTHHmmssZ
      const pad = (n: number) => String(n).padStart(2, '0');
      const start = `${dateStr.getUTCFullYear()}${pad(dateStr.getUTCMonth() + 1)}${pad(dateStr.getUTCDate())}T${pad(dateStr.getUTCHours())}${pad(dateStr.getUTCMinutes())}00Z`;
      const end = `${dateStr.getUTCFullYear()}${pad(dateStr.getUTCMonth() + 1)}${pad(dateStr.getUTCDate())}T${pad(dateStr.getUTCHours() + 1)}${pad(dateStr.getUTCMinutes())}00Z`;

      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `UID:autopost-${s.id}-${Date.now()}@autopoststudio.app\n`;
      icsContent += `DTSTAMP:${start}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `SUMMARY:Publication Réseau: ${s.kicker || `Diapo ${s.number}`}\n`;
      icsContent += `DESCRIPTION:${s.text.replace(/\n/g, '\\n')}\\n\\nFormat: ${aspectRatio.label}\\nSignature: ${s.subtitle}\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += `END:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planning_autopost_${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne']">
                Centre d'Exportation & Automatisation
              </h2>
              <p className="text-xs text-neutral-400">
                Format actuel: {aspectRatio.label} ({aspectRatio.sublabel})
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

        {/* Modal Navigation Tabs */}
        <div className="px-3 sm:px-6 pt-3 border-b border-neutral-800 flex gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'zip', label: '1. Téléchargement ZIP (HD)', icon: FileArchive },
            { id: 'webhook', label: '2. Webhook (Zapier/Make)', icon: Send },
            { id: 'calendar', label: '3. Calendrier (.ICS)', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-medium flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* TAB 1: ZIP BATCH EXPORT */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">Contenu de l'archive :</span>
                  <span className="font-mono text-neutral-400">{slides.length} images PNG</span>
                </div>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Résolution maximale : {aspectRatio.width} × {aspectRatio.height} px</li>
                  <li>Incrustation du logo prédéfini : {logo.enabled ? logo.brandText : 'Désactivé'}</li>
                  <li>Fichier automation_manifest.json inclus pour vos outils d'automatisation</li>
                </ul>
              </div>

              {zipProgress !== null && (
                <div className="space-y-2 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-medium">{zipStatusText}</span>
                    <span className="font-mono text-indigo-400">{zipProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${zipProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateZip}
                disabled={zipProgress !== null && zipProgress < 100}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-950/60 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {zipComplete
                    ? 'Télécharger à nouveau le lot ZIP'
                    : `Générer et Télécharger les ${slides.length} visuels`}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: WEBHOOK AUTOMATION */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Plateforme d'Automatisation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'make', name: 'Make.com' },
                    { id: 'zapier', name: 'Zapier' },
                    { id: 'buffer', name: 'Buffer' },
                    { id: 'n8n', name: 'n8n / API' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setWebhookPlatform(p.id)}
                      className={`py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                        webhookPlatform === p.id
                          ? 'bg-neutral-800 border-indigo-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  URL du Webhook de Réception
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hook.eu1.make.com/votre-webhook-social"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Lorsque vous cliquez sur envoyer, le serveur transmet le lot de {slides.length} visuels avec textes, programmations et métadonnées.
                </p>
              </div>

              {webhookResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    webhookResult.success
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-800 text-rose-300'
                  }`}
                >
                  {webhookResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{webhookResult.message}</span>
                </div>
              )}

              <button
                onClick={handleDispatchWebhook}
                disabled={isSendingWebhook}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingWebhook
                    ? 'Transmission au Webhook...'
                    : 'Déclencher l export automatisé maintenant'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: CALENDAR SCHEDULE */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold text-white">
                  Synchronisation Calendrier Social
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Exportez un calendrier universel <strong>.ICS</strong> compatible avec Google Calendar, Notion, Apple Calendar ou Outlook. Chaque événement inclut le texte exact du visuel et l'heure programmée pour publier.
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {slides.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white mr-2">Diapo #{s.number}</span>
                      <span className="text-neutral-400 line-clamp-1">{s.kicker}</span>
                    </div>
                    <span className="font-mono text-neutral-400 text-[11px]">
                      {s.scheduledTime
                        ? new Date(s.scheduledTime).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Immédiat'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownloadCalendar}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Télécharger le planning (.ICS)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
