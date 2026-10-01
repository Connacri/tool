import { SlideItem } from '../types';
import { isArabicText } from './canvasRenderer';

export interface SlideSocialCopy {
  slideNumber: number;
  title: string;
  text: string;
  subtitle?: string;
  tags: string[];
  hashtags: string;
  instagram: {
    title: string;
    caption: string;
    hashtags: string;
  };
  tiktok: {
    title: string;
    caption: string;
    hashtags: string;
  };
  linkedin: {
    title: string;
    caption: string;
    hashtags: string;
  };
  twitter: {
    title: string;
    caption: string;
    hashtags: string;
  };
  youtubeShorts: {
    title: string;
    description: string;
    tags: string;
  };
  facebook: {
    title: string;
    caption: string;
    hashtags: string;
  };
  pinterest: {
    title: string;
    description: string;
    hashtags: string;
  };
}

export interface DeckSocialPack {
  generatedAt: string;
  totalSlides: number;
  primaryLanguage: 'ar' | 'fr';
  seriesTitle: string;
  seriesTags: string[];
  seriesHashtags: string;
  carouselCaptions: {
    instagram: string;
    tiktok: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    youtubeShorts: string;
  };
  slides: SlideSocialCopy[];
  rawTextDocument: string;
}

/**
 * Extracts relevant keywords and tags from text and kicker
 */
