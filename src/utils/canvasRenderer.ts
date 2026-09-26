import { AspectRatioOption, LogoConfig, SlideItem, TypographyConfig } from '../types';

/**
 * Loads an image from a URL or Data URL and returns an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Impossible de charger l'image: ${src}`));
    img.src = src;
  });
}

/**
 * Wraps text into lines based on canvas context and maxWidth
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Renders a complete social media slide onto a high-resolution canvas
 */
export async function renderSlideToCanvas(
  slide: SlideItem,
  aspectRatio: AspectRatioOption,
  typography: TypographyConfig,
  logo: LogoConfig,
  totalSlides: number = 6
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = aspectRatio.width;
  canvas.height = aspectRatio.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d initialiser le contexte canvas 2D');

  const width = canvas.width;
  const height = canvas.height;

  // 1. Draw Background Image or Fallback Gradient
  try {
    const bgImage = await loadImage(slide.imageUrl);
    // Draw image object-fit: cover
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;

    let sWidth = bgImage.naturalWidth;
    let sHeight = bgImage.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imgRatio > canvasRatio) {
      sWidth = bgImage.naturalHeight * canvasRatio;
      sx = (bgImage.naturalWidth - sWidth) / 2;
    } else {
      sHeight = bgImage.naturalWidth / canvasRatio;
      sy = (bgImage.naturalHeight - sHeight) / 2;
    }

    // Apply brightness filter if specified
    const brightness = slide.imageBrightness ?? 100;
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
    ctx.filter = 'none';
  } catch {
    // Elegant fallback gradient if image load fails
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Base Dark Tint Overlay
  const baseDarkOpacity = slide.customOverlayOpacity ?? 0.4;
  if (baseDarkOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${baseDarkOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Scrim or Box Style Background
  const paddingX = Math.round(width * 0.08);
  const paddingY = Math.round(height * 0.08);
  const contentWidth = width - paddingX * 2;

  // Dynamic font configuration
  const fontFamily = getFontFamilyString(typography.fontStyle);
  const baseSize = Math.round(width * 0.048 * typography.fontSize);
  const kickerSize = Math.round(baseSize * 0.38);
  const subtitleSize = Math.round(baseSize * 0.42);
  const lineHeight = Math.round(baseSize * 1.35);

  ctx.font = `600 ${baseSize}px ${fontFamily}`;
  const lines = wrapText(ctx, slide.text, contentWidth);
  const totalTextHeight =
    lines.length * lineHeight +
    (typography.showKicker ? kickerSize * 2 : 0) +
    (typography.showSubtitle ? subtitleSize * 2 : 0);

  // Determine Y position
  let startY = 0;
  if (typography.position === 'top') {
    startY = paddingY + (logo.enabled && logo.position.includes('top') ? 110 : 30);
  } else if (typography.position === 'center') {
    startY = Math.round((height - totalTextHeight) / 2);
  } else {
    // bottom
    startY = height - paddingY - totalTextHeight - 20;
  }

  // Draw boxStyle container if applicable
  if (typography.boxStyle === 'scrim') {
    const scrimGrad = ctx.createLinearGradient(0, startY - 120, 0, height);
    scrimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    scrimGrad.addColorStop(0.4, `rgba(0, 0, 0, ${typography.scrimOpacity * 0.6})`);
    scrimGrad.addColorStop(1, `rgba(0, 0, 0, ${typography.scrimOpacity})`);
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(0, startY - 120, width, height - (startY - 120));
  } else if (typography.boxStyle === 'frosted') {
    const boxPad = 48;
    const boxX = paddingX - boxPad / 2;
    const boxY = startY - boxPad;
    const boxW = contentWidth + boxPad;
    const boxH = totalTextHeight + boxPad * 2;
    const radius = 24;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (typography.boxStyle === 'solid-card') {
    const boxPad = 48;
    const boxX = paddingX - boxPad / 2;
    const boxY = startY - boxPad;
    const boxW = contentWidth + boxPad;
    const boxH = totalTextHeight + boxPad * 2;
    const radius = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
    ctx.strokeStyle = typography.accentColor || '#6366f1';
    ctx.lineWidth = 3;
    roundRect(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Align settings
  let textX = paddingX;
  if (typography.align === 'center') {
    textX = width / 2;
  } else if (typography.align === 'right') {
    textX = width - paddingX;
  }
  ctx.textAlign = typography.align;
  ctx.textBaseline = 'top';

  let currentY = startY;

  // 4. Draw Kicker
  if (typography.showKicker && slide.kicker) {
    ctx.save();
    ctx.font = `700 ${kickerSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = typography.accentColor || '#818cf8';
    ctx.letterSpacing = '2px';
    ctx.fillText(slide.kicker.toUpperCase(), textX, currentY);
    ctx.restore();
    currentY += kickerSize + 20;
  }

  // 5. Draw Main Phrase Lines
  ctx.save();
  ctx.font = `700 ${baseSize}px ${fontFamily}`;
  ctx.fillStyle = typography.textColor || '#ffffff';

  if (typography.boxStyle === 'minimal-shadow') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }

  for (const line of lines) {
    if (typography.boxStyle === 'highlighter') {
      const lineMetrics = ctx.measureText(line);
      const hlX =
        typography.align === 'center'
          ? textX - lineMetrics.width / 2 - 12
          : typography.align === 'right'
          ? textX - lineMetrics.width - 12
          : textX - 12;
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
      roundRect(ctx, hlX, currentY - 4, lineMetrics.width + 24, lineHeight, 8);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillText(line, textX, currentY);
    currentY += lineHeight;
  }
  ctx.restore();

  // 6. Draw Subtitle / Citation
  if (typography.showSubtitle && slide.subtitle) {
    currentY += 16;
    ctx.save();
    ctx.font = `400 ${subtitleSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(slide.subtitle, textX, currentY);
    ctx.restore();
  }

  // 7. Slide Index Indicator
  if (typography.showSlideNumber) {
    const numText = `${String(slide.number).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    ctx.save();
    ctx.font = `600 ${Math.round(width * 0.024)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(numText, width - paddingX, height - Math.round(paddingY * 0.7));
    ctx.restore();
  }

  // 8. Draw Logo if Enabled
  if (logo.enabled) {
    await renderLogoOnCanvas(ctx, logo, width, height, paddingX, paddingY);
  }

  return canvas;
}

/**
 * Renders the chosen logo (custom image or predefined branded emblem) on the canvas
 */
async function renderLogoOnCanvas(
  ctx: CanvasRenderingContext2D,
  logo: LogoConfig,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  ctx.save();
  ctx.globalAlpha = logo.opacity;

  // Determine logo position coordinates
  const marginX = paddingX;
  const marginY = Math.round(paddingY * 0.75);

  let lx = marginX;
  let ly = marginY;
  let textAlign: CanvasTextAlign = 'left';

  if (logo.position === 'top-left') {
    lx = marginX;
    ly = marginY;
    textAlign = 'left';
  } else if (logo.position === 'top-right') {
    lx = width - marginX;
    ly = marginY;
    textAlign = 'right';
  } else if (logo.position === 'bottom-left') {
    lx = marginX;
    ly = height - marginY - 40;
    textAlign = 'left';
  } else if (logo.position === 'bottom-right') {
    lx = width - marginX;
    ly = height - marginY - 40;
    textAlign = 'right';
  } else if (logo.position === 'top-center') {
    lx = width / 2;
    ly = marginY;
    textAlign = 'center';
  }

  if (logo.type === 'custom' && logo.customUrl) {
    try {
      const customImg = await loadImage(logo.customUrl);
      const maxW = logo.size === 'small' ? 100 : logo.size === 'medium' ? 160 : 220;
      const scale = maxW / customImg.naturalWidth;
      const destW = customImg.naturalWidth * scale;
      const destH = customImg.naturalHeight * scale;

      let drawX = lx;
      if (textAlign === 'right') drawX = lx - destW;
      if (textAlign === 'center') drawX = lx - destW / 2;

      ctx.drawImage(customImg, drawX, ly, destW, destH);
    } catch {
      // ignore
    }
  } else {
    // Predefined Logo rendering
    const emblemSize = logo.size === 'small' ? 24 : logo.size === 'medium' ? 32 : 40;
    const textSize = Math.round(emblemSize * 0.65);
    const subTextSize = Math.round(textSize * 0.72);

    const textColor =
      logo.theme === 'white'
        ? '#ffffff'
        : logo.theme === 'dark'
        ? '#0f172a'
        : '#818cf8';

    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top';

    // Draw geometric badge / monogram
    let emblemX = lx;
    if (textAlign === 'right') {
      emblemX = lx - emblemSize;
    } else if (textAlign === 'center') {
      emblemX = lx - emblemSize / 2;
    }

    // Draw icon emblem
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.5;

    if (logo.predefinedId === 'aura-crest') {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(emblemX + emblemSize / 2, ly);
      ctx.lineTo(emblemX + emblemSize, ly + emblemSize / 2);
      ctx.lineTo(emblemX + emblemSize / 2, ly + emblemSize);
      ctx.lineTo(emblemX, ly + emblemSize / 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(emblemX + emblemSize / 2, ly + emblemSize / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (logo.predefinedId === 'clean-mark') {
      // Hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = emblemX + emblemSize / 2 + (emblemSize / 2) * Math.cos(angle);
        const hy = ly + emblemSize / 2 + (emblemSize / 2) * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // Studio Minimal square monogram
      roundRect(ctx, emblemX, ly, emblemSize, emblemSize, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(emblemX + emblemSize / 2, ly + emblemSize / 2, emblemSize / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw brand title & handle
    const textOffsetX =
      textAlign === 'left' ? emblemSize + 14 : textAlign === 'right' ? -14 : 0;
    const textOffsetY = textAlign === 'center' ? emblemSize + 8 : 2;

    ctx.font = `700 ${textSize}px 'Syne', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(logo.brandText || 'AUTOPOST STUDIO', lx + textOffsetX, ly + textOffsetY);

    if (logo.brandHandle) {
      ctx.font = `500 ${subTextSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText(
        logo.brandHandle,
        lx + textOffsetX,
        ly + textOffsetY + textSize + 4
      );
    }
  }

  ctx.restore();
}

/**
 * Returns CSS font string based on style
 */
export function getFontFamilyString(style: string): string {
  switch (style) {
    case 'editorial':
      return "'Fraunces', serif";
    case 'avant-garde':
      return "'Syne', sans-serif";
    case 'modern':
      return "'Plus Jakarta Sans', sans-serif";
    case 'minimal':
      return "'Plus Jakarta Sans', -apple-system, sans-serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    default:
      return "'Plus Jakarta Sans', sans-serif";
  }
}

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Downloads a canvas element as a PNG image file
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
