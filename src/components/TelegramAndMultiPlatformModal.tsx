import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Layers,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Download,
  Film,
  Check,
  CheckCheck,
  Hash,
  Calendar,
  Sliders,
  Smartphone,
  Eye,
  MessageSquare,
  Zap,
} from 'lucide-react';
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
import { renderSlideToCanvas } from '../utils/canvasRenderer';
import {
  parseBatchInputText,
  formatSlidesToBatchText,
  formatStoryForTelegram,
} from '../utils/batchParser';
import { postJson } from '../utils/apiClient';
import { adManager } from '../services/adService';

interface TelegramAndMultiPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  setSlides?: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  setCurrentSlideIndex?: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  gradientBlur?: GradientBlurConfig;
  colorFilter?: ColorFilterConfig;
  overlayImage?: OverlayImageConfig;
  watermark?: WatermarkConfig;
}

const LOCAL_STORAGE_TG_TOKEN = 'autopost_telegram_bot_token';
const LOCAL_STORAGE_TG_CHAT_ID = 'autopost_telegram_chat_id';
const LOCAL_STORAGE_MULTI_WEBHOOK = 'autopost_multi_platform_webhook';
const LOCAL_STORAGE_SELECTED_PLATFORMS = 'autopost_selected_publish_platforms';

export const TelegramAndMultiPlatformModal: React.FC<TelegramAndMultiPlatformModalProps> = ({
  isOpen,
  onClose,
  slides,
  setSlides,
  setCurrentSlideIndex,
  aspectRatio,
  typography,
  logo,
  gradientBlur,
  colorFilter,
  overlayImage,
  watermark,
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'format' | 'multi'>('telegram');

  // Telegram settings
  const [botToken, setBotToken] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_TG_TOKEN) || '';
  });
  const [chatId, setChatId] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_TG_CHAT_ID) || '';
  });
  const [includeImages, setIncludeImages] = useState<boolean>(true);

  // Bot test status
  const [isTestingBot, setIsTestingBot] = useState<boolean>(false);
  const [botTestResult, setBotTestResult] = useState<{
    success: boolean;
    bot?: any;
    message?: string;
  } | null>(null);

  // Sending states
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [telegramProgress, setTelegramProgress] = useState<number | null>(null);
  const [telegramStatusText, setTelegramStatusText] = useState<string>('');
  const [telegramResult, setTelegramResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Multi-platform states
  const [multiWebhookUrl, setMultiWebhookUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_MULTI_WEBHOOK) || '';
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SELECTED_PLATFORMS);
      return saved ? JSON.parse(saved) : ['telegram', 'instagram', 'linkedin'];
    } catch {
      return ['telegram', 'instagram', 'linkedin'];
    }
  });
  const [isPublishingAll, setIsPublishingAll] = useState<boolean>(false);
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; message: string }> | null>(null);

  // Batch format sandbox state
  const [storyText, setStoryText] = useState<string>(() => formatSlidesToBatchText(slides));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  // Update storyText when modal opens or slides change
  useEffect(() => {
    if (isOpen) {
      setStoryText(formatSlidesToBatchText(slides));
    }
  }, [isOpen, slides]);

  // Persist configurations
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TG_TOKEN, botToken);
  }, [botToken]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TG_CHAT_ID, chatId);
  }, [chatId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MULTI_WEBHOOK, multiWebhookUrl);
  }, [multiWebhookUrl]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SELECTED_PLATFORMS, JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Test Telegram Bot Connection
  const handleTestBot = async () => {
    if (!botToken.trim()) {
      setBotTestResult({
        success: false,
        message: 'Veuillez saisir votre token de bot Telegram (obtenu via @BotFather).',
      });
      return;
    }

    setIsTestingBot(true);
    setBotTestResult(null);

    try {
      const data = (await postJson(
        '/api/telegram/test-connection',
        { botToken: botToken.trim() }
      )) as any;

      if (data?.success) {
        setBotTestResult({
          success: true,
          bot: data.bot,
          message: String(data.message || `Connecté au Bot @${data.bot?.username || ''}`),
        });
      } else {
        setBotTestResult({
          success: false,
          message: String(data?.error || 'Token de bot Telegram invalide.'),
        });
      }
    } catch (err: any) {
      setBotTestResult({
        success: false,
        message: err.message || 'Erreur lors du test de connexion Telegram.',
      });
    } finally {
      setIsTestingBot(false);
    }
  };

  // Send Story + HD Images to Telegram
  const executeSendTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTelegramResult({
        success: false,
        message: 'Veuillez configurer votre Bot Token et votre Chat ID / Canal Telegram.',
      });
      return;
    }

    setIsSendingTelegram(true);
    setTelegramResult(null);
    setTelegramProgress(10);
    setTelegramStatusText('Formatage de l\'histoire selon les normes...');

    try {
      const formattedStory = formatStoryForTelegram(slides, logo.brandText, logo.brandHandle);
      const rawBatchStory = formatSlidesToBatchText(slides);

      let imagesPayload: Array<{ base64: string; filename: string }> = [];

      if (includeImages) {
        setTelegramStatusText(`Génération des ${slides.length} visuels HD pour Telegram...`);
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          setTelegramProgress(Math.round(15 + ((i + 1) / slides.length) * 60));
          setTelegramStatusText(`Rendu HD de la diapo ${i + 1}/${slides.length}...`);

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

          const dataUrl = canvas.toDataURL('image/png', 0.95);
          imagesPayload.push({
            base64: dataUrl,
            filename: `diapo_${slide.number || i + 1}_${aspectRatio.id.replace(':', 'x')}.png`,
          });
        }
      }

      setTelegramProgress(85);
      setTelegramStatusText(`Envoi de l'album et de l'histoire sur Telegram (${chatId})...`);

      const res = (await postJson(
        '/api/telegram/send-story',
        {
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          storyText: rawBatchStory,
          htmlCaption: formattedStory.htmlText,
          images: imagesPayload,
        }
      )) as any;

      if (res?.success) {
        setTelegramProgress(100);
        setTelegramResult({
          success: true,
          message: String(res.message || `Histoire et visuels publiés avec succès sur Telegram (${chatId}) !`),
        });
      } else {
        throw new Error(String(res?.error || 'Échec de l\'envoi sur Telegram.'));
      }
    } catch (err: any) {
      console.error('Erreur Telegram:', err);
      setTelegramResult({
        success: false,
        message: err.message || 'Impossible d\'envoyer sur Telegram.',
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleSendTelegram = () => {
    adManager.triggerAd({
      actionTitle: 'Envoi Telegram Bot',
      actionType: 'webhook_export',
      onAdCompleted: () => executeSendTelegram(),
    });
  };

  // Publish to All Selected Platforms
  const executePublishAll = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Veuillez sélectionner au moins une plateforme.');
      return;
    }

    setIsPublishingAll(true);
    setPublishResults(null);

    try {
      const formattedStory = formatStoryForTelegram(slides, logo.brandText, logo.brandHandle);
      const rawBatchStory = formatSlidesToBatchText(slides);

      // Render images if needed
      let imagesPayload: Array<{ base64: string; filename: string }> = [];
      if (includeImages) {
        for (let i = 0; i < Math.min(slides.length, 10); i++) {
          const slide = slides[i];
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
          imagesPayload.push({
            base64: canvas.toDataURL('image/png', 0.92),
            filename: `diapo_${slide.number || i + 1}.png`,
          });
        }
      }

      const res = (await postJson('/api/publish-multi-platform', {
        platforms: selectedPlatforms,
        telegramConfig: {
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        },
        webhookUrl: multiWebhookUrl.trim(),
        storyData: {
          slides,
          storyText: rawBatchStory,
          htmlCaption: formattedStory.htmlText,
          seriesTitle: slides[0]?.kicker || 'Carrousel Story',
          hashtags: '#carrousel #story #mindset #growth #creation',
          images: imagesPayload,
        },
      })) as any;

      if (res?.results) {
        setPublishResults(res.results as Record<string, { success: boolean; message: string }>);
      } else if (res?.error) {
        throw new Error(String(res.error));
      }
    } catch (err: any) {
      alert(`Erreur de publication: ${err.message}`);
    } finally {
      setIsPublishingAll(false);
    }
  };

  // Parse and Apply Story text back into Studio Slides
  const handleApplyStoryToStudio = () => {
    if (!setSlides) return;
    const parsed = parseBatchInputText(storyText);
    if (parsed.slides.length === 0) {
      alert('Aucune diapositive détectée dans le texte.');
      return;
    }

    const newSlides: SlideItem[] = parsed.slides.map((p, idx) => {
      const existing = slides[idx] || slides[0];
      return {
        ...existing,
        id: `slide-story-${Date.now()}-${idx}`,
        number: idx + 1,
        text: p.text,
        kicker: p.kicker || existing.kicker || '',
        subtitle: p.subtitle || existing.subtitle || '',
      };
    });

    setSlides(newSlides);
    if (setCurrentSlideIndex) setCurrentSlideIndex(0);
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 3000);
  };

  // Toggle platform selection
  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  const currentParsed = parseBatchInputText(storyText);
  const formattedTelegramPreview = formatStoryForTelegram(slides, logo.brandText, logo.brandHandle);
  const webhookUrlExample = `${window.location.origin}/api/telegram/webhook`;

  const platformsConfig = [
    { id: 'telegram', name: 'Telegram', desc: 'Canal ou Groupe via Bot API direct', icon: '✈️', color: 'from-sky-500 to-blue-600' },
    { id: 'instagram', name: 'Instagram', desc: 'Carrousels, Stories & Reels (Make/Zapier)', icon: '📸', color: 'from-pink-500 to-purple-600' },
    { id: 'tiktok', name: 'TikTok', desc: 'Carrousel photos & Vidéo (Make/Zapier)', icon: '🎵', color: 'from-neutral-900 to-teal-500' },
    { id: 'linkedin', name: 'LinkedIn', desc: 'Document carrousel PDF & posts (Buffer/Zapier)', icon: '💼', color: 'from-blue-600 to-indigo-700' },
    { id: 'twitter', name: 'X / Twitter', desc: 'Threads & posts avec photos attachées', icon: '🐦', color: 'from-neutral-800 to-neutral-900' },
    { id: 'facebook', name: 'Facebook', desc: 'Page professionnelle ou Groupe', icon: '📘', color: 'from-blue-700 to-indigo-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <span>Bot Telegram & Publication Multi-Plateformes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                  Envoi Direct
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Envoyez des images sur Telegram avec le texte normé de l'histoire et publiez sur toutes les plateformes
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

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-neutral-800 flex gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'telegram', label: '1. Envoi Telegram Direct', icon: Send },
            { id: 'format', label: '2. Norme de l\'Histoire (: . /)', icon: MessageSquare },
            { id: 'multi', label: '3. Toutes les Plateformes', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-medium flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-white font-semibold'
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
          {/* TAB 1: TELEGRAM BOT INTEGRATION */}
          {activeTab === 'telegram' && (
            <div className="space-y-5">
              {/* Credentials Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bot Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                      <span>Token du Bot Telegram</span>
                    </span>
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 font-normal"
                    >
                      <span>Créer avec @BotFather</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Ex: 123456789:ABCdefGhIJKlmNoPQRstuvWxyz"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-sky-500 rounded-xl text-xs text-white placeholder-neutral-500 font-mono transition-colors"
                  />
                </div>

                {/* Chat ID / Channel */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>Canal, Groupe ou Chat ID</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      Ex: @mon_canal ou -100xxxxxxx
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="@votre_canal_public ou id"
                      className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-sky-500 rounded-xl text-xs text-white placeholder-neutral-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleTestBot}
                      disabled={isTestingBot || !botToken}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {isTestingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                      <span>Tester Bot</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bot Test Result Notice */}
              {botTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    botTestResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {botTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{botTestResult.message}</span>
                  </div>
                </div>
              )}

              {/* Content Packaging Options */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white">Options de publication Telegram</span>
                    <p className="text-[11px] text-neutral-400">
                      Format automatique selon les normes : titre kicker (:), phrase principale (.) et signature (/)
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                    <span>Inclure les {slides.length} images HD</span>
                  </label>
                </div>

                {/* Caption / Story preview */}
                <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Aperçu du message formaté :</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formattedTelegramPreview.plainText, 'preview-caption')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      {copiedKey === 'preview-caption' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copier texte</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-neutral-300 whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar bg-neutral-950/70 p-2.5 rounded border border-neutral-800">
                    {formattedTelegramPreview.plainText}
                  </pre>
                </div>
              </div>

              {/* Progress during send */}
              {isSendingTelegram && (
                <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-300 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>{telegramStatusText}</span>
                    </span>
                    <span className="font-mono text-sky-400 font-bold">{telegramProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${telegramProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Notice */}
              {telegramResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    telegramResult.success
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
                  }`}
                >
                  {telegramResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{telegramResult.message}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleSendTelegram}
                disabled={isSendingTelegram || !botToken || !chatId}
                className="w-full py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-950/60 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingTelegram
                    ? 'Publication en cours sur Telegram...'
                    : `Envoyer les images et l'histoire sur Telegram (${slides.length} diapos)`}
                </span>
              </button>

              {/* Inbound Webhook Listener Box */}
              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                    <span>Réception automatique : Webhook Telegram</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrlExample, 'webhook-url')}
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'webhook-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copier l'URL Webhook</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Vous pouvez configurer ce webhook auprès de Telegram pour que n'importe quelle histoire envoyée à votre bot avec les 3 préfixes (: . /) soit reçue automatiquement :
                </p>
                <code className="block p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-sky-300 overflow-x-auto">
                  {webhookUrlExample}
                </code>
              </div>
            </div>
          )}

          {/* TAB 2: FORMAT DE L'HISTOIRE (: . /) & BAC À SABLE */}
          {activeTab === 'format' && (
            <div className="space-y-4">
              {/* Guide Reminder Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-neutral-950 to-neutral-950 border border-indigo-500/30 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Guide pratique · Découpez vos diapos en quelques secondes grâce à 3 préfixes</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="font-mono text-amber-400 font-bold">:Titre :</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Titre Kicker en haut (Optionnel)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="font-mono text-emerald-400 font-bold">.Phrase</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Phrase principale (1 point = 1 diapo)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="font-mono text-indigo-400 font-bold">/Signature ou Date</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Sous-titre (ex: /date d'aujourd'hui)</p>
                  </div>
                </div>
              </div>

              {/* Story Textarea Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Texte de l'histoire (Format lot) :</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setStoryText(
                          `:Les secrets du marketing :\n.Votre attention est votre ressource la plus précieuse : protégez-la sans compromis.\n/date d'aujourd'hui\n\n:Règle d'or :\n.La constance et la clarté battent le volume sonore.\n/@studio.horizon`
                        )
                      }
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      Insérer exemple
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(storyText, 'story-box')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                    >
                      {copiedKey === 'story-box' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copier</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder=":Titre :\n.Votre phrase principale\n/date d'aujourd'hui"
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs text-neutral-200 font-mono leading-relaxed transition-colors custom-scrollbar"
                />
              </div>

              {/* Action: Apply to Studio Slides */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-xs text-neutral-300">
                  <span>Détecté : </span>
                  <strong className="text-indigo-400 font-mono font-bold">
                    {currentParsed.slides.length} diapositives
                  </strong>
                  <span className="text-neutral-500 ml-1">
                    ({currentParsed.hasPrefixSyntax ? 'Syntaxe : . / valide' : 'Format simple'})
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleApplyStoryToStudio}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Appliquer aux diapos du studio</span>
                  </button>
                </div>
              </div>

              {applySuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Diapositives mises à jour dans le studio avec succès !</span>
                </div>
              )}

              {/* Cards preview of detected slides */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-400">
                  Aperçu des diapositives découpées ({currentParsed.slides.length}) :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                  {currentParsed.slides.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span className="font-mono font-bold text-indigo-400">Diapo #{idx + 1}</span>
                        {s.kicker && (
                          <span className="text-amber-400 truncate max-w-[150px] font-semibold">
                            :{s.kicker}:
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-200 line-clamp-2 leading-relaxed">
                        .{s.text}
                      </p>
                      {s.subtitle && (
                        <p className="text-[10px] text-neutral-400 italic truncate">
                          /{s.subtitle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLICATION MULTI-PLATEFORMES */}
          {activeTab === 'multi' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-neutral-950 border border-purple-800/40 space-y-1">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>Publication synchronisée sur toutes vos plateformes</span>
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Publiez directement sur Telegram via Bot API et diffusez simultanément sur Instagram, TikTok, LinkedIn, Twitter et Facebook grâce à vos scénarios Make.com, Zapier ou Buffer.
                </p>
              </div>

              {/* Platform Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">
                  Sélectionnez les plateformes cibles :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {platformsConfig.map((p) => {
                    const isSelected = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-neutral-900 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{p.icon}</span>
                            <span className="text-xs font-bold text-white">{p.name}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-neutral-700 bg-neutral-900'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                          {p.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Webhook Dispatcher connector */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="text-xs font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Connecteur Webhook Multi-Réseaux (Make / Zapier / Buffer / n8n)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">HTTPS requis</span>
                </label>
                <input
                  type="url"
                  value={multiWebhookUrl}
                  onChange={(e) => setMultiWebhookUrl(e.target.value)}
                  placeholder="https://hook.eu1.make.com/votre-scenario-reseaux..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-neutral-500 font-mono transition-colors"
                />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Le webhook transmet automatiquement les images générées, l'histoire découpée, les titres kickers, signatures et hashtags prêts à publier.
                </p>
              </div>

              {/* Results status */}
              {publishResults && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-xs font-semibold text-white">Rapport de publication :</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(publishResults).map(([platform, res]) => (
                      <div
                        key={platform}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          res.success
                            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                            : 'bg-red-950/30 border-red-800/50 text-red-300'
                        }`}
                      >
                        <span className="font-bold uppercase text-[10px]">{platform}</span>
                        <span className="truncate max-w-[200px] text-[11px]">{res.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={executePublishAll}
                disabled={isPublishingAll || selectedPlatforms.length === 0}
                className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                <span>
                  {isPublishingAll
                    ? 'Publication synchronisée en cours...'
                    : `Publier sur les ${selectedPlatforms.length} plateformes sélectionnées`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
