import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Share2,
  Layers,
  Flame,
  Info,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Hash,
  Send,
  Wand2,
  CheckCircle2,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { SlideItem } from '../types';
import { postJson } from '../utils/apiClient';
import { isArabicText } from '../utils/canvasRenderer';
import { traceAsync } from '../services/performanceService';

interface SocialCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  currentSlideIndex: number;
}

export type PlatformKey =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'snapchat'
  | 'linkedin'
  | 'twitter'
  | 'pinterest'
  | 'discord'
  | 'quora'
  | 'vk'
  | 'prompt';

interface PlatformMeta {
  id: PlatformKey;
  name: string;
  badge: string;
  badgeColor: string;
  algoTip: string;
  maxHashtags: string;
  formatType: string;
}

export const PLATFORMS_METADATA: PlatformMeta[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    badge: 'Carrousel & Reels',
    badgeColor: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30',
    algoTip: 'Les carrousels et enregistrements (Saves) ont le plus grand poids dans l\'algorithme. Hook visible sous 125 caractères.',
    maxHashtags: '3 à 5 tags de niche',
    formatType: 'Carrousel / Post / Story',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'Carrousel Photo & Vidéo',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    algoTip: 'Optimisé pour la barre de recherche TikTok (Search SEO). Mots-clés naturels dans les 2 premières lignes.',
    maxHashtags: '3 à 5 hashtags ciblés',
    formatType: 'Carrousel Photo / Vidéo',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    badge: 'Shorts & Communauté',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    algoTip: 'Titre sous 70 caractères pour un taux de clic (CTR) maximal sur mobile. #Shorts en description.',
    maxHashtags: '3 tags #Shorts',
    formatType: 'Shorts & Post Communauté',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    badge: 'Post & Page',
    badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    algoTip: 'Privilégiez les questions ouvertes pour déclencher des conversations. Les posts sans lien externe ont +30% de reach.',
    maxHashtags: '0 à 2 hashtags max',
    formatType: 'Post Page / Groupe',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    badge: 'Spotlight & Story',
    badgeColor: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    algoTip: 'Texte court, visuel percutant, call-to-action dynamique pour susciter le swipe ou le partage entre amis.',
    maxHashtags: '1 à 2 thèmes',
    formatType: 'Spotlight & Story',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    badge: 'Carrousel Document & Post',
    badgeColor: 'bg-sky-600/20 text-sky-300 border-sky-500/30',
    algoTip: 'Structure aérée, retour d\'expérience pro et question d\'ouverture. Éviter plus de 3 hashtags pour ne pas être classé spam.',
    maxHashtags: '3 hashtags métiers',
    formatType: 'Document PDF / Post',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    badge: 'Tweet & Fil',
    badgeColor: 'bg-neutral-800 text-neutral-200 border-neutral-700',
    algoTip: 'Format percutant sous 250 caractères. 1 seul hashtag pour préserver le taux d\'engagement.',
    maxHashtags: '1 à 2 hashtags max',
    formatType: 'Tweet / Thread',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    badge: 'Épingle Idée',
    badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
    algoTip: 'Moteur de recherche visuel. Titre et description optimisés sur des mots-clés d\'intention de recherche.',
    maxHashtags: '2 à 4 mots-clés',
    formatType: 'Épingle Idée / Visuelle',
  },
  {
    id: 'discord',
    name: 'Discord',
    badge: 'Communauté',
    badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    algoTip: 'Mise en page Markdown soignée avec gras, citations et emojis pour animer votre serveur ou vos salons d\'annonces.',
    maxHashtags: 'Rôles & Canaux',
    formatType: 'Annonce & Discussion',
  },
  {
    id: 'quora',
    name: 'Quora',
    badge: 'Réponse Experte',
    badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    algoTip: 'Positionnez-vous comme expert avec une analyse claire et structurée répondant à une problématique précise.',
    maxHashtags: 'Thèmes de l\'Espace',
    formatType: 'Réponse & Article',
  },
  {
    id: 'vk',
    name: 'VKontakte (VK)',
    badge: 'Mur & Groupe',
    badgeColor: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    algoTip: 'Ton convivial et engageant adapté aux communautés VK avec discussion et hashtags thématiques.',
    maxHashtags: '3 à 4 hashtags',
    formatType: 'Publication Communauté',
  },
  {
    id: 'prompt',
    name: 'Prompt IA Maître',
    badge: 'Prompt Réutilisable',
    badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    algoTip: 'Copiez ce prompt pour le coller dans ChatGPT, Claude ou Gemini afin d\'explorer d\'autres angles créatifs.',
    maxHashtags: 'Multi-plateformes',
    formatType: 'Prompt LLM Prompting',
  },
];

