/**
 * Google Fonts dynamic loader and curated catalog for French and Arabic typography
 */

export interface GoogleFontInfo {
  name: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'arabic';
  language: 'latin' | 'arabic' | 'both';
  weights: number[];
  sampleTextFr?: string;
  sampleTextAr?: string;
  description: string;
}

export const CURATED_FRENCH_FONTS: GoogleFontInfo[] = [
  {
    name: 'Plus Jakarta Sans',
    category: 'sans-serif',
    language: 'latin',
    weights: [400, 500, 600, 700, 800],
    sampleTextFr: 'Moderne, clair & percutant',
    description: 'Design contemporain pro, parfait pour les réseaux sociaux',
  },
  {
    name: 'Syne',
    category: 'display',
    language: 'latin',
    weights: [600, 700, 800],
    sampleTextFr: 'Audace & Avant-Garde',
    description: 'Titrage ultra-stylisé et branding à fort caractère',
  },
  {
    name: 'Fraunces',
    category: 'serif',
    language: 'latin',
    weights: [400, 600, 700, 900],
    sampleTextFr: 'Élégance éditoriale & Luxe',
    description: 'Serif raffiné au style magazine haut de gamme',
  },
  {
    name: 'Playfair Display',
    category: 'serif',
    language: 'latin',
    weights: [400, 600, 700, 800],
    sampleTextFr: 'Prestige & Beauté classique',
    description: 'Parfait pour citations inspirantes et art de vivre',
  },
  {
    name: 'Montserrat',
    category: 'sans-serif',
    language: 'latin',
    weights: [400, 600, 700, 800],
    sampleTextFr: 'Géométrique & Moderne',
    description: 'Grand classique urbain à très forte présence',
  },
  {
    name: 'Inter',
    category: 'sans-serif',
    language: 'latin',
    weights: [400, 500, 600, 700, 800],
    sampleTextFr: 'Clarté absolue & Minimalisme',
    description: 'Lisibilité irréprochable sur tous les écrans',
  },
  {
    name: 'Poppins',
    category: 'sans-serif',
    language: 'latin',
    weights: [400, 500, 600, 700, 800],
    sampleTextFr: 'Courbes douces & Rayonnant',
    description: 'Géométrie circulaire chaleureuse et engageante',
  },
  {
    name: 'Outfit',
    category: 'sans-serif',
    language: 'latin',
    weights: [400, 600, 700, 800],
    sampleTextFr: 'Innovant & Tech',
    description: 'Parfait pour startups, IA et contenus tech',
  },
  {
    name: 'Space Grotesk',
    category: 'sans-serif',
    language: 'latin',
    weights: [500, 600, 700],
    sampleTextFr: 'Brutaliste & Tendance',
    description: 'Esthétique web3, design tech et avant-gardiste',
  },
  {
    name: 'Bebas Neue',
    category: 'display',
    language: 'latin',
    weights: [400],
    sampleTextFr: 'IMPACT AFFICHE MAJUSCULE',
    description: 'Condensé et percutant pour titres géants',
  },
  {
    name: 'Oswald',
    category: 'sans-serif',
    language: 'latin',
    weights: [500, 600, 700],
    sampleTextFr: 'Puissant & Dynamique',
    description: 'Idéal pour le sport, la motivation et le business',
  },
  {
    name: 'Cinzel',
    category: 'serif',
    language: 'latin',
    weights: [500, 700, 800],
    sampleTextFr: 'MAJESTÉ ROMAINE & LUXE',
    description: 'Lettres capitales royales et inspirantes',
  },
  {
    name: 'DM Serif Display',
    category: 'serif',
    language: 'latin',
    weights: [400],
    sampleTextFr: 'Presse & Journalisme',
    description: 'Contraste saisissant pour un ton sérieux et digne',
  },
  {
    name: 'Lora',
    category: 'serif',
    language: 'latin',
    weights: [400, 500, 600, 700],
    sampleTextFr: 'Harmonie & Poésie',
    description: 'Calligraphique et équilibré pour citations littéraires',
  },
  {
    name: 'JetBrains Mono',
    category: 'monospace',
    language: 'latin',
    weights: [400, 600, 700],
    sampleTextFr: 'Code & Esthétique Tech',
    description: 'Monospace contemporain pour développeurs et data',
  },
];