function extractKeywords(text: string, kicker?: string): string[] {
  const combined = `${kicker || ''} ${text || ''}`;
  const isArabic = isArabicText(combined);

  if (isArabic) {
    const rawWords = combined
      .replace(/[^\u0621-\u064A0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const unique = Array.from(new Set(rawWords)).slice(0, 8);
    return unique.length > 0 ? unique : ['حكمة', 'إلهام', 'تطوير_الذات'];
  }

  // French / Latin keywords
  const stopWords = new Set([
    'pour', 'avec', 'dans', 'votre', 'notre', 'vous', 'nous', 'cette', 'sont',
    'mais', 'plus', 'tout', 'tous', 'faire', 'fait', 'bien', 'comme', 'sans',
    'leur', 'leurs', 'donc', 'aussi', 'tres', 'vers', 'chez', 'elle', 'elles'
  ]);

  const rawWords = combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const unique = Array.from(new Set(rawWords)).slice(0, 8);
  return unique.length > 0 ? unique : ['inspiration', 'motivation', 'succes'];
}

/**
 * Generates hashtags from kicker and tags
 */
function generateHashtags(kicker: string | undefined, tags: string[], isArabic: boolean): string {
  const cleanKicker = (kicker || (isArabic ? 'حكمة' : 'Conseil'))
    .trim()
    .replace(/[^\w\u0621-\u064A]/g, isArabic ? '_' : '');

  const baseTags = tags.map((t) => `#${t.replace(/\s+/g, isArabic ? '_' : '')}`);
  const kickerTag = cleanKicker ? `#${cleanKicker}` : '';

  const fallbackTags = isArabic
    ? ['#تطوير_الذات', '#نجاح', '#إلهام', '#ريادة_الأعمال', '#حكمة_اليوم']
    : ['#motivation', '#mindset', '#entrepreneuriat', '#succes', '#citation'];

  const all = Array.from(new Set([kickerTag, ...baseTags, ...fallbackTags])).filter(Boolean);
  return all.slice(0, 7).join(' ');
}

/**
 * Regenerates descriptions, titles, tags, and hashtags according to the provided slide texts
 */
export function generateSocialPackForSlides(
  slides: SlideItem[],
  brandText?: string,
  brandHandle?: string
): DeckSocialPack {
  const now = new Date();
  const generatedAt = now.toISOString();
  const formattedDate = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const firstSlide = slides[0] || { number: 1, text: '', kicker: '' };
  const allTextsCombined = slides.map((s) => `${s.kicker || ''} ${s.text} ${s.subtitle || ''}`).join(' ');
  const isArabic = isArabicText(allTextsCombined);
  const primaryLanguage = isArabic ? 'ar' : 'fr';

  const brandName = brandText?.trim() || 'AutoPost Studio';
  const handle = brandHandle?.trim() || '@autopost.studio';

  const seriesTitle = firstSlide.kicker?.trim() || (isArabic ? 'سلسلة الحكمة والتطوير' : 'Série Clarté & Impact');
  const deckKeywords = extractKeywords(allTextsCombined, seriesTitle);
  const seriesHashtags = generateHashtags(seriesTitle, deckKeywords, isArabic);

  // Generate per-slide copy
  const slideCopies: SlideSocialCopy[] = slides.map((slide, idx) => {
    const slideNumber = slide.number || idx + 1;
    const kicker = slide.kicker?.trim() || (isArabic ? `فكرة رقم 0${slideNumber}` : `Conseil 0${slideNumber}`);
    const text = slide.text?.trim() || '';
    const subtitle = slide.subtitle?.trim() || '';
    const slideIsArabic = isArabicText(`${kicker} ${text}`);
    const tags = extractKeywords(text, kicker);
    const hashtags = generateHashtags(kicker, tags, slideIsArabic);
    const cleanKicker = kicker.replace(/\s+/g, slideIsArabic ? '_' : '');

    if (slideIsArabic) {
      return {
        slideNumber,
        title: kicker,
        text,
        subtitle,
        tags,
        hashtags,
        instagram: {
          title: `إنستغرام - ${kicker}`,
          caption: `✨ "${text}"\n\n${subtitle ? `▫️ ${subtitle}\n\n` : ''}فكرة ملهمة تستحق التأمل في مسارك اليومي. ما رأيك في هذه الرؤية؟ شاركنا رأيك وتجربتك في التعليقات!\n\n📌 احفظ هذا المنشور للعودة إليه لاحقاً.`,
          hashtags,
        },
        tiktok: {
          title: `تيك توك - ${kicker}`,
          caption: `👀 اسحب للشريحة التالية لمتابعة السلسلة!\n\n"${text}"\n\nما رأيك في هذه الفكرة؟ ${hashtags}`,
          hashtags,
        },
        linkedin: {
          title: `لينكد إن - ${kicker}`,
          caption: `💡 ${kicker}\n\n"${text}"\n\nفي عالم الأعمال والتطوير السريع، يمنحنا التوقف والتأمل في هذا المبدأ أفقاً جديداً لاتخاذ قرارات أفضل وبناء قيمة مستدامة.\n\n${subtitle ? `المرجع: ${subtitle}\n\n` : ''}كيف ترون تطبيق هذا المفهوم في فرقكم ومشاريعكم؟`,
          hashtags: `#${cleanKicker} #قيادة #ريادة_الأعمال`,
        },
        twitter: {
          title: `إكس (تويتر) - ${kicker}`,
          caption: `"${text}"\n\n— ${kicker}\n\n${hashtags.split(' ').slice(0, 3).join(' ')}`,
          hashtags: hashtags.split(' ').slice(0, 3).join(' '),
        },
        youtubeShorts: {
          title: `${kicker}: ${text.slice(0, 55)}...`,
          description: `قاعدة ذهبية: "${text}"\n\nاشترك في القناة للمزيد من المحتوى اليومي الملهم! ${handle}\n\n#Shorts #${cleanKicker}`,
          tags: `${tags.join(', ')}, shorts, تطوير_الذات`,
        },
        facebook: {
          title: `فيسبوك - ${kicker}`,
          caption: `صباح الخير للجميع 🌟\n\n"${text}"\n\nكيف تطبقون هذه الرؤية في حياتكم أو عملكم اليوم؟ شاركونا آراءكم في التعليقات.\n\n${hashtags}`,
          hashtags,
        },
        pinterest: {
          title: `${kicker} | ${brandName}`,
          description: `اقتباس ملهم وتصميم راقٍ: "${text}". احفظ هذه الفكرة في لوحة الإلهام الخاصة بك للمزيد من الطاقة الإيجابية.`,
          hashtags,
        },
      };
    }

    // French copy
    return {
      slideNumber,
      title: kicker,
      text,
      subtitle,
      tags,
      hashtags,
      instagram: {
        title: `Instagram - ${kicker}`,
        caption: `✨ ${kicker.toUpperCase()} : "${text}"\n\n${subtitle ? `▫️ ${subtitle}\n\n` : ''}Une réflexion essentielle pour transformer votre vision en résultats concrets. Qu'en pensez-vous ? Partagez votre expérience en commentaire !\n\n📌 Sauvegardez ce post pour y revenir quand vous en aurez besoin.`,
        hashtags,
      },
      tiktok: {
        title: `TikTok - ${kicker}`,
        caption: `👀 Swipe pour découvrir la suite de la série !\n\n"${text}"\n\nTu valides ce principe ou pas du tout ? Dis-le en commentaire ! ${hashtags}`,
        hashtags,
      },
      linkedin: {
        title: `LinkedIn - ${kicker}`,
        caption: `💡 ${kicker}\n\n"${text}"\n\nDans un environnement où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers d'excellence.\n\nCe que l'expérience démontre :\n1. La clarté précède toujours l'efficacité.\n2. La constance bat l'intensité ponctuelle.\n\nQuelle est votre approche sur ce sujet dans vos équipes ?`,
        hashtags: `#Leadership #${cleanKicker} #Strategie #Management`,
      },
      twitter: {
        title: `X / Twitter - ${kicker}`,
        caption: `"${text}"\n\n— ${kicker}\n\n${hashtags.split(' ').slice(0, 3).join(' ')}`,
        hashtags: hashtags.split(' ').slice(0, 3).join(' '),
      },
      youtubeShorts: {
        title: `${kicker} : ${text.slice(0, 55)}...`,
        description: `Règle d'or : "${text}"\n\nDécouvrez d'autres réflexions stratégiques chaque semaine sur notre chaîne. ${handle}\n\n#Shorts #${cleanKicker}`,
        tags: `${tags.join(', ')}, shorts, motivation`,
      },
      facebook: {
        title: `Facebook - ${kicker}`,
        caption: `Bonjour à tous 🌟\n\n"${text}"\n\nComment appliquez-vous ce principe dans vos projets ou au quotidien ? Hâte de lire vos retours en commentaire !\n\n${hashtags}`,
        hashtags,
      },
      pinterest: {
        title: `${kicker} | ${brandName}`,
        description: `Citation inspirante & visuel soigné : "${text}". Enregistrez cette épingle dans votre tableau d'objectifs pour garder le cap.`,
        hashtags,
      },
    };
  });

  // Carousel overall captions
  const slideListFormatted = slides
    .map((s, i) => `${i + 1}. [${s.kicker || `Diapo ${i + 1}`}] "${s.text}"`)
    .join('\n');

  const carouselCaptions = isArabic
    ? {
        instagram: `📚 سلسلتنا الكاملة: ${seriesTitle}\n\nاسحب لليمين لمشاهدة جميع الشرائح (${slides.length} نصائح قيّمة):\n\n${slideListFormatted}\n\n📌 احفظ هذا المنشور في المفضلة للرجوع إليه عند الحاجة.\n\n${seriesHashtags}`,
        tiktok: `🔥 سلسلة متكاملة من ${slides.length} أفكار لتغيير رؤيتك: ${seriesTitle}. اسحب الشاشة للمتابعة! ${seriesHashtags}`,
        linkedin: `📊 carrousel : ${seriesTitle}\n\nVoici le résumé en ${slides.length} étapes clés pour passer à un niveau supérieur :\n\n${slideListFormatted}\n\nQuel point résonne le plus avec votre situation actuelle ?\n\n${seriesHashtags}`,
        twitter: `🧵 Fil complet : ${seriesTitle} en ${slides.length} rappels essentiels :\n\n1/ ${firstSlide.text.slice(0, 180)}...\n\nDécouvrez la suite dans le visuel joint ! ${seriesHashtags.split(' ').slice(0, 2).join(' ')}`,
        facebook: `Bonjour à tous ! Voici notre nouvelle série de visuels : "${seriesTitle}" (${slides.length} diapositives à découvrir).\n\nLequel de ces principes appliquez-vous déjà ?\n\n${seriesHashtags}`,
        youtubeShorts: `Série ${seriesTitle} : ${firstSlide.text.slice(0, 60)}... #Shorts ${seriesHashtags.split(' ').slice(0, 3).join(' ')}`,
      }
    : {
        instagram: `📚 Carrousel complet : ${seriesTitle}\n\nSwipez vers la gauche pour découvrir les ${slides.length} étapes clés :\n\n${slideListFormatted}\n\n📌 Sauvegardez ce post pour ne rien oublier et partagez-le à quelqu'un qui en a besoin !\n\n${seriesHashtags}`,
        tiktok: `🔥 ${slides.length} clés indispensables pour votre réussite : ${seriesTitle}. Swipe pour tout voir ! ${seriesHashtags}`,
        linkedin: `📊 Document Carrousel : ${seriesTitle}\n\nVoici la synthèse complète en ${slides.length} points stratégiques :\n\n${slideListFormatted}\n\nQuel principe vous paraît le plus déterminant dans votre activité actuelle ? Discutons-en en commentaire !\n\n${seriesHashtags}`,
        twitter: `🧵 Fil : ${seriesTitle} en ${slides.length} réflexions directes :\n\n1/ ${firstSlide.text.slice(0, 180)}...\n\n(Consultez les visuels du fil pour voir les ${slides.length} diapos). ${seriesHashtags.split(' ').slice(0, 2).join(' ')}`,
        facebook: `Bonjour à tous ! Voici notre nouvelle série complète : "${seriesTitle}" (${slides.length} visuels à faire défiler).\n\nPrenez le temps de lire et dites-nous quelle diapo vous inspire le plus !\n\n${seriesHashtags}`,
        youtubeShorts: `${seriesTitle} : ${firstSlide.text.slice(0, 60)}... #Shorts ${seriesHashtags.split(' ').slice(0, 3).join(' ')}`,
      };

  // Compile raw text document for the ZIP file
  const separator = '═'.repeat(65);
  const subSeparator = '─'.repeat(50);

  const rawTextDocument = `
${separator}
  AUTOPOST STUDIO — PACK COMPLET DE PUBLICATIONS RÉSEAUX SOCIAUX
${separator}
Généré le : ${formattedDate}
Marque : ${brandName} (${handle})
Thématique principale : ${seriesTitle}
Nombre total de visuels : ${slides.length}
Langue principale : ${isArabic ? 'Arabe (العربية)' : 'Français / Latin'}
Hashtags recommandés : ${seriesHashtags}

${separator}
1. PUBLICATION CARROUSEL COMPLÈTE (INSTAGRAM & LINKEDIN)
${separator}

[INSTAGRAM — LÉGENDE DU CARROUSEL]
${carouselCaptions.instagram}

${subSeparator}

[LINKEDIN — POST AVEC DOCUMENT CARROUSEL PDF]
${carouselCaptions.linkedin}

${subSeparator}

[TIKTOK — CARROUSEL PHOTO / VIDÉO]
${carouselCaptions.tiktok}

${subSeparator}

[X / TWITTER — THREAD OU TWEET DE PRÉSENTATION]
${carouselCaptions.twitter}

${separator}
2. DÉTAILS, TITRES, LÉGENDES ET HASHTAGS PAR DIAPOSITIVE
${separator}
${slideCopies
  .map(
    (sc) => `
─── DIAPOSITIVE #${sc.slideNumber} : ${sc.title.toUpperCase()} ───
Texte du visuel : "${sc.text}"
${sc.subtitle ? `Sous-titre / Signature : ${sc.subtitle}\n` : ''}Mots-clés & Tags : ${sc.tags.join(', ')}
Hashtags ciblés : ${sc.hashtags}

▶ Légende Instagram :
${sc.instagram.caption}

▶ Légende LinkedIn :
${sc.linkedin.caption}

▶ Légende TikTok :
${sc.tiktok.caption}

▶ Titre & Description YouTube Shorts :
Titre : ${sc.youtubeShorts.title}
Description : ${sc.youtubeShorts.description}

▶ Post X (Twitter) :
${sc.twitter.caption}

▶ Épingle Pinterest :
Titre : ${sc.pinterest.title}
Description : ${sc.pinterest.description}
`
  )
  .join('\n')}`.trim();

  return {
    generatedAt,
    totalSlides: slides.length,
    primaryLanguage,
    seriesTitle,
    seriesTags: deckKeywords,
    seriesHashtags,
    carouselCaptions,
    slides: slideCopies,
    rawTextDocument,
  };
}
