import { SlideItem } from '../types';

export interface ParsedSlideInput {
  kicker?: string;
  text: string;
  subtitle?: string;
}

export interface ParseBatchResult {
  hasPrefixSyntax: boolean;
  slides: ParsedSlideInput[];
}

/**
 * Formats a list of slides into the standard prefix batch syntax:
 * :Titre Kicker :
 * .Phrase principale
 * /Signature ou Date
 */
export function formatSlidesToBatchText(
  slides: Array<{ text: string; kicker?: string; subtitle?: string }>
): string {
  if (!slides || slides.length === 0) return '';

  return slides
    .map((s) => {
      const parts: string[] = [];
      if (s.kicker && s.kicker.trim().length > 0) {
        parts.push(`:${s.kicker.trim()} :`);
      }
      if (s.text && s.text.trim().length > 0) {
        parts.push(`.${s.text.trim()}`);
      }
      if (s.subtitle && s.subtitle.trim().length > 0) {
        parts.push(`/${s.subtitle.trim()}`);
      }
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Formats an array of slides into a clean, rich Telegram story caption
 */
export function formatStoryForTelegram(
  slides: SlideItem[],
  brandText?: string,
  brandHandle?: string
): { plainText: string; htmlText: string } {
  if (!slides || slides.length === 0) {
    return { plainText: '', htmlText: '' };
  }

  const primaryKicker = slides.find((s) => s.kicker && s.kicker.trim().length > 0)?.kicker || 'HISTOIRE & CARROUSEL';
  const brandSignature = brandHandle || brandText || '@AutoPostStudio';

  // Plain text version
  let plain = `📖 ${primaryKicker.toUpperCase()}\n`;
  plain += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  slides.forEach((s, idx) => {
    plain += `[Diapo ${idx + 1}/${slides.length}]\n`;
    if (s.kicker && s.kicker.trim().length > 0) {
      plain += `📌 :${s.kicker.trim()} :\n`;
    }
    plain += `💬 .${s.text.trim()}\n`;
    if (s.subtitle && s.subtitle.trim().length > 0) {
      plain += `✍️ /${s.subtitle.trim()}\n`;
    }
    plain += `\n`;
  });

  plain += `━━━━━━━━━━━━━━━━━━━━━\n`;
  plain += `✨ Créé avec AutoPost Studio · ${brandSignature}\n`;
  plain += `#carrousel #story #mindset #growth #creation`;

  // HTML formatted version for Telegram Bot API (parse_mode: 'HTML')
  let html = `<b>📖 ${escapeTelegramHtml(primaryKicker.toUpperCase())}</b>\n`;
  html += `<i>Carrousel de ${slides.length} diapositives</i>\n\n`;

  slides.forEach((s, idx) => {
    html += `<b>${idx + 1}.</b> `;
    if (s.kicker && s.kicker.trim().length > 0) {
      html += `<b>${escapeTelegramHtml(s.kicker.trim())}</b>\n`;
    }
    html += `« ${escapeTelegramHtml(s.text.trim())} »\n`;
    if (s.subtitle && s.subtitle.trim().length > 0) {
      html += `<i>— ${escapeTelegramHtml(s.subtitle.trim())}</i>\n`;
    }
    html += `\n`;
  });

  html += `━━━━━━━━━━━━━━━━━━━━━\n`;
  html += `🚀 <b>${escapeTelegramHtml(brandSignature)}</b> · <i>AutoPost Studio</i>\n`;
  html += `<code>#carrousel #story #mindset #growth</code>`;

  return { plainText: plain, htmlText: html };
}

function escapeTelegramHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parses batch input text supporting both:
 * 1. Prefix format:
 *    :Titre ou Kicker:
 *    .Phrase principale
 *    /Sous-titre, signature ou /date d'aujourd'hui
 * 2. Standard format (1 phrase per line)
 */
export function parseBatchInputText(rawText: string): ParseBatchResult {
  if (!rawText || rawText.trim().length === 0) {
    return { hasPrefixSyntax: false, slides: [] };
  }

  const allLines = rawText.split('\n');

  // Check if any non-empty line starts with our special prefixes
  const hasPrefixSyntax = allLines.some((l) => {
    const trimmed = l.trim();
    return (
      trimmed.startsWith(':') ||
      trimmed.startsWith('.') ||
      trimmed.startsWith('/')
    );
  });

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const resolveSubtitle = (rawSub: string): string => {
    let sub = rawSub.replace(/^\/+/, '').trim();
    sub = sub.replace(/\/+$/, '').trim();
    const isDateKeyword = /^(date(\s+d['’]?aujourd['’]?hui|\s+du\s+jour|\s+actuelle)?|today|aujourd['’]?hui)$/i.test(
      sub
    );
    return isDateKeyword ? todayFormatted : sub;
  };

  const resolveKicker = (rawKicker: string): string => {
    let cleaned = rawKicker.replace(/^:+/, '').trim();
    cleaned = cleaned.replace(/:+$/, '').trim();
    return cleaned;
  };

  const resolveText = (rawTextLine: string): string => {
    return rawTextLine.replace(/^\.+/, '').trim();
  };

  // If no prefix syntax is detected, fall back to simple line-by-line mode
  if (!hasPrefixSyntax) {
    const nonBlankLines = allLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return {
      hasPrefixSyntax: false,
      slides: nonBlankLines.map((line) => ({
        text: line,
      })),
    };
  }

  // Prefix mode: process stream of lines
  const slides: ParsedSlideInput[] = [];
  let currentKicker: string | undefined = undefined;
  let currentText: string | undefined = undefined;
  let currentSubtitle: string | undefined = undefined;

  const pushCurrentSlide = () => {
    if (currentText && currentText.trim().length > 0) {
      slides.push({
        kicker: currentKicker !== undefined ? currentKicker.trim() : undefined,
        text: currentText.trim(),
        subtitle: currentSubtitle !== undefined ? currentSubtitle.trim() : undefined,
      });
    }
    currentKicker = undefined;
    currentText = undefined;
    currentSubtitle = undefined;
  };

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();

    // Empty lines act as slide boundaries when text is already accumulated
    if (line.length === 0) {
      if (currentText && currentText.length > 0) {
        pushCurrentSlide();
      }
      continue;
    }

    if (line.startsWith(':')) {
      // Colon prefix denotes Title / Kicker
      if (currentText || currentKicker !== undefined) {
        pushCurrentSlide();
      }
      currentKicker = resolveKicker(line);
    } else if (line.startsWith('.')) {
      // Dot prefix denotes the main phrase
      if (currentText && currentText.length > 0) {
        pushCurrentSlide();
      }
      currentText = resolveText(line);
    } else if (line.startsWith('/')) {
      // Slash prefix denotes the subtitle / signature / date
      currentSubtitle = resolveSubtitle(line);
    } else {
      // Unprefixed line: append to current phrase or start one
      if (currentText) {
        currentText += ' ' + line;
      } else {
        currentText = line;
      }
    }
  }

  // Push final slide in buffer
  pushCurrentSlide();

  return {
    hasPrefixSyntax: true,
    slides,
  };
}