export const SocialCopyModal: React.FC<SocialCopyModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
}) => {
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(currentSlideIndex);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyCache, setCopyCache] = useState<Record<number, any>>({});

  const activeSlide = slides[selectedSlideIdx] || slides[0];

  useEffect(() => {
    setSelectedSlideIdx(currentSlideIndex);
  }, [currentSlideIndex]);

  useEffect(() => {
    if (isOpen && activeSlide && !copyCache[selectedSlideIdx]) {
      fetchSocialCopy(selectedSlideIdx);
    }
  }, [isOpen, selectedSlideIdx]);

  const generateLocalFallback = (slide: SlideItem) => {
    const isArabic = isArabicText(slide.text || '') || isArabicText(slide.kicker || '');
    const cleanKicker = slide.kicker?.trim() || (isArabic ? 'حكمة' : 'Conseil');
    const tagKicker = cleanKicker.replace(/\s+/g, isArabic ? '_' : '');

    if (isArabic) {
      return {
        instagram: {
          title: 'Instagram (Carrousel & Post)',
          caption: `✨ "${slide.text}"\n\nفكرة تستحق التأمل في بداية هذا اليوم. ما رأيك في هذه الرؤية؟ شاركنا رأيك وتجربتك في التعليقات!\n\n📌 احفظ هذا المنشور للعودة إليه لاحقاً.`,
          hashtags: `#${tagKicker} #تطوير_الذات #ريادة #نجاح #إلهام #أهداف #تحفيز`,
          tips: 'المنشورات القابلة للحفظ (Saves) تمنحك أعلى وصول في خوارزمية إنستغرام.',
        },
        tiktok: {
          title: 'TikTok (Carrousel Photo & Vidéo)',
          caption: `👀 اسحب للشريحة التالية لمتابعة السلسلة!\n\n"${slide.text}"\n\nما رأيك في هذه القاعدة؟`,
          hashtags: `#${tagKicker} #fyp #viral #تحفيز #تطوير_الذات`,
          tips: 'استخدم كلمات مفتاحية في أول سطرين للظهور في نتائج بحث تيك توك.',
        },
        youtube: {
          title: 'YouTube (Shorts & Post Communauté)',
          caption: `${cleanKicker} : ${slide.text.slice(0, 60)}...\n\nفيديو قصير ملهم عن أهمية ${cleanKicker} في تحقيق أهدافك. اشترك لمتابعة المزيد يومياً!`,
          hashtags: `#Shorts #${tagKicker} #تحفيز`,
          tips: 'العنوان تحت 70 حرفاً يحقق أعلى نسبة نقر على الهواتف.',
        },
        facebook: {
          title: 'Facebook (Post & Page)',
          caption: `صباح الخير للجميع 🌟\n\n"${slide.text}"\n\nكيف تطبقون هذه الرؤية في حياتكم أو عملكم اليوم؟ شاركونا آراءكم في التعليقات.`,
          hashtags: `#${tagKicker}`,
          tips: 'الأسئلة الحوارية ترفع التفاعل والتعليقات بشكل كبير.',
        },
        snapchat: {
          title: 'Snapchat (Spotlight & Story)',
          caption: `قاعدة اليوم 💡 "${slide.text}"`,
          hashtags: `#${tagKicker}`,
          tips: 'نص قصير ومباشر مع دعوة واضحة للتفاعل.',
        },
        linkedin: {
          title: 'LinkedIn (Post d\'expertise & Carrousel)',
          caption: `💡 في عالم الأعمال والتطوير السريع، يمنحنا التوقف والتأمل في هذه الفكرة أفقاً جديداً:\n\n"${slide.text}"\n\nالنقاط المستفادة:\n• التركيز على القيمة المستدامة\n• الاستمرارية تتفوق على الحماس المؤقت\n\nكيف ترون تطبيق هذا المفهوم في فرق العمل اليوم؟`,
          hashtags: `#${tagKicker} #قيادة #ريادة_الأعمال`,
          tips: 'المنشورات المنسقة مع قوائم نقطية تحقق تفاعلاً مهنياً أعلى بـ 3 أضعاف.',
        },
        twitter: {
          title: 'X / Twitter (Tweet & Fil)',
          caption: `"${slide.text}"\n\nتأمل اليوم.`,
          hashtags: `#${tagKicker}`,
          tips: 'أقل من 250 حرفاً لضمان سهولة إعادة التغريد والاقتباس.',
        },
        pinterest: {
          title: 'Pinterest (Épingle Idée & Standard)',
          caption: `فكرة ملهمة وتصميم مميز: ${slide.text}\n\nاحفظ هذه الفكرة في لوحة الإلهام الخاصة بك.`,
          hashtags: `#${tagKicker} #تصميم #إلهام`,
          tips: 'بينتريست محرك بحث بصري؛ الكلمات المفتاحية تضمن ظهورك لأشهر قادمة.',
        },
        discord: {
          title: 'Discord (Annonce & Discussion)',
          caption: `📢 **تأمل اليوم في السيرفر**\n\n> "${slide.text}"\n\n💬 ما هي تجاربكم مع هذا المبدأ؟ شاركونا في صالون النقاش العام!`,
          hashtags: '',
          tips: 'تنسيق Markdown بالخط العريض والاقتباس يجذب أعضاء السيرفر فوراً.',
        },
        quora: {
          title: 'Quora (Réponse experte & Espace)',
          caption: `سؤال: كيف نصل إلى النجاح والاستمرارية في العمل؟\n\nإجابة:\nالأساس يبدأ من هذا المبدأ: "${slide.text}".\n\nعندما نركز على التطبيق العملي اليومي بدلاً من النتائج السريعة، تبدأ النتائج الحقيقية بالظهور.`,
          hashtags: `#${tagKicker}`,
          tips: 'قدم قيمة معرفية مباشرة واجعل أسلوبك موضوعياً وواضحاً.',
        },
        vk: {
          title: 'VKontakte (Mur & Communauté)',
          caption: `Вдохновение дня ✨\n\n"${slide.text}"\n\nДелитесь вашими мыслями в комментариях!`,
          hashtags: `#${tagKicker} #мотивация`,
          tips: 'الأسلوب التفاعلي والدافئ يجذب رواد مجتمعات VK.',
        },
        masterPrompt: `Tu es un expert mondial en stratégie de contenu viral et Copywriting pour les réseaux sociaux. Rédige un pack complet de publications captivantes pour le visuel suivant :\n\nThématique : ${cleanKicker}\nTexte : "${slide.text}"\n${slide.subtitle ? `Signature : ${slide.subtitle}\n` : ''}\nObjectif : Maximiser les sauvegardes, partages et commentaires qualifiés. Fournis des variantes adaptées pour Instagram, TikTok, LinkedIn, YouTube Shorts et Twitter avec les accroches (hooks), les corps de texte et les hashtags de niche pertinents.`,
      };
    }

    return {
      instagram: {
        title: 'Instagram (Carrousel & Post)',
        caption: `✨ "${slide.text}"\n\nUne réflexion essentielle pour transformer votre vision en résultats concrets. Qu'en pensez-vous ? Partagez votre expérience en commentaire !\n\n📌 Sauvegardez ce post pour y revenir quand vous en aurez besoin.`,
        hashtags: `#${tagKicker.toLowerCase()} #motivation #mindset #entrepreneuriat #succes #creation #autopost`,
        tips: 'Les carrousels et enregistrements (Saves) ont le plus grand poids dans l\'algorithme.',
      },
      tiktok: {
        title: 'TikTok (Carrousel Photo & Vidéo)',
        caption: `👀 Swipe pour la suite de la série !\n\n"${slide.text}"\n\nTu valides ce principe ou pas du tout ? Dis-le en commentaire !`,
        hashtags: `#${tagKicker.toLowerCase()} #fyp #pourtoi #devperso #motivation #viral`,
        tips: 'Placez vos mots-clés dans les 2 premières lignes pour le référencement de recherche TikTok.',
      },
      youtube: {
        title: 'YouTube (Shorts & Post Communauté)',
        caption: `${cleanKicker} : ${slide.text.slice(0, 60)}...\n\nDécouvrez cette règle fondamentale pour débloquer votre potentiel. Abonnez-vous pour un conseil percutant chaque matin !`,
        hashtags: `#Shorts #${tagKicker.toLowerCase()} #Conseil`,
        tips: 'Un titre clair sous 70 caractères génère le meilleur taux de clic (CTR).',
      },
      facebook: {
        title: 'Facebook (Post & Page)',
        caption: `Bonjour à tous 🌟\n\n"${slide.text}"\n\nComment appliquez-vous ce principe dans vos projets ou au quotidien ? Hâte de lire vos retours !`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: 'Les publications conversationnelles sans lien externe obtiennent jusqu\'à 30% de portée en plus.',
      },
      snapchat: {
        title: 'Snapchat (Spotlight & Story)',
        caption: `💡 Le rappel du jour : "${slide.text}"`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: 'Texte punchy et direct pour capter l\'attention en moins de 3 secondes.',
      },
      linkedin: {
        title: 'LinkedIn (Post d\'expertise & Carrousel)',
        caption: `💡 "${slide.text}"\n\nDans un environnement où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers d'excellence.\n\nCe que l'expérience m'a appris :\n1. La clarté précède toujours l'efficacité.\n2. La constance bat l'intensité ponctuelle.\n\nQuelle est votre approche sur ce sujet dans vos équipes ?`,
        hashtags: `#Leadership #${cleanKicker.replace(/\s+/g, '')} #Management #Strategie`,
        tips: 'LinkedIn favorise les réflexions de fond avec une question finale invitant aux commentaires professionnels.',
      },
      twitter: {
        title: 'X / Twitter (Tweet & Fil)',
        caption: `"${slide.text}"\n\nÀ méditer aujourd'hui.`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: 'Moins de 250 caractères pour encourager le retweet et la citation avec commentaire.',
      },
      pinterest: {
        title: 'Pinterest (Épingle Idée & Standard)',
        caption: `Inspiration du jour : ${slide.text}\n\nEnregistrez cette épingle dans votre tableau d'objectifs pour garder le cap.`,
        hashtags: `#${tagKicker.toLowerCase()} #inspiration #motivation`,
        tips: 'Pinterest est un moteur de recherche : des mots-clés clairs assurent une visibilité pendant plusieurs mois.',
      },
      discord: {
        title: 'Discord (Annonce & Discussion)',
        caption: `📢 **Pensée du jour sur le serveur**\n\n> "${slide.text}"\n\n💬 Qu'est-ce que cela vous inspire pour vos projets actuels ? On en discute dans le salon général !`,
        hashtags: '',
        tips: 'La syntaxe Markdown avec citation (> ) et gras (** **) offre une lisibilité parfaite.',
      },
      quora: {
        title: 'Quora (Réponse experte & Espace)',
        caption: `Question : Quelle est la clé principale pour tenir ses objectifs dans la durée ?\n\nRéponse :\nTout part de ce constat : "${slide.text}".\n\nEn concentrant vos efforts sur la constance quotidienne plutôt que sur la perfection immédiate, vous créez un avantage cumulé durable.`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: 'Structurez votre réponse avec une introduction directe et des arguments concrets.',
      },
      vk: {
        title: 'VKontakte (Mur & Communauté)',
        caption: `Вдохновение дня ✨\n\n"${slide.text}"\n\nДелитесь вашим мнением в комментариях!`,
        hashtags: `#${tagKicker.toLowerCase()} #мотивация #успех`,
        tips: 'Un ton chaleureux et communautaire stimule les réactions sur VK.',
      },
      masterPrompt: `Tu es un expert mondial en stratégie de contenu viral et Copywriting pour les réseaux sociaux. Rédige un pack complet de publications captivantes pour le visuel suivant :\n\nThématique : ${cleanKicker}\nTexte : "${slide.text}"\n${slide.subtitle ? `Signature : ${slide.subtitle}\n` : ''}\nObjectif : Maximiser les sauvegardes, partages et commentaires qualifiés. Fournis des variantes adaptées pour Instagram, TikTok, LinkedIn, YouTube Shorts et Twitter avec les accroches (hooks), les corps de texte et les hashtags de niche pertinents.`,
    };
  };

  const fetchSocialCopy = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setIsLoading(true);
    try {
      const data = await traceAsync('generate_social_copy', () =>
        postJson('/api/generate-social-copy', {
          phrase: slide.text,
          kicker: slide.kicker,
        }),
      );

      if (data?.copy) {
        setCopyCache((prev) => ({ ...prev, [slideIndex]: data.copy }));
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    const fallback = generateLocalFallback(slide);
    setCopyCache((prev) => ({ ...prev, [slideIndex]: fallback }));
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const currentData = copyCache[selectedSlideIdx] || generateLocalFallback(activeSlide);
  const platformContent = currentData[activePlatform] || {
    caption: '',
    hashtags: '',
    tips: '',
  };

  const isPromptTab = activePlatform === 'prompt';
  const masterPromptText = currentData.masterPrompt || generateLocalFallback(activeSlide).masterPrompt;

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullPost = () => {
    const full = platformContent.hashtags
      ? `${platformContent.caption}\n\n${platformContent.hashtags}`
      : platformContent.caption;
    handleCopy(full, 'full');
  };

  const currentMeta = PLATFORMS_METADATA.find((p) => p.id === activePlatform) || PLATFORMS_METADATA[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <span>Légendes, Tags & Hashtags par Plateforme</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Algorithmes 2026
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Optimisé selon les critères de chaque réseau social et types de publication
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSocialCopy(selectedSlideIdx)}
              disabled={isLoading}
              className="p-1.5 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Régénérer avec l'IA"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Carousel Selector Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-xs text-neutral-400 font-medium shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Diapo :</span>
          </span>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedSlideIdx(idx)}
              className={`px-3 py-1 text-xs rounded-lg font-mono shrink-0 transition-all ${
                selectedSlideIdx === idx
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/60'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              #{s.number} {s.kicker ? `· ${s.kicker.slice(0, 14)}` : ''}
            </button>
          ))}
        </div>

        {/* Platforms Horizontal Scrollable Tabs */}
        <div className="px-3 sm:px-6 pt-2.5 pb-2 border-b border-neutral-800 bg-neutral-900/50 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          {PLATFORMS_METADATA.map((p) => {
            const isActive = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-white font-semibold border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                {p.id === 'prompt' ? (
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-indigo-500/80" />
                )}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* Platform Criteria & Rules Header Banner */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentMeta.badgeColor}`}>
                {currentMeta.badge}
              </span>
              <span className="text-xs text-neutral-400">
                Format : <strong className="text-neutral-200">{currentMeta.formatType}</strong>
              </span>
              <span className="text-xs text-neutral-400">
                · Limite tags : <strong className="text-neutral-200">{currentMeta.maxHashtags}</strong>
              </span>
            </div>
            <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 bg-amber-950/30 border border-amber-900/40 px-2.5 py-1 rounded-lg">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentMeta.algoTip}</span>
            </div>
          </div>

          {/* ACTIVE CONTENT VIEW */}
          {isPromptTab ? (
            /* Prompt Master Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Prompt IA Maître Prêt à l'Emploi</span>
                  </h4>
                  <button
                    onClick={() => handleCopy(masterPromptText, 'master-prompt')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    {copiedKey === 'master-prompt' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Collez ce prompt dans n'importe quel modèle IA (Gemini, Claude, ChatGPT) pour décliner cette idée en 10 variations d'angles éditoriaux, threads ou carrousels.
                </p>
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {masterPromptText}
                </div>
              </div>
            </div>
          ) : (
            /* Regular Platform Content */
            <div className="space-y-4">
              {/* Caption Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Légende / Texte du post ({currentMeta.name})</span>
                  </label>
                  <button
                    onClick={() => handleCopy(platformContent.caption, 'caption')}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedKey === 'caption' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'caption' ? 'Copié' : 'Copier la légende'}</span>
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={platformContent.caption}
                    rows={6}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-200 leading-relaxed resize-none focus:outline-none focus:border-indigo-500 custom-scrollbar"
                  />
                  <div className="absolute bottom-2.5 right-3 text-[10px] text-neutral-500 font-mono">
                    {platformContent.caption?.length || 0} caractères
                  </div>
                </div>
              </div>

              {/* Hashtags / Tags Box */}
              {platformContent.hashtags && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hashtags & Mots-clés SEO ({currentMeta.name})</span>
                    </label>
                    <button
                      onClick={() => handleCopy(platformContent.hashtags, 'tags')}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {copiedKey === 'tags' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'tags' ? 'Copié' : 'Copier les tags'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed select-all">
                    {platformContent.hashtags}
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={handleCopyFullPost}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-colors"
                >
                  {copiedKey === 'full' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Post complet copié dans le presse-papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier le post complet (Légende + Tags)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActivePlatform('prompt')}
                  className="w-full sm:w-auto py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
                >
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>Obtenir le Prompt IA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
