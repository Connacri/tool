import React, { useState, useEffect } from 'react';
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
  Share2,
  RefreshCw,
  FileText,
  Check,
  Hash,
  MessageSquare,
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
  WatermarkConfig,
} from '../types';
import { renderSlideToCanvas, downloadCanvasAsPng, saveOrShareZip } from '../utils/canvasRenderer';
import { postJson } from '../utils/apiClient';
import { adManager } from '../services/adService';
import { generateSocialPackForSlides, DeckSocialPack } from '../utils/socialPackGenerator';

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
  watermark?: WatermarkConfig;
  onOpenSocialCopyModal?: () => void;
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
  watermark,
  onOpenSocialCopyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'social' | 'webhook' | 'calendar'>('zip');

  // ZIP export states
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [zipStatusText, setZipStatusText] = useState<string>('');
  const [zipComplete, setZipComplete] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);
  const [generatedZipUrl, setGeneratedZipUrl] = useState<string | null>(null);
  const [generatedZipFilename, setGeneratedZipFilename] = useState<string>('');
  const [downloadingSlideIdx, setDownloadingSlideIdx] = useState<number | null>(null);

  // Social copy pack states
  const [generatedSocialPack, setGeneratedSocialPack] = useState<DeckSocialPack | null>(null);
  const [socialPlatformTab, setSocialPlatformTab] = useState<
    'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'shorts' | 'all'
  >('instagram');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookPlatform, setWebhookPlatform] = useState<string>('make');
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copy helper with feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Batch ZIP generation and description regeneration according to provided texts
  const executeGenerateZip = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      setZipProgress(5);
      setZipStatusText('Initialisation de l\'archive et analyse des textes...');
      setZipComplete(false);
      setGeneratedZipBlob(null);
      if (generatedZipUrl) {
        URL.revokeObjectURL(generatedZipUrl);
        setGeneratedZipUrl(null);
      }

      // Step 1: Regenerate complete social copy, titles, tags, and hashtags according to provided slide texts
      const socialPack = generateSocialPackForSlides(slides, logo.brandText, logo.brandHandle);
      setGeneratedSocialPack(socialPack);

      const zip = new JSZip();
      const folderName = `AutoPost_${aspectRatio.id.replace(':', 'x')}_${Date.now()}`;
      const imgFolder = zip.folder(folderName);

      // Step 2: Render each slide to canvas at full resolution
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setZipProgress(Math.round(10 + ((i + 1) / (slides.length + 1)) * 75));
        setZipStatusText(`Rendu HD de la diapo ${i + 1} sur ${slides.length} (${slide.kicker || 'Sans titre'})...`);

        const canvas = await renderSlideToCanvas(
          slide,
          aspectRatio,
          typography,
          logo,
          slides.length,
          gradientBlur,
          colorFilter,
          overlayImage,
          watermark
        );

        // Convert canvas to blob/data
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `diapo_${String(slide.number || i + 1).padStart(2, '0')}_${aspectRatio.id.replace(':', 'x')}.png`;
        imgFolder?.file(filename, base64Data, { base64: true });
      }

      // Step 3: Embed regenerated descriptions, hashtags, and social pack into the ZIP
      setZipStatusText('Intégration du pack de descriptions, hashtags et métadonnées...');
      setZipProgress(88);

      imgFolder?.file('descriptions_et_hashtags.txt', socialPack.rawTextDocument);
      imgFolder?.file('social_pack_complet.json', JSON.stringify(socialPack, null, 2));

      // Step 4: Add automation manifest
      const manifest = {
        app: 'AutoPost Studio',
        generatedAt: socialPack.generatedAt,
        aspectRatio: {
          id: aspectRatio.id,
          resolution: `${aspectRatio.width}x${aspectRatio.height}`,
          platforms: aspectRatio.platforms,
        },
        branding: {
          brand: logo.brandText,
          handle: logo.brandHandle,
        },
        series: {
          title: socialPack.seriesTitle,
          hashtags: socialPack.seriesHashtags,
          tags: socialPack.seriesTags,
        },
        slides: slides.map((s, idx) => ({
          number: s.number || idx + 1,
          kicker: s.kicker,
          text: s.text,
          subtitle: s.subtitle,
          scheduledTime: s.scheduledTime,
          filename: `diapo_${String(s.number || idx + 1).padStart(2, '0')}_${aspectRatio.id.replace(':', 'x')}.png`,
          socialCopy: socialPack.slides[idx] || null,
        })),
      };
      imgFolder?.file('automation_manifest.json', JSON.stringify(manifest, null, 2));

      setZipStatusText('Finalisation et compression du fichier ZIP...');
      setZipProgress(95);

      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `${folderName}.zip`;
      const url = URL.createObjectURL(content);

      setGeneratedZipBlob(content);
      setGeneratedZipUrl(url);
      setGeneratedZipFilename(filename);

      // Trigger automatic save or share
      await saveOrShareZip(content, filename);

      setZipProgress(100);
      setZipStatusText('Archive ZIP et descriptions générées avec succès !');
      setZipComplete(true);
    } catch (err: any) {
      console.error('Erreur export ZIP:', err);
      setZipStatusText(`Erreur: ${err.message || 'Impossible de créer le ZIP'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically start complete regeneration whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      executeGenerateZip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleGenerateZipWithAd = () => {
    adManager.triggerAd({
      actionTitle: `Export du lot HD (${slides.length} diapos en ZIP)`,
      actionType: 'batch_zip',
      onAdCompleted: () => executeGenerateZip(),
    });
  };

  // Handle single slide download from modal
  const handleDownloadSingleSlide = async (slide: SlideItem, idx: number) => {
    setDownloadingSlideIdx(idx);
    try {
      const canvas = await renderSlideToCanvas(
        slide,
        aspectRatio,
        typography,
        logo,
        slides.length,
        gradientBlur,
        colorFilter,
        overlayImage,
        watermark
      );
      const filename = `autopost_slide_${slide.number}_${aspectRatio.id.replace(':', 'x')}.png`;
      await downloadCanvasAsPng(canvas, filename);
    } catch (e: any) {
      console.error('Erreur téléchargement diapo:', e);
    } finally {
      setDownloadingSlideIdx(null);
    }
  };

  // Handle Webhook Dispatch to Zapier / Make / Buffer
  const executeDispatchWebhook = async () => {
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
        series: generatedSocialPack
          ? {
              title: generatedSocialPack.seriesTitle,
              hashtags: generatedSocialPack.seriesHashtags,
              tags: generatedSocialPack.seriesTags,
              captions: generatedSocialPack.carouselCaptions,
            }
          : undefined,
        posts: slides.map((s, idx) => ({
          slideNumber: s.number,
          title: s.kicker,
          text: s.text,
          subtitle: s.subtitle,
          scheduledTime: s.scheduledTime,
          socialCopy: generatedSocialPack?.slides[idx] || undefined,
        })),
      };

      const data = (await postJson('/api/export-webhook', {
        webhookUrl,
        payload,
      })) as { success?: boolean; message?: string; error?: string } | null;

      if (data?.success) {
        setWebhookResult({
          success: true,
          message: String(data.message ?? '') || 'Les données ont été transmises avec succès à votre Webhook.',
        });
      } else {
        setWebhookResult({
          success: false,
          message: String(data?.error ?? data?.message ?? '') || 'Erreur lors de la transmission.',
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

  const handleDispatchWebhook = () => {
    if (!webhookUrl) {
      setWebhookResult({
        success: false,
        message: 'Veuillez saisir l\'URL de votre Webhook (ex: https://hook.eu1.make.com/...)',
      });
      return;
    }

    adManager.triggerAd({
      actionTitle: `Envoi automatisé Webhook (${webhookPlatform.toUpperCase()})`,
      actionType: 'webhook_export',
      onAdCompleted: () => executeDispatchWebhook(),
    });
  };

  // Generate and download .ICS calendar schedule file
  const handleDownloadCalendar = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AutoPost Studio//Social Media Planner//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;

    slides.forEach((s) => {
      const dateStr = s.scheduledTime ? new Date(s.scheduledTime) : new Date();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne']">
                Centre d'Exportation & Régénération
              </h2>
              <p className="text-xs text-neutral-400">
                Format actuel : {aspectRatio.label} ({aspectRatio.sublabel}) · {slides.length} visuels
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
            { id: 'zip', label: '1. Archive ZIP & Fichiers HD', icon: FileArchive },
            { id: 'social', label: '2. Textes & Hashtags Régénérés', icon: MessageSquare },
            { id: 'webhook', label: '3. Webhook (Zapier/Make)', icon: Send },
            { id: 'calendar', label: '4. Calendrier (.ICS)', icon: Calendar },
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
          {/* TAB 1: ZIP BATCH EXPORT & REGENERATION */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">Contenu régénéré dans l'archive :</span>
                  <span className="font-mono text-emerald-400 font-semibold">{slides.length} images PNG + Textes</span>
                </div>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Résolution maximale : {aspectRatio.width} × {aspectRatio.height} px</li>
                  <li>Fichier <strong>descriptions_et_hashtags.txt</strong> prêt à copier-coller inclus</li>
                  <li>Fichier <strong>social_pack_complet.json</strong> avec tags & métadonnées inclus</li>
                  <li>Logo : {logo.enabled ? logo.brandText : 'Désactivé'}</li>
                </ul>
              </div>

              {/* Progress bar during generation */}
              {zipProgress !== null && (
                <div className="space-y-2 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                      {isGenerating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                      <span>{zipStatusText}</span>
                    </span>
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

              {/* Success Panel with Direct Save, Share & Individual Downloads */}
              {zipComplete && generatedZipUrl && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Archive ZIP et pack de textes régénérés avec succès !</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={generatedZipUrl}
                      download={generatedZipFilename}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md text-center"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        Télécharger le ZIP{' '}
                        {generatedZipBlob
                          ? `(${(generatedZipBlob.size / (1024 * 1024)).toFixed(1)} Mo)`
                          : ''}
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (generatedZipBlob) {
                          saveOrShareZip(generatedZipBlob, generatedZipFilename);
                        }
                      }}
                      className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-neutral-700"
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span>Partager / Enregistrer</span>
                    </button>
                  </div>

                  {/* Quick access to view generated descriptions */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl text-xs font-medium text-neutral-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Consulter & Copier les Descriptions et Hashtags régénérés</span>
                  </button>
                </div>
              )}

              {/* Regenerate ZIP button */}
              <button
                onClick={handleGenerateZipWithAd}
                disabled={isGenerating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-950/60 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>
                  {isGenerating
                    ? 'Régénération en cours...'
                    : `Régénérer tout le ZIP & les Textes (${slides.length} diapos)`}
                </span>
              </button>

              {/* Individual Slide Download Fallback */}
              <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                <span className="text-xs font-semibold text-neutral-300 block">
                  Ou enregistrer chaque image individuellement (HD PNG) :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleDownloadSingleSlide(s, idx)}
                      disabled={downloadingSlideIdx === idx}
                      className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center justify-between transition-colors disabled:opacity-50"
                    >
                      <span className="truncate max-w-[100px] text-[11px] font-medium">
                        Diapo {s.number}
                      </span>
                      <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGENERATED TEXTS, HASHTAGS & DESCRIPTIONS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {generatedSocialPack ? (
                <>
                  {/* Top Bar with Title, Hashtags & Copy All */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-500 tracking-wider">
                          Thématique détectée
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {generatedSocialPack.seriesTitle}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(generatedSocialPack.rawTextDocument, 'all-document')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        {copiedKey === 'all-document' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier tout le pack (.txt)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <p className="text-xs text-indigo-300 font-mono truncate">
                        {generatedSocialPack.seriesHashtags}
                      </p>
                    </div>
                  </div>

                  {/* Platform Selector */}
                  <div className="flex gap-1.5 overflow-x-auto custom-scrollbar p-0.5">
                    {[
                      { id: 'instagram', label: 'Instagram' },
                      { id: 'tiktok', label: 'TikTok' },
                      { id: 'linkedin', label: 'LinkedIn' },
                      { id: 'twitter', label: 'X / Twitter' },
                      { id: 'shorts', label: 'YouTube Shorts' },
                      { id: 'all', label: 'Toutes les diapos' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSocialPlatformTab(p.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                          socialPlatformTab === p.id
                            ? 'bg-neutral-800 border-indigo-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Platform Content Card */}
                  {socialPlatformTab !== 'all' ? (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white capitalize">
                          Légende optimisée {socialPlatformTab}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy =
                              socialPlatformTab === 'instagram'
                                ? generatedSocialPack.carouselCaptions.instagram
                                : socialPlatformTab === 'tiktok'
                                ? generatedSocialPack.carouselCaptions.tiktok
                                : socialPlatformTab === 'linkedin'
                                ? generatedSocialPack.carouselCaptions.linkedin
                                : socialPlatformTab === 'twitter'
                                ? generatedSocialPack.carouselCaptions.twitter
                                : generatedSocialPack.carouselCaptions.youtubeShorts;
                            handleCopy(textToCopy, `platform-${socialPlatformTab}`);
                          }}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {copiedKey === `platform-${socialPlatformTab}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
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

                      <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                        {socialPlatformTab === 'instagram' && generatedSocialPack.carouselCaptions.instagram}
                        {socialPlatformTab === 'tiktok' && generatedSocialPack.carouselCaptions.tiktok}
                        {socialPlatformTab === 'linkedin' && generatedSocialPack.carouselCaptions.linkedin}
                        {socialPlatformTab === 'twitter' && generatedSocialPack.carouselCaptions.twitter}
                        {socialPlatformTab === 'shorts' && generatedSocialPack.carouselCaptions.youtubeShorts}
                      </pre>
                    </div>
                  ) : (
                    /* Detailed Slide-by-Slide List */
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {generatedSocialPack.slides.map((sc) => (
                        <div
                          key={sc.slideNumber}
                          className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              Diapo {sc.slideNumber} · {sc.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `"${sc.text}"\n\n${sc.instagram.caption}\n\n${sc.hashtags}`,
                                  `slide-${sc.slideNumber}`
                                )
                              }
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedKey === `slide-${sc.slideNumber}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copier diapo</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-neutral-300 italic">"{sc.text}"</p>
                          <p className="text-[11px] text-indigo-300 font-mono">{sc.hashtags}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-neutral-400 text-xs space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  <p>Régénération des descriptions et hashtags selon vos textes en cours...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBHOOK AUTOMATION */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Plateforme d'Automatisation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  Lorsque vous cliquez sur envoyer, le serveur transmet le lot de {slides.length} visuels avec textes, programmations, descriptions et métadonnées.
                </p>
              </div>

              {webhookResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    webhookResult.success
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
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
                disabled={isSendingWebhook || !webhookUrl.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingWebhook
                    ? 'Transmission en cours...'
                    : `Transmettre le lot et les textes (${webhookPlatform.toUpperCase()})`}
                </span>
              </button>
            </div>
          )}

          {/* TAB 4: CALENDAR SCHEDULE (.ICS) */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold text-white">
                  Export du Planning de Publication (.ics)
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Téléchargez un fichier de calendrier universel compatible avec Google Calendar, Apple Calendar et Outlook, contenant les horaires et textes de publication configurés.
                </p>
              </div>

              <button
                onClick={handleDownloadCalendar}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-neutral-700 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Télécharger le Fichier Calendrier (.ICS)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