export const CURATED_ARABIC_FONTS: GoogleFontInfo[] = [
  {
    name: 'Cairo',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700, 800, 900],
    sampleTextAr: 'القاهرة - خط حديث ومتوازن',
    description: 'Le خط arabe le plus populaire, ultra-lisible et moderne',
  },
  {
    name: 'Amiri',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 700],
    sampleTextAr: 'الأميري - أصالة الخط العربي الكلاسيكي',
    description: 'Style Naskh traditionnel prestigieux pour la sagesse',
  },
  {
    name: 'Tajawal',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 500, 700, 800],
    sampleTextAr: 'تجوال - انسيابي وعصري للشبكات',
    description: 'Conçu spécialement pour les médias numériques et les posts',
  },
  {
    name: 'Alexandria',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700, 800],
    sampleTextAr: 'الإسكندرية - فخامة وهندسة معاصرة',
    description: 'Design géométrique haut de gamme inspiré de la typographie latine',
  },
  {
    name: 'Almarai',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 700, 800],
    sampleTextAr: 'المراعي - تصميم نقي واحترافي',
    description: 'Sobre, élégant et d\'une grande clarté pour marques et entreprises',
  },
  {
    name: 'Readex Pro',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 500, 600, 700],
    sampleTextAr: 'ريدكس برو - حداثة ووضوح فائق',
    description: 'Optimisé pour les écrans mobiles et la lecture rapide',
  },
  {
    name: 'El Messiri',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700],
    sampleTextAr: 'المسيري - لمسة فنية جذابة',
    description: 'Courbes créatives et expressives pour citations et poèmes',
  },
  {
    name: 'Noto Sans Arabic',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700, 800],
    sampleTextAr: 'نوتو سانس - وضوح عالمي قياسي',
    description: 'Harmonisation parfaite avec toutes les langues du monde',
  },
  {
    name: 'Noto Kufi Arabic',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700, 800],
    sampleTextAr: 'نوتو كوفي - هندسة كوفية عريقة',
    description: 'Style coufique géométrique remarquable pour les titres',
  },
  {
    name: 'Changa',
    category: 'arabic',
    language: 'arabic',
    weights: [600, 700, 800],
    sampleTextAr: 'تشانغا - عنوان عريض قوي',
    description: 'Lettres massives et dynamiques pour les titres percutants',
  },
  {
    name: 'Lalezar',
    category: 'arabic',
    language: 'arabic',
    weights: [400],
    sampleTextAr: 'لاله زار - أسلوب ملصقات سينمائية',
    description: 'Style rétro et affiche pour un impact immédiat',
  },
  {
    name: 'Marhey',
    category: 'arabic',
    language: 'arabic',
    weights: [600, 700],
    sampleTextAr: 'مرحي - مرح وعفوي وشخصي',
    description: 'Touche manuscrite chaleureuse pour posts lifestyle',
  },
  {
    name: 'Aref Ruqaa',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 700],
    sampleTextAr: 'عارف رقعة - خط الرقعة التعبيري',
    description: 'Calligraphie Ruq\'ah authentique avec énergie vive',
  },
  {
    name: 'Scheherazade New',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 700],
    sampleTextAr: 'شهرزاد - رونق الأدب والرواية',
    description: 'Style Naskh arabe traditionnel pour textes poétiques et sagesse',
  },
  {
    name: 'IBM Plex Sans Arabic',
    category: 'arabic',
    language: 'arabic',
    weights: [400, 600, 700],
    sampleTextAr: 'آي بي إم بلكس - دقة وتكنولوجيا',
    description: 'Parfaite synergie entre précision technique et beauté arabe',
  },
  {
    name: 'Reem Kufi',
    category: 'arabic',
    language: 'arabic',
    weights: [500, 700],
    sampleTextAr: 'ريم كوفي - خط كوفي ناعم',
    description: 'Coufique moderne épuré avec lignes douces et fluides',
  },
];

// In-memory cache of loaded fonts
const loadedFontsSet = new Set<string>();

/**
 * Dynamically loads a font from Google Fonts into the DOM and waits until it's ready.
 * Supports any valid Google Font name.
 */
export async function loadGoogleFont(fontName: string): Promise<boolean> {
  if (!fontName || typeof fontName !== 'string') return false;

  const cleanName = fontName.trim();
  if (loadedFontsSet.has(cleanName)) {
    return true;
  }

  try {
    const encodedName = cleanName.replace(/\s+/g, '+');
    const linkId = `google-font-dynamic-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Check if link tag already exists
    let linkElement = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = linkId;
      linkElement.rel = 'stylesheet';
      // Load standard and bold weights (400, 600, 700, 800)
      linkElement.href = `https://fonts.googleapis.com/css2?family=${encodedName}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(linkElement);
    }

    // Wait for the font to be loaded in document.fonts
    if ('fonts' in document) {
      try {
        await Promise.race([
          document.fonts.load(`700 16px "${cleanName}"`),
          new Promise((resolve) => setTimeout(resolve, 1500)), // 1.5s safety timeout
        ]);
        await document.fonts.ready;
      } catch {
        // Continue even if font loading promise fails
      }
    }

    loadedFontsSet.add(cleanName);
    return true;
  } catch (err) {
    console.warn(`Failed to dynamically load Google Font "${fontName}":`, err);
    return false;
  }
}

/**
 * Checks if a string contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Formats digits in text if Eastern Arabic numerals are requested,
 * while ensuring Western digits stay ordered LTR.
 */
export function formatArabicDigits(text: string, easternNumerals: boolean = false): string {
  if (!text) return '';
  if (!easternNumerals) return text;
  
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (w) => easternDigits[parseInt(w, 10)]);
}
