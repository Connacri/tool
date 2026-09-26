import React from 'react';

export interface FontDefinition {
  id: string;
  name: string;
  family: string;
  category: 'french' | 'arabic';
  sampleText: string;
}

export const GOOGLE_FONTS_CATALOG: FontDefinition[] = [
  // French / Latin Fonts
  {
    id: 'editorial',
    name: 'Fraunces (Éditorial Luxe)',
    family: "'Fraunces', serif",
    category: 'french',
    sampleText: 'Élégance & Création',
  },
  {
    id: 'avant-garde',
    name: 'Syne (Avant-Garde Bold)',
    family: "'Syne', sans-serif",
    category: 'french',
    sampleText: 'DESIGN & IMPACT',
  },
  {
    id: 'modern',
    name: 'Plus Jakarta Sans (Moderne)',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'french',
    sampleText: 'Clarté & Performance',
  },
  {
    id: 'playfair',
    name: 'Playfair Display (Prestige)',
    family: "'Playfair Display', serif",
    category: 'french',
    sampleText: 'Haute Couture & Style',
  },
  {
    id: 'outfit',
    name: 'Outfit (Contemporain)',
    family: "'Outfit', sans-serif",
    category: 'french',
    sampleText: 'Audace & Pureté',
  },
  {
    id: 'cinzel',
    name: 'Cinzel (Monolithique)',
    family: "'Cinzel', serif",
    category: 'french',
    sampleText: 'MONUMENTAL & ARCHI',
  },
  {
    id: 'mono',
    name: 'JetBrains Mono (Code Tech)',
    family: "'JetBrains Mono', monospace",
    category: 'french',
    sampleText: '0101_DISCIPLINE.log',
  },

  // Arabic Fonts
  {
    id: 'cairo',
    name: 'Cairo (القاهرة - Moderne)',
    family: "'Cairo', sans-serif",
    category: 'arabic',
    sampleText: 'الإبداع يصنع الفارق 2026',
  },
  {
    id: 'alexandria',
    name: 'Alexandria (الإسكندرية - هندسي)',
    family: "'Alexandria', sans-serif",
    category: 'arabic',
    sampleText: 'رؤية مستقبلية متجددة',
  },
  {
    id: 'almarai',
    name: 'Almarai (المراعي - إخباري نقي)',
    family: "'Almarai', sans-serif",
    category: 'arabic',
    sampleText: 'دقة واحترافية عالية',
  },
  {
    id: 'readex',
    name: 'Readex Pro (ريدكس - ديناميكي)',
    family: "'Readex Pro', sans-serif",
    category: 'arabic',
    sampleText: 'تصميم سريع وجذاب',
  },
  {
    id: 'el-messiri',
    name: 'El Messiri (المسيري - منحني أنيق)',
    family: "'El Messiri', sans-serif",
    category: 'arabic',
    sampleText: 'أصالة ونقاء فني',
  },
  {
    id: 'tajawal',
    name: 'Tajawal (تجوال - متوازن)',
    family: "'Tajawal', sans-serif",
    category: 'arabic',
    sampleText: 'انسيابية مطلقة في القراءة',
  },
  {
    id: 'amiri',
    name: 'Amiri (أميري - نسخ تقليدي)',
    family: "'Amiri', serif",
    category: 'arabic',
    sampleText: 'الخط العربي الأصيل',
  },
  {
    id: 'noto-arabic',
    name: 'Noto Sans Arabic (شامل)',
    family: "'Noto Sans Arabic', sans-serif",
    category: 'arabic',
    sampleText: 'توافق كامل وبساطة',
  },
];

/**
 * Ensures Google fonts are loaded and ready in browser memory before canvas export
 */
export async function ensureFontsReady(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }
}

/**
 * Wraps digits and number sequences inside an LTR isolate element
 * so numerals in Arabic sentences always read Left-to-Right without inverting digits.
 */
export function renderBidiText(text: string, isRtl: boolean): React.ReactNode {
  if (!text) return null;
  if (!isRtl) return text;

  // Split on numbers, percentages, fractions and dates
  const parts = text.split(/(\d+[\d.,/:\-%]*)/g);
  return (
    <>
      {parts.map((part, index) => {
        // If it's a number sequence
        if (/^\d+[\d.,/:\-%]*$/.test(part)) {
          return (
            <span
              key={index}
              dir="ltr"
              className="inline-block font-mono tabular-nums px-0.5"
              style={{ unicodeBidi: 'isolate' }}
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * For Canvas 2D rendering:
 * Inserts Unicode Left-to-Right Marks (\u200E) around digits so canvas engines
 * shape Arabic RTL text while preserving exact LTR numeral sequences.
 */
export function formatCanvasBidiNumerals(text: string, isRtl: boolean): string {
  if (!text || !isRtl) return text;
  return text.replace(/(\d+[\d.,/:\-%]*)/g, '\u200E$1\u200E');
}
