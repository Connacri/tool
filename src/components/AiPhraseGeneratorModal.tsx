import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Send,
  Globe,
  Layers,
  Flame,
  ArrowRight,
  Eye,
  RefreshCw,
  Hash,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { SlideItem } from '../types';
import { getApiUrl } from '../utils/apiConfig';
import { isArabicText } from '../utils/canvasRenderer';

interface AiPhraseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  setSlides: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  setCurrentSlideIndex: (idx: number) => void;
  currentSlideIndex: number;
}

export type PlatformKey =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'snapchat'
  | 'pinterest'
  | 'discord'
  | 'quora'
  | 'masterPrompt';

interface PlatformMeta {
  id: PlatformKey;
  name: string;
  badge: string;
  badgeColor: string;
  iconText: string;
}

const PLATFORMS_META: PlatformMeta[] = [
  { id: 'instagram', name: 'Instagram', badge: 'Carrousel & Reels', badgeColor: 'from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30', iconText: '📸' },
  { id: 'tiktok', name: 'TikTok', badge: 'Carrousel & SEO', badgeColor: 'from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/30', iconText: '🎵' },
  { id: 'youtube', name: 'YouTube', badge: 'Shorts & Post', badgeColor: 'from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30', iconText: '▶️' },
  { id: 'linkedin', name: 'LinkedIn', badge: 'Post Pro & PDF', badgeColor: 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/30', iconText: '💼' },
  { id: 'twitter', name: 'X / Twitter', badge: 'Tweet & Fil', badgeColor: 'from-neutral-700/40 to-neutral-800/40 text-neutral-200 border-neutral-700', iconText: '𝕏' },
  { id: 'facebook', name: 'Facebook', badge: 'Page & Groupe', badgeColor: 'from-blue-600/20 to-indigo-600/20 text-blue-300 border-blue-500/30', iconText: '👥' },
  { id: 'pinterest', name: 'Pinterest', badge: 'Épingle Idée', badgeColor: 'from-rose-600/20 to-red-600/20 text-rose-300 border-rose-500/30', iconText: '📌' },
  { id: 'snapchat', name: 'Snapchat', badge: 'Spotlight & Story', badgeColor: 'from-amber-400/20 to-yellow-500/20 text-yellow-300 border-yellow-500/30', iconText: '👻' },
  { id: 'discord', name: 'Discord', badge: 'Communauté', badgeColor: 'from-indigo-600/20 to-violet-600/20 text-indigo-300 border-indigo-500/30', iconText: '💬' },
  { id: 'masterPrompt', name: 'Master Prompt', badge: 'ChatGPT / Claude', badgeColor: 'from-emerald-600/20 to-teal-600/20 text-emerald-300 border-emerald-500/30', iconText: '🤖' },
];

export const AiPhraseGeneratorModal: React.FC<AiPhraseGeneratorModalProps> = ({
  isOpen,
  onClose,
  slides,
  setSlides,
  setCurrentSlideIndex,
  currentSlideIndex,
}) => {
  // Form input states
  const [topicDescription, setTopicDescription] = useState<string>(
    'Conseils percutants pour la productivité, le focus et le mindset'
  );
  const [phraseCount, setPhraseCount] = useState<number>(6);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [selectedTone, setSelectedTone] = useState<string>('Inspirant & Professionnel');

  // Generator & UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('instagram');
  const [selectedSlidePreviewIdx, setSelectedSlidePreviewIdx] = useState<number>(0);

  // Social pack data
  const [socialData, setSocialData] = useState<Record<string, any>>({});
  const [generatedPhrases, setGeneratedPhrases] = useState<any[]>([]);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset topics for quick 1-click filling
  const presetTopics = [
    { label: '🚀 Discipline & Focus', fr: 'Discipline de fer, constance et élimination des distractions', ar: 'الانضباط الذاتي، التركيز العالي والتخلص من المشتتات', lang: 'fr' },
    { label: '💡 Entrepreneuriat', fr: 'Erreurs des entrepreneurs et comment passer à l\'action', ar: 'أسرار ريادة الأعمال وبناء المشاريع الناجحة', lang: 'fr' },
    { label: '✨ النجاح والانضباط (عربي)', fr: 'الانضباط والنجاح والوضوح الذهني', ar: 'الانضباط الذاتي وقوة الاستمرارية والنجاح الشخصي', lang: 'ar' },
    { label: '🧠 Sagesse & Philosophie', fr: 'Stoïcisme, sagesse intemporelle et paix de l\'esprit', ar: 'حكم فلسفية عميقة عن راحة البال والتوازن', lang: 'fr' },
    { label: '🎨 Design & Créativité', fr: 'Principes de design minimaliste et valeur du détail', ar: 'مبادئ الإبداع والتصميم والتطوير', lang: 'fr' },
    { label: '📌 حكم وأمثال عربية', fr: 'Citations arabes inspirantes', ar: 'أقوال وحكم عربية خالدة ملهمة للمستقبل', lang: 'ar' },
  ];

  const handleApplyPreset = (item: typeof presetTopics[0]) => {
    if (item.lang === 'ar') {
      setSelectedLanguage('ar');
      setTopicDescription(item.ar);
    } else {
      setSelectedLanguage('fr');
      setTopicDescription(item.fr);
    }
  };

  const handleCopyText = async (textToCopy: string, key: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // fallback
    }
  };

  // Main generation handler
  const handleGenerateAndApply = async () => {
    if (!topicDescription.trim()) {
      setErrorMessage('Veuillez entrer une description de ce que vous souhaitez générer.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const isArabic = selectedLanguage === 'ar' || isArabicText(topicDescription);

    try {
      // 1. Call phrases + social pack API
      const res = await fetch(getApiUrl('/api/generate-phrases-with-social'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicDescription,
          count: phraseCount,
          tone: selectedTone,
          language: selectedLanguage,
        }),
      });

      let phrasesData: any[] = [];
      let copyData: Record<string, any> = {};

      if (res.ok) {
        const data = await res.json();
        phrasesData = data.phrases || [];
        copyData = data.socialCopy || {};
      } else {
        // Fallback: try standard /api/generate-phrases
        const fallbackRes = await fetch(getApiUrl('/api/generate-phrases'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicDescription,
            count: phraseCount,
            tone: selectedTone,
            language: selectedLanguage,
          }),
        });

        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          phrasesData = fbData.phrases || [];
        }
      }

      // If still empty, use high-quality local template batch
      if (!phrasesData || phrasesData.length === 0) {
        phrasesData = isArabic
          ? [
              { id: 1, text: "الوضوح يسبق النجاح دائماً: حدد وجهتك أولاً ثم انطلق بثبات.", kicker: "الوضوح الاستراتيجي", subtitle: "حكمة اليوم 01" },
              { id: 2, text: "الاستمرارية الهادئة تتفوق دائماً على الحماس المؤقت والمتقطع.", kicker: "قوة العادة", subtitle: "تطوير الذات 02" },
              { id: 3, text: "لا تنتظر الفرصة المثالية، بل اصنعها بخطوة صغيرة تخطوها الآن.", kicker: "المبادرة والعمل", subtitle: "ريادة الأعمال 03" },
              { id: 4, text: "الإبداع ليس موهبة نادرة، بل نظرة شجاعة ومختلفة إلى العالم.", kicker: "الابتكار والتجديد", subtitle: "عقلية متجددة 04" },
              { id: 5, text: "استثمر في عقلك ومعرفتك، فالقيمة الحقيقية تبدأ من داخلك.", kicker: "النمو المستمر", subtitle: "استثمار مستدام 05" },
              { id: 6, text: "ابنِ أفكارك لتدوم وتلهم الآخرين، وليس لمجرد لفت الانتباه المؤقت.", kicker: "أثر مستمر", subtitle: "احفظ هذا المنشور 📌 06" },
            ].slice(0, phraseCount)
          : [
              { id: 1, text: "La clarté précède toujours l'efficacité : définissez votre cap avant d'accélérer.", kicker: "STRATÉGIE", subtitle: "Règle #1 du succès" },
              { id: 2, text: "La constance bat l'intensité : 1% d'amélioration quotidienne crée un avantage cumulé.", kicker: "MINDSET & DISCIPLINE", subtitle: "Principe fondamental" },
              { id: 3, text: "N'attendez pas le moment parfait : le courage commence par une première action concrète.", kicker: "PASSAGE À L'ACTION", subtitle: "Entrepreneuriat" },
              { id: 4, text: "Votre valeur réside dans ce que vous construisez sur le long terme, pas dans le buzz éphémère.", kicker: "VISION LONG TERME", subtitle: "Impact durable" },
              { id: 5, text: "L'apprentissage continu est le meilleur levier pour transformer vos ambitions en réalités.", kicker: "ÉVOLUTION PERSONNELLE", subtitle: "Croissance continue" },
              { id: 6, text: "Enregistrez ce rappel pour vos moments de doute et partagez-le à votre équipe.", kicker: "ENGAGEMENT", subtitle: "AutoPost Studio 📌" },
            ].slice(0, phraseCount);
      }

      // Generate local social copy if not returned by server
      if (!copyData || Object.keys(copyData).length === 0) {
        const leadPhrase = phrasesData[0]?.text || topicDescription;
        const leadKicker = phrasesData[0]?.kicker || 'Conseil';
        const tagKicker = leadKicker.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');

        copyData = isArabic
          ? {
              instagram: {
                title: "إنستغرام (منشور وكاروسيل)",
                caption: `✨ "${leadPhrase}"\n\nتأمل عميق في رحلة النجاح وبناء العادات القوية. ما هو رأيك في هذا المبدأ؟ شاركنا تجربتك في التعليقات!\n\n📌 احفظ المنشور لتعود إليه لاحقاً.`,
                hashtags: `#${tagKicker} #تطوير_الذات #نجاح #ريادة_أعمال #تحفيز #انضباط`,
                tips: "شجع المتابعين على حفظ الكاروسيل ومشاركته لزيادة الوصول في خوارزمية إنستغرام.",
              },
              tiktok: {
                title: "تيك توك (كاروسيل صور وفيديو)",
                caption: `👀 اسحب لرؤية باقي الأفكار!\n\n"${leadPhrase}"\n\nهل تتفق مع هذا الرأي أم لا؟ شارك برأيك 👇`,
                hashtags: `#${tagKicker} #fyp #foryou #تطوير_الذات #تحفيز`,
                tips: "استخدم من ٣ إلى ٥ وسوم رئيسية وضع الكلمات المفتاحية في أول سطرين.",
              },
              youtube: {
                title: "يوتيوب (شورتس ومشاركات المنتدى)",
                caption: `${leadKicker} : ${leadPhrase.slice(0, 60)}...\n\nقاعدة ذهبية لتحقيق أهدافك. اشترك بالقناة لمزيد من الفيديوهات الملهمة يومياً!`,
                hashtags: `#Shorts #${tagKicker} #تحفيز`,
                tips: "عنوان جذاب أقل من ٧٠ حرفاً لزيادة نسبة النقر إلى الظهور.",
              },
              facebook: {
                title: "فيسبوك (منشور صفحة ومجموعة)",
                caption: `أهلاً بكم جميعاً 🌟\n\n"${leadPhrase}"\n\nكيف تطبقون هذه القاعدة في مشاريعكم وحياتكم اليومية؟ بانتظار تعليقاتكم القيّمة!`,
                hashtags: `#${tagKicker}`,
                tips: "اطرح سؤالاً مفتوحاً لتحفيز النقاش والتعليقات.",
              },
              linkedin: {
                title: "لينكد إن (منشور قيادي وتجربة)",
                caption: `💡 "${leadPhrase}"\n\nفي عالم سريع الخطى، يمثل هذا المفهوم حجر الزاوية لكل قائد ومحترف يسعى لتحقيق التميز المؤسسي والشخصي.\n\nالدروس المستفادة:\n1. الوضوح يسبق السرعة دائماً.\n2. الجهد المستمر يضمن النتائج المستدامة.\n\nما هي وجهة نظركم في هذا السياق؟`,
                hashtags: `#قيادة #${tagKicker} #ريادة_الأعمال #استراتيجية`,
                tips: "اجعل المنشور منظماً وموجهاً للمجتمع المهني مع دعوة للتفاعل البناء.",
              },
              twitter: {
                title: "إكس / تويتر (تغريدة وسلسلة)",
                caption: `"${leadPhrase}"\n\nللتأمل والتطبيق اليوم.`,
                hashtags: `#${tagKicker}`,
                tips: "نص مركز بأقل من ٢٥٠ حرفاً للحصول على أعلى نسبة مشاركة وإعادة تغريد.",
              },
              pinterest: {
                title: "بينتيريست (لوحة أفكار)",
                caption: `إلهام اليوم: ${leadPhrase}\n\nاحفظ هذه الفكرة في لوحة أهدافك للمحافظة على عزيمتك وتركيزك.`,
                hashtags: `#${tagKicker} #إلهام #أهداف`,
                tips: "استخدم كلمات مفتاحية دقيقة تهم الباحثين عن التخطيط والنجاح.",
              },
              snapchat: {
                title: "سناب شات (ستوري وسبوت لايت)",
                caption: `💡 تذكير اليوم : "${leadPhrase}"`,
                hashtags: `#${tagKicker}`,
                tips: "نص قصير، مباشر وبصري جذاب.",
              },
              discord: {
                title: "ديسكورد (إعلان ونقاش)",
                caption: `📢 **فكرة اليوم في السيرفر**\n\n> "${leadPhrase}"\n\n💬 ما رأيكم في هذه الفكرة لمشاريعنا الحالية؟ شاركونا في شات المناقشات!`,
                hashtags: "",
                tips: "تنسيق Markdown مناسب للمجتمعات وسيرفرات ديسكورد.",
              },
              masterPrompt: `أنت خبير عالمي في صناعة المحتوى الفيروسي والتسويق الرقمي. اكتب حزمة منشورات استراتيجية كاملة للموضوع التالي:\nالموضوع: ${leadKicker}\nالنص: "${leadPhrase}"\nاكتب محتوى مفصل لمنصات إنستغرام وتيك توك ولينكد إن وإكس مع الخطافات والوسوم.`,
            }
          : {
              instagram: {
                title: "Instagram (Carrousel & Post)",
                caption: `✨ "${leadPhrase}"\n\nUne réflexion essentielle pour transformer votre vision en résultats concrets. Qu'en pensez-vous ? Partagez votre retour d'expérience en commentaire !\n\n📌 Sauvegardez ce post pour y revenir quand vous en aurez besoin.`,
                hashtags: `#${tagKicker.toLowerCase()} #motivation #entrepreneuriat #succes #creation #autopost`,
                tips: "Astuce algo: Encouragez la sauvegarde du carrousel pour maximiser la portée.",
              },
              tiktok: {
                title: "TikTok (Carrousel Photo & Vidéo)",
                caption: `👀 Swipe pour la suite de la série !\n\n"${leadPhrase}"\n\nTu valides ce principe ou pas du tout ? Dis-le en commentaire !`,
                hashtags: `#${tagKicker.toLowerCase()} #fyp #pourtoi #devperso #motivation #viral`,
                tips: "Astuce algo: 3-5 hashtags max et mots-clés dans les 2 premières lignes.",
              },
              youtube: {
                title: "YouTube (Shorts & Post Communauté)",
                caption: `${leadKicker} : ${leadPhrase.slice(0, 60)}...\n\nDécouvrez cette règle fondamentale pour débloquer votre potentiel. Abonnez-vous pour un conseil percutant chaque matin !`,
                hashtags: `#Shorts #${tagKicker.toLowerCase()} #Conseil`,
                tips: "Astuce algo: Titre accrocheur sous 70 caractères pour un taux de clic maximal.",
              },
              facebook: {
                title: "Facebook (Post & Page)",
                caption: `Bonjour à tous 🌟\n\n"${leadPhrase}"\n\nComment appliquez-vous ce principe dans vos projets ou au quotidien ? Hâte de lire vos retours !`,
                hashtags: `#${tagKicker.toLowerCase()}`,
                tips: "Astuce algo: Privilégiez les questions ouvertes pour déclencher des conversations.",
              },
              linkedin: {
                title: "LinkedIn (Post d'expertise & Carrousel)",
                caption: `💡 "${leadPhrase}"\n\nDans un environnement où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers d'excellence.\n\nCe que l'expérience m'a appris :\n1. La clarté précède toujours l'efficacité.\n2. La constance bat l'intensité ponctuelle.\n\nQuelle est votre approche sur ce sujet dans vos équipes ?`,
                hashtags: `#Leadership #${tagKicker} #Management #Strategie`,
                tips: "Astuce algo: Format aéré avec retour d'expérience et question finale invitant aux commentaires.",
              },
              twitter: {
                title: "X / Twitter (Tweet & Fil)",
                caption: `"${leadPhrase}"\n\nÀ méditer aujourd'hui.`,
                hashtags: `#${tagKicker.toLowerCase()}`,
                tips: "Astuce algo: Moins de 250 caractères pour un impact maximal.",
              },
              pinterest: {
                title: "Pinterest (Épingle Idée & Standard)",
                caption: `Inspiration du jour : ${leadPhrase}\n\nEnregistrez cette épingle dans votre tableau d'objectifs pour garder le cap.`,
                hashtags: `#${tagKicker.toLowerCase()} #inspiration #motivation`,
                tips: "Astuce algo: Mots-clés intentionnistes pour la recherche.",
              },
              snapchat: {
                title: "Snapchat (Spotlight & Story)",
                caption: `💡 Le rappel du jour : "${leadPhrase}"`,
                hashtags: `#${tagKicker.toLowerCase()}`,
                tips: "Astuce algo: Texte court, percutant et direct.",
              },
              discord: {
                title: "Discord (Annonce & Discussion)",
                caption: `📢 **Pensée du jour sur le serveur**\n\n> "${leadPhrase}"\n\n💬 Qu'est-ce que cela vous inspire pour vos projets actuels ? On en discute dans le salon général !`,
                hashtags: "",
                tips: "Format Markdown adapté aux serveurs et communautés.",
              },
              masterPrompt: `Tu es un expert mondial en stratégie de contenu viral et Copywriting pour les réseaux sociaux. Rédige un pack complet de publications captivantes pour le visuel suivant :\nThématique : ${leadKicker}\nTexte : "${leadPhrase}"\nObjectif : Maximiser les sauvegardes, partages et commentaires qualifiés. Fournis des variantes adaptées pour Instagram, TikTok, LinkedIn, YouTube Shorts et Twitter avec les accroches (hooks), les corps de texte et les hashtags de niche pertinents.`,
            };
      }

      // CRITICAL REQUIREMENT: "le resultat doit etre appliquer instantanement"
      // Map the generated phrases onto slides, keeping existing images / styling or generating new slides
      const updatedSlides: SlideItem[] = phrasesData.map((p, idx) => {
        const existing = slides[idx] || slides[0];
        return {
          id: `slide-ai-${Date.now()}-${idx}`,
          number: idx + 1,
          text: p.text || existing.text,
          kicker: p.kicker || existing.kicker || (isArabic ? 'إضاءة' : 'POINT CLÉ'),
          subtitle: p.subtitle || existing.subtitle || (isArabic ? `حكمة رقم 0${idx + 1} · @studio.horizon` : `Épisode 0${idx + 1} · AutoPost Studio`),
          imageUrl: existing.imageUrl,
          imageAlt: p.imagePrompt || existing.imageAlt,
          imageZoom: existing.imageZoom ?? 1,
          imagePanX: existing.imagePanX ?? 0,
          imagePanY: existing.imagePanY ?? 0,
          imageBrightness: existing.imageBrightness ?? 100,
          customOverlayOpacity: existing.customOverlayOpacity ?? 0.45,
          scheduledTime: existing.scheduledTime,
          customDirection: isArabic || isArabicText(p.text) ? 'rtl' : undefined,
        };
      });

      // Apply INSTANTLY to parent state!
      setSlides(updatedSlides);
      setCurrentSlideIndex(0);
      setSelectedSlidePreviewIdx(0);
      setGeneratedPhrases(updatedSlides);
      setSocialData(copyData);
      setHasGenerated(true);
    } catch (err: any) {
      setErrorMessage(`Erreur lors de la génération: ${err?.message || 'Vérifiez votre connexion'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSocialContent = socialData[activePlatform] || {};
  const isMasterPrompt = activePlatform === 'masterPrompt';

  const fullPackText = isMasterPrompt
    ? socialData.masterPrompt || ''
    : `${activeSocialContent.title || ''}\n\n${activeSocialContent.caption || ''}\n\n${activeSocialContent.hashtags || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Générateur IA de Phrases & Social Pack</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                  Instant Preview
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Créez une série complète de visuels appliquée immédiatement + légendes & tags pour chaque réseau.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Section 1: Inputs & Controls */}
          <div className="bg-neutral-950/60 p-4 sm:p-5 rounded-xl border border-neutral-800/80 space-y-4">
            {/* Description textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Description du sujet ou thématique souhaitée</span>
                </label>
                <span className="text-[11px] text-neutral-500">
                  {topicDescription.length} caractères
                </span>
              </div>
              <textarea
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="Ex: 6 conseils indispensables pour lancer son agence digitale, développer sa discipline ou booster sa créativité..."
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <div className="text-[11px] font-medium text-neutral-400 mb-1.5">
                💡 Suggestions rapides en 1 clic :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presetTopics.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(item)}
                    className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-800 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of parameters: Count, Language, Tone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Phrase Count */}
              <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-300 font-medium">Nombre de visuels</span>
                  <span className="font-mono text-indigo-400 font-bold text-sm">
                    {phraseCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={phraseCount}
                  onChange={(e) => setPhraseCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                  <span>1 min</span>
                  <div className="flex gap-1">
                    {[3, 6, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPhraseCount(cnt)}
                        className={`px-1 rounded ${phraseCount === cnt ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                  <span>20 max</span>
                </div>
              </div>

              {/* Language Selector */}
              <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                <label className="block text-xs text-neutral-300 font-medium mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Langue des visuels</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'fr', label: 'Français' },
                    { id: 'ar', label: 'العربية (RTL)' },
                    { id: 'en', label: 'English' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLanguage(l.id as any)}
                      className={`py-1.5 text-xs rounded transition-colors text-center font-medium ${
                        selectedLanguage === l.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                <label className="block text-xs text-neutral-300 font-medium mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ton du contenu</span>
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Inspirant & Professionnel">Inspirant & Professionnel</option>
                  <option value="Percutant, Viral & Hook">Percutant & Viral (Accroche forte)</option>
                  <option value="Expert, Technique & Chiffré">Expert & Forte valeur ajoutée</option>
                  <option value="Poétique, Zen & Minimaliste">Poétique & Minimaliste</option>
                  <option value="Audacieux & Provocateur">Audacieux & Anticonformiste</option>
                </select>
              </div>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Big Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerateAndApply}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 hover:scale-[1.005] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Génération et application instantanée en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Générer & Appliquer Instantanément ({phraseCount} visuels)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Instant Application Confirmation & Slide Preview */}
          {hasGenerated && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Green Confirmation Pill */}
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/70 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Succès !</strong> {generatedPhrases.length} visuels ont été appliqués instantanément sur le Canvas de votre projet.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 rounded-md text-emerald-200 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Voir le Canvas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Generated Slides Quick Carousel Preview */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Visuels appliqués (#{selectedSlidePreviewIdx + 1} / {generatedPhrases.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {generatedPhrases.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedSlidePreviewIdx(idx);
                          setCurrentSlideIndex(idx);
                        }}
                        className={`w-6 h-6 rounded-md text-xs font-mono font-medium transition-colors ${
                          selectedSlidePreviewIdx === idx
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Slide Card Preview */}
                {generatedPhrases[selectedSlidePreviewIdx] && (
                  <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row gap-3 items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase">
                        {generatedPhrases[selectedSlidePreviewIdx].kicker}
                      </span>
                      <p className="text-sm font-semibold text-white leading-snug">
                        "{generatedPhrases[selectedSlidePreviewIdx].text}"
                      </p>
                      <p className="text-xs text-neutral-400">
                        {generatedPhrases[selectedSlidePreviewIdx].subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 flex sm:flex-col gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyText(generatedPhrases[selectedSlidePreviewIdx].text, `phrase-${selectedSlidePreviewIdx}`)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedKey === `phrase-${selectedSlidePreviewIdx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Copier phrase</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Multi-Platform Social Pack Ready to Copy */}
              <div className="bg-neutral-950/80 p-4 sm:p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-pink-400" />
                      <span>Social Pack multi-plateforme prêt à copier</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Titres, légendes, tags SEO et hashtags calibrés pour chaque réseau social.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(fullPackText, 'full-pack')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    {copiedKey === 'full-pack' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Pack Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier Tout le Pack ({PLATFORMS_META.find(p => p.id === activePlatform)?.name})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Platform Selector Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 custom-scrollbar">
                  {PLATFORMS_META.map((plat) => {
                    const isActive = activePlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setActivePlatform(plat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                          isActive
                            ? 'bg-neutral-800 text-white border-neutral-700 shadow-sm'
                            : 'bg-neutral-900/60 text-neutral-400 hover:text-white border-neutral-800'
                        }`}
                      >
                        <span>{plat.iconText}</span>
                        <span>{plat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Content Card for Active Platform */}
                <div className="bg-neutral-900/90 rounded-xl p-4 border border-neutral-800 space-y-3.5">
                  {/* Platform Meta Info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span>{PLATFORMS_META.find(p => p.id === activePlatform)?.iconText}</span>
                      <span>{activeSocialContent.title || PLATFORMS_META.find(p => p.id === activePlatform)?.name}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${PLATFORMS_META.find(p => p.id === activePlatform)?.badgeColor}`}>
                      {PLATFORMS_META.find(p => p.id === activePlatform)?.badge}
                    </span>
                  </div>

                  {/* Algorithm Tip */}
                  {activeSocialContent.tips && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-indigo-300 flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 text-indigo-400 mt-0.5" />
                      <span>{activeSocialContent.tips}</span>
                    </div>
                  )}

                  {/* Master prompt special display */}
                  {isMasterPrompt ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-xs text-neutral-400">
                        <span>Prompt universel pour générer des variantes infinies :</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(socialData.masterPrompt || '', 'prompt-copy')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {copiedKey === 'prompt-copy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'prompt-copy' ? 'Copié' : 'Copier le Prompt'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-neutral-950 rounded-lg text-xs text-neutral-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-neutral-800 custom-scrollbar">
                        {socialData.masterPrompt || 'Prompt indisponible'}
                      </pre>
                    </div>
                  ) : (
                    <>
                      {/* Caption / Description Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 text-xs text-neutral-400">
                          <span className="font-medium text-neutral-300">Légende / Caption rédigée :</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(activeSocialContent.caption || '', 'caption-copy')}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            {copiedKey === 'caption-copy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'caption-copy' ? 'Copiée' : 'Copier la légende'}</span>
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-950 rounded-lg text-xs text-neutral-200 whitespace-pre-line border border-neutral-800 max-h-44 overflow-y-auto custom-scrollbar">
                          {activeSocialContent.caption || 'Légende générée prête à l\'emploi'}
                        </div>
                      </div>

                      {/* Hashtags & Tags */}
                      {activeSocialContent.hashtags && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-xs text-neutral-400">
                            <span className="font-medium text-neutral-300">Tags & Hashtags de niche :</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(activeSocialContent.hashtags || '', 'tags-copy')}
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedKey === 'tags-copy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === 'tags-copy' ? 'Copiés' : 'Copier les hashtags'}</span>
                            </button>
                          </div>
                          <div className="p-2.5 bg-neutral-950 rounded-lg text-xs font-mono text-pink-300 border border-neutral-800 break-words">
                            {activeSocialContent.hashtags}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400 hidden sm:inline">
            Les phrases générées sont automatiquement enregistrées et synchronisées avec le canvas.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {hasGenerated ? 'Terminer & Fermer' : 'Fermer'}
            </button>
            {hasGenerated && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Éditer sur le Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
