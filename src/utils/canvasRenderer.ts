import {
  AspectRatioOption,
  ColorFilterConfig,
  GradientBlurConfig,
  LogoConfig,
  OverlayImageConfig,
  SlideItem,
  TextAlign,
  TypographyConfig,
  WatermarkConfig,
} from '../types';
import { formatArabicDigits, loadGoogleFont } from './googleFonts';

/**
 * Checks if a string contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Resolves the actual layout direction (RTL or LTR)
 */
export function resolveLayoutDirection(
  text: string,
  configuredDirection?: 'auto' | 'ltr' | 'rtl',
  slideDirection?: 'auto' | 'ltr' | 'rtl'
): 'rtl' | 'ltr' {
  const dir = slideDirection || configuredDirection || 'auto';
  if (dir === 'rtl') return 'rtl';
  if (dir === 'ltr') return 'ltr';
  return isArabicText(text) ? 'rtl' : 'ltr';
}

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
  totalSlides: number = 6,
  blurConfig?: GradientBlurConfig,
  filterConfig?: ColorFilterConfig,
  overlayConfig?: OverlayImageConfig,
  watermarkConfig?: WatermarkConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = aspectRatio.width;
  canvas.height = aspectRatio.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d initialiser le contexte canvas 2D');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const width = canvas.width;
  const height = canvas.height;

  const activeBlur = slide.customBlur || blurConfig;
  const activeColorFilter = slide.customFilter || filterConfig;
  const activeOverlay = slide.customOverlayImage || overlayConfig;

  // 1. Draw Background Image or Fallback Gradient
  try {
    const bgImage = await loadImage(slide.imageUrl);
    // Draw image object-fit: cover with zoom and pan
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;

    let baseWidth = bgImage.naturalWidth;
    let baseHeight = bgImage.naturalHeight;

    if (imgRatio > canvasRatio) {
      baseWidth = bgImage.naturalHeight * canvasRatio;
    } else {
      baseHeight = bgImage.naturalWidth / canvasRatio;
    }

    const zoom = Math.max(1, slide.imageZoom ?? 1);
    const sWidth = baseWidth / zoom;
    const sHeight = baseHeight / zoom;

    // Pan offsets (-50% to +50%)
    const panX = Math.max(-50, Math.min(50, slide.imagePanX ?? 0));
    const panY = Math.max(-50, Math.min(50, slide.imagePanY ?? 0));

    const maxSlackX = bgImage.naturalWidth - sWidth;
    const maxSlackY = bgImage.naturalHeight - sHeight;

    // Center focal point modified by pan
    let sx = (maxSlackX / 2) + (panX / 50) * (maxSlackX / 2);
    let sy = (maxSlackY / 2) + (panY / 50) * (maxSlackY / 2);

    sx = Math.max(0, Math.min(bgImage.naturalWidth - sWidth, sx));
    sy = Math.max(0, Math.min(bgImage.naturalHeight - sHeight, sy));

    const brightness = slide.imageBrightness ?? 100;

    // Draw sharp base image
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
    ctx.filter = 'none';

    // Apply Gradient Blur if enabled
    if (activeBlur && activeBlur.enabled && activeBlur.blurAmount > 0) {
      const blurPx = Math.round(activeBlur.blurAmount * (width / 1000));
      const posPercentY = (activeBlur.positionY ?? (activeBlur.direction === 'top' ? 25 : activeBlur.direction === 'bottom' ? 75 : 50)) / 100;
      const posPercentX = (activeBlur.positionX ?? 50) / 100;
      const blurSizeRatio = (activeBlur.blurSize ?? 50) / 100;
      const blurWidthRatio = (activeBlur.blurWidth ?? 85) / 100;

      if (activeBlur.direction === 'full') {
        // Redraw completely blurred
        ctx.save();
        ctx.filter = `blur(${blurPx}px) brightness(${brightness}%)`;
        if (activeBlur.opacity !== undefined && activeBlur.opacity < 1) {
          ctx.globalAlpha = activeBlur.opacity;
        }
        ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
        ctx.restore();
      } else {
        // Progressive gradient blur using offscreen canvas mask
        const offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.imageSmoothingEnabled = true;
          offCtx.imageSmoothingQuality = 'high';
          offCtx.filter = `blur(${blurPx}px) brightness(${brightness}%)`;
          offCtx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);

          // Create mask gradient
          offCtx.globalCompositeOperation = 'destination-in';
          const targetY = height * posPercentY;
          const targetX = width * posPercentX;
          const zoneH = height * blurSizeRatio;
          const zoneW = width * blurWidthRatio;

          if (activeBlur.direction === 'bottom') {
            const startFadeY = Math.max(0, targetY - zoneH * 0.7);
            const maskGrad = offCtx.createLinearGradient(0, startFadeY, 0, height);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'top') {
            const endFadeY = Math.min(height, targetY + zoneH * 0.7);
            const maskGrad = offCtx.createLinearGradient(0, 0, 0, endFadeY);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'center') {
            const maskGrad = offCtx.createLinearGradient(0, targetY - zoneH / 2, 0, targetY + zoneH / 2);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.3, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, targetY - zoneH / 2, width, zoneH);
          } else if (activeBlur.direction === 'tilt-shift') {
            const maskGrad = offCtx.createLinearGradient(0, 0, 0, height);
            const topClear = Math.max(0, targetY - zoneH / 2);
            const botClear = Math.min(height, targetY + zoneH / 2);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(topClear / height, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(botClear / height, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'tilt-shift-vertical') {
            const maskGrad = offCtx.createLinearGradient(0, 0, width, 0);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'left') {
            const maskGrad = offCtx.createLinearGradient(0, 0, targetX + zoneW * 0.5, 0);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'right') {
            const maskGrad = offCtx.createLinearGradient(targetX - zoneW * 0.5, 0, width, 0);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'radial') {
            const r1 = Math.min(width, height) * 0.15 * (1 - blurSizeRatio * 0.5);
            const r2 = Math.min(width, height) * 0.65 * (blurSizeRatio * 1.2);
            const maskGrad = offCtx.createRadialGradient(targetX, targetY, r1, targetX, targetY, r2);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          } else if (activeBlur.direction === 'box') {
            const bx = targetX - zoneW / 2;
            const by = targetY - zoneH / 2;
            roundRect(offCtx, bx, by, zoneW, zoneH, 24);
            offCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            offCtx.fill();
          }

          // Composite blurred layer onto main canvas
          ctx.save();
          if (activeBlur.opacity !== undefined && activeBlur.opacity < 1) {
            ctx.globalAlpha = activeBlur.opacity;
          }
          ctx.drawImage(offCanvas, 0, 0);
          ctx.restore();
        }
      }
    }
  } catch {
    // Elegant fallback gradient if image load fails
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 1.5 Apply Color Gradient Filter Overlay if enabled
  if (
    activeColorFilter &&
    activeColorFilter.enabled &&
    activeColorFilter.preset !== 'none'
  ) {
    ctx.save();
    const rad = ((activeColorFilter.angle ?? 135) * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const dist = Math.hypot(width, height) / 2;
    const x1 = cx - Math.cos(rad) * dist;
    const y1 = cy - Math.sin(rad) * dist;
    const x2 = cx + Math.cos(rad) * dist;
    const y2 = cy + Math.sin(rad) * dist;

    const colorGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    colorGrad.addColorStop(0, activeColorFilter.colorStart);
    colorGrad.addColorStop(1, activeColorFilter.colorEnd);

    ctx.globalAlpha = activeColorFilter.opacity ?? 0.5;
    ctx.globalCompositeOperation =
      activeColorFilter.blendMode === 'normal' ? 'source-over' : activeColorFilter.blendMode;
    ctx.fillStyle = colorGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 2. Base Dark Tint Overlay
  const baseDarkOpacity = slide.customOverlayOpacity ?? 0.4;
  if (baseDarkOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${baseDarkOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }

  // 2.5 Draw Overlay Image (Image de superposition) if enabled
  if (activeOverlay && activeOverlay.enabled && activeOverlay.url) {
    await renderOverlayOnCanvas(ctx, activeOverlay, width, height, Math.round(width * 0.08), Math.round(height * 0.08));
  }

  // 3. Direction, Arabic Detection & Typography Configuration
  const textSample = `${slide.kicker || ''} ${slide.text || ''} ${slide.subtitle || ''}`;
  const layoutDir = resolveLayoutDirection(
    textSample,
    typography.direction,
    slide.customDirection
  );
  const isRtl = layoutDir === 'rtl';

  // Dynamic font configuration & independent resizing
  const phraseScale = slide.customTextScale ?? typography.fontSize ?? 1.1;
  const kickerScale = slide.customKickerScale ?? typography.kickerSize ?? 1.0;
  const subtitleScale = slide.customSubtitleScale ?? typography.subtitleSize ?? 1.0;

  // Dynamically load Google Font if needed
  const targetFontName = isRtl
    ? (typography.customArabicFontFamily || typography.arabicFont || 'Cairo')
    : (typography.customFontFamily || typography.fontStyle || 'Plus Jakarta Sans');
  try {
    await loadGoogleFont(targetFontName);
  } catch {
    // continue
  }

  const fontFamily = getFontFamilyString(
    typography.fontStyle,
    typography.arabicFont,
    isRtl,
    typography.customFontFamily,
    typography.customArabicFontFamily
  );

  const baseSize = Math.round(width * 0.048 * phraseScale);
  const kickerSize = Math.round(baseSize * 0.38 * kickerScale);
  const subtitleSize = Math.round(baseSize * 0.42 * subtitleScale);
  const lineHeightMultiplier = typography.lineHeight ?? 1.35;
  const lineHeight = Math.round(baseSize * lineHeightMultiplier);

  // Format numerals: Eastern Arabic if enabled, or standard Western digits preserving LTR
  const displayText = typography.easternNumerals
    ? formatArabicDigits(slide.text, true)
    : slide.text;
  const displayKicker = typography.easternNumerals
    ? formatArabicDigits(slide.kicker, true)
    : slide.kicker;
  const displaySubtitle = typography.easternNumerals
    ? formatArabicDigits(slide.subtitle, true)
    : slide.subtitle;

  const textWidthPercent = Math.max(0.4, Math.min(1.0, (typography.textWidth ?? 85) / 100));
  const contentWidth = Math.round(width * textWidthPercent);
  const paddingX = Math.round((width - contentWidth) / 2);
  const paddingY = Math.round(height * 0.08);

  // Set directional mode on 2D context for Arabic shaping and bidirectional numerals
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  // Alignment configuration (user choice for title & phrase)
  const defaultAlign: TextAlign = isRtl ? 'right' : 'left';
  const baseAlign: TextAlign = slide.customAlign || typography.align || defaultAlign;

  const kickerAlign: TextAlign =
    typography.kickerAlign && typography.kickerAlign !== 'inherit'
      ? typography.kickerAlign
      : baseAlign;

  const phraseAlign: TextAlign =
    typography.phraseAlign && typography.phraseAlign !== 'inherit'
      ? typography.phraseAlign
      : baseAlign;

  ctx.font = `600 ${baseSize}px ${fontFamily}`;
  const lines = wrapText(ctx, displayText, contentWidth);
  const totalTextHeight =
    lines.length * lineHeight +
    (typography.showKicker && displayKicker ? kickerSize * 2 : 0) +
    (typography.showSubtitle && displaySubtitle ? subtitleSize * 2 : 0);

  // Determine X & Y position (Free Drag & Drop or Structured)
  const isCustomSlidePos = slide.customTextX !== undefined && slide.customTextY !== undefined;

  let startX = paddingX;
  let startY = 0;

  if (isCustomSlidePos) {
    startX = Math.round((slide.customTextX! / 100) * width - contentWidth / 2);
    startY = Math.round((slide.customTextY! / 100) * height - totalTextHeight / 2);
  } else if (typography.position === 'free') {
    startX = Math.round(((typography.freePositionX ?? 50) / 100) * width - contentWidth / 2);
    startY = Math.round(((typography.freePositionY ?? 75) / 100) * height - totalTextHeight / 2);
  } else if (typography.position === 'top') {
    startY = paddingY + (logo.enabled && logo.position.includes('top') ? 110 : 30);
  } else if (typography.position === 'center') {
    startY = Math.round((height - totalTextHeight) / 2);
  } else {
    // bottom
    startY = height - paddingY - totalTextHeight - 20;
  }

  const getAlignX = (align: TextAlign): number => {
    if (align === 'center') return startX + contentWidth / 2;
    if (align === 'right') return startX + contentWidth;
    return startX;
  };

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
    const boxX = startX - boxPad / 2;
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
    const boxX = startX - boxPad / 2;
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

  ctx.textBaseline = 'top';
  let currentY = startY;

  // 4. Draw Kicker with user-selected kickerAlign
  if (typography.showKicker && displayKicker) {
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = kickerAlign;
    const kickerX = getAlignX(kickerAlign);
    ctx.font = isRtl
      ? `700 ${kickerSize}px ${fontFamily}`
      : `700 ${kickerSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = typography.accentColor || '#818cf8';
    if (!isRtl) {
      ctx.letterSpacing = '2px';
      ctx.fillText(displayKicker.toUpperCase(), kickerX, currentY);
    } else {
      ctx.fillText(displayKicker, kickerX, currentY);
    }
    ctx.restore();
    currentY += kickerSize + 20;
  }

  // 5. Draw Main Phrase Lines with user-selected phraseAlign
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = phraseAlign;
  const phraseX = getAlignX(phraseAlign);
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
      let hlX = phraseX - 12;
      if (phraseAlign === 'center') {
        hlX = phraseX - lineMetrics.width / 2 - 12;
      } else if (phraseAlign === 'right') {
        hlX = phraseX - lineMetrics.width - 12;
      }
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
      roundRect(ctx, hlX, currentY - 4, lineMetrics.width + 24, lineHeight, 8);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillText(line, phraseX, currentY);
    currentY += lineHeight;
  }
  ctx.restore();

  // 6. Draw Subtitle / Citation with phrase alignment
  if (typography.showSubtitle && displaySubtitle) {
    currentY += 16;
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = phraseAlign;
    const subX = getAlignX(phraseAlign);
    ctx.font = isRtl
      ? `400 ${subtitleSize}px ${fontFamily}`
      : `400 ${subtitleSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(displaySubtitle, subX, currentY);
    ctx.restore();
  }

  // 7. Slide Index Indicator (strictly LTR for digits)
  if (typography.showSlideNumber) {
    const numText = `${String(slide.number).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    ctx.save();
    ctx.direction = 'ltr'; // STRICTLY LTR for digits & counter badge
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

  // 9. Draw Watermark (Filigrane) if Enabled
  if (watermarkConfig && watermarkConfig.enabled) {
    renderWatermarkOnCanvas(ctx, watermarkConfig, width, height);
  }

  return canvas;
}

/**
 * Renders the chosen logo (custom image or predefined branded emblem) on the canvas
 * Supports: precise scale, 9-anchor + custom X/Y positioning, margins, rotation, opacity,
 * color inversion, and unified monochrome coloring!
 */
async function renderLogoOnCanvas(
  ctx: CanvasRenderingContext2D,
  logo: LogoConfig,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  if (!logo.enabled) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, logo.opacity));

  const logoScale = logo.scale ?? (logo.size === 'small' ? 0.75 : logo.size === 'large' ? 1.35 : 1.0);
  const marginPct = (logo.margin ?? 6) / 100;
  const marginX = Math.round(width * marginPct);
  const marginY = Math.round(height * marginPct);

  let lx = marginX;
  let ly = marginY;
  let textAlign: CanvasTextAlign = 'left';

  switch (logo.position) {
    case 'top-left':
      lx = marginX;
      ly = marginY;
      textAlign = 'left';
      break;
    case 'top-center':
      lx = width / 2;
      ly = marginY;
      textAlign = 'center';
      break;
    case 'top-right':
      lx = width - marginX;
      ly = marginY;
      textAlign = 'right';
      break;
    case 'center-left':
      lx = marginX;
      ly = height / 2;
      textAlign = 'left';
      break;
    case 'center':
      lx = width / 2;
      ly = height / 2;
      textAlign = 'center';
      break;
    case 'center-right':
      lx = width - marginX;
      ly = height / 2;
      textAlign = 'right';
      break;
    case 'bottom-left':
      lx = marginX;
      ly = height - marginY;
      textAlign = 'left';
      break;
    case 'bottom-center':
      lx = width / 2;
      ly = height - marginY;
      textAlign = 'center';
      break;
    case 'bottom-right':
      lx = width - marginX;
      ly = height - marginY;
      textAlign = 'right';
      break;
    case 'custom':
    default:
      lx = ((logo.customX ?? 10) / 100) * width;
      ly = ((logo.customY ?? 10) / 100) * height;
      textAlign = 'center';
      break;
  }

  // Predefined logo or custom image
  if (logo.type === 'custom' && logo.customUrl) {
    try {
      const customImg = await loadImage(logo.customUrl);
      const baseMaxW = width * 0.22;
      const targetMaxW = Math.min(width * 0.95, baseMaxW * logoScale);
      const targetMaxH = Math.min(height * 0.88, (width * 0.22 * logoScale) * (customImg.naturalHeight / customImg.naturalWidth));
      const scaleFactor = Math.min(targetMaxW / customImg.naturalWidth, targetMaxH / customImg.naturalHeight);
      const destW = customImg.naturalWidth * scaleFactor;
      const destH = customImg.naturalHeight * scaleFactor;

      let drawX = lx;
      let drawY = ly;

      if (logo.position === 'custom') {
        drawX = lx - destW / 2;
        drawY = ly - destH / 2;
      } else {
        if (textAlign === 'right') drawX = lx - destW;
        else if (textAlign === 'center') drawX = lx - destW / 2;

        if (logo.position.includes('bottom')) drawY = ly - destH;
        else if (logo.position.includes('center') && !logo.position.includes('top') && !logo.position.includes('bottom')) drawY = ly - destH / 2;
      }

      ctx.save();
      if (logo.rotation) {
        const centerX = drawX + destW / 2;
        const centerY = drawY + destH / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((logo.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Check if color inversion or unification is requested
      if (logo.unifyColor || logo.invertColor) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.max(1, Math.round(destW));
        offCanvas.height = Math.max(1, Math.round(destH));
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.imageSmoothingEnabled = true;
          offCtx.imageSmoothingQuality = 'high';
          if (logo.invertColor) {
            offCtx.filter = 'invert(100%)';
          }
          offCtx.drawImage(customImg, 0, 0, offCanvas.width, offCanvas.height);

          if (logo.unifyColor) {
            const targetColor = logo.unifiedColor || '#ffffff';
            offCtx.filter = 'none';
            offCtx.globalCompositeOperation = 'source-in';
            offCtx.fillStyle = targetColor;
            offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
          }

          ctx.drawImage(offCanvas, drawX, drawY);
        }
      } else {
        ctx.drawImage(customImg, drawX, drawY, destW, destH);
      }

      ctx.restore();
    } catch (e) {
      console.warn('Erreur lors du rendu du logo personnalisé:', e);
    }
  } else {
    // Predefined Logo rendering
    const baseEmblemSize = Math.round(width * 0.040);
    const emblemSize = Math.round(baseEmblemSize * logoScale);
    const textSize = Math.round(emblemSize * 0.65);
    const subTextSize = Math.round(textSize * 0.72);

    let textColor =
      logo.unifyColor && logo.unifiedColor
        ? logo.unifiedColor
        : logo.theme === 'white'
        ? '#ffffff'
        : logo.theme === 'dark'
        ? '#0f172a'
        : '#818cf8';

    if (logo.invertColor && (!logo.unifyColor || !logo.unifiedColor)) {
      textColor = textColor === '#ffffff' ? '#000000' : textColor === '#0f172a' ? '#ffffff' : '#4338ca';
    }

    ctx.save();
    let finalLy = ly;
    if (logo.position.includes('bottom')) finalLy = ly - emblemSize - (logo.brandHandle ? subTextSize + 6 : 0);
    else if (logo.position === 'center' || logo.position === 'center-left' || logo.position === 'center-right') finalLy = ly - emblemSize / 2;
    else if (logo.position === 'custom') finalLy = ly - emblemSize / 2;

    if (logo.rotation) {
      const centerX = textAlign === 'right' ? lx - emblemSize * 2 : textAlign === 'center' ? lx : lx + emblemSize * 2;
      const centerY = finalLy + emblemSize / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((logo.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top';

    let emblemX = lx;
    if (textAlign === 'right') {
      emblemX = lx - emblemSize;
    } else if (textAlign === 'center') {
      emblemX = lx - emblemSize / 2;
    } else if (logo.position === 'custom') {
      emblemX = lx - emblemSize / 2;
    }

    // Draw icon emblem
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.5 * logoScale;

    if (logo.predefinedId === 'aura-crest') {
      ctx.beginPath();
      ctx.moveTo(emblemX + emblemSize / 2, finalLy);
      ctx.lineTo(emblemX + emblemSize, finalLy + emblemSize / 2);
      ctx.lineTo(emblemX + emblemSize / 2, finalLy + emblemSize);
      ctx.lineTo(emblemX, finalLy + emblemSize / 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(emblemX + emblemSize / 2, finalLy + emblemSize / 2, 4 * logoScale, 0, Math.PI * 2);
      ctx.fill();
    } else if (logo.predefinedId === 'clean-mark') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = emblemX + emblemSize / 2 + (emblemSize / 2) * Math.cos(angle);
        const hy = finalLy + emblemSize / 2 + (emblemSize / 2) * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      roundRect(ctx, emblemX, finalLy, emblemSize, emblemSize, 6 * logoScale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(emblemX + emblemSize / 2, finalLy + emblemSize / 2, emblemSize / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw brand title & handle
    const textOffsetX =
      textAlign === 'left' ? emblemSize + 12 * logoScale : textAlign === 'right' ? -12 * logoScale : 0;
    const textOffsetY = textAlign === 'center' ? emblemSize + 8 * logoScale : 2 * logoScale;

    ctx.font = `700 ${textSize}px 'Syne', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(logo.brandText || 'AUTOPOST STUDIO', lx + textOffsetX, finalLy + textOffsetY);

    if (logo.brandHandle) {
      ctx.font = `500 ${subTextSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = logo.unifyColor && logo.unifiedColor ? textColor : 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(
        logo.brandHandle,
        lx + textOffsetX,
        finalLy + textOffsetY + textSize + 4 * logoScale
      );
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders watermark (filigrane) on the canvas
 * Supports single position with custom X/Y or repeating diagonal matrix pattern
 */
function renderWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkConfig,
  width: number,
  height: number
) {
  if (!watermark.enabled || !watermark.text?.trim()) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.02, Math.min(1, watermark.opacity));

  const scale = watermark.scale ?? 1.0;
  const baseFontSize = Math.round(width * 0.022 * scale);
  const fontFamily = watermark.fontFamily || "'Plus Jakarta Sans', sans-serif";
  const textColor = watermark.color || '#ffffff';

  ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.strokeStyle = textColor;

  if (watermark.style === 'repeated') {
    // Repeated diagonal pattern
    const angleRad = ((watermark.rotation ?? -28) * Math.PI) / 180;
    const gap = Math.round((watermark.gap ?? 180) * (width / 1000) * scale);
    const lineSpacing = Math.round(gap * 0.65);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angleRad);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const diagonal = Math.hypot(width, height) * 1.6;
    const startX = -diagonal / 2;
    const endX = diagonal / 2;
    const startY = -diagonal / 2;
    const endY = diagonal / 2;

    let rowIndex = 0;
    for (let y = startY; y < endY; y += lineSpacing) {
      const offsetX = rowIndex % 2 === 0 ? 0 : gap / 2;
      for (let x = startX + offsetX; x < endX; x += gap) {
        ctx.fillText(watermark.text, x, y);
      }
      rowIndex++;
    }
    ctx.restore();
  } else {
    // Single placement
    let wx = width - Math.round(width * 0.05);
    let wy = height - Math.round(height * 0.04);
    let textAlign: CanvasTextAlign = 'right';

    if (watermark.position === 'custom') {
      wx = ((watermark.customX ?? 85) / 100) * width;
      wy = ((watermark.customY ?? 92) / 100) * height;
      textAlign = 'center';
    } else if (watermark.position === 'bottom-right') {
      wx = width - Math.round(width * 0.05);
      wy = height - Math.round(height * 0.04);
      textAlign = 'right';
    } else if (watermark.position === 'bottom-left') {
      wx = Math.round(width * 0.05);
      wy = height - Math.round(height * 0.04);
      textAlign = 'left';
    } else if (watermark.position === 'top-right') {
      wx = width - Math.round(width * 0.05);
      wy = Math.round(height * 0.05);
      textAlign = 'right';
    } else if (watermark.position === 'top-left') {
      wx = Math.round(width * 0.05);
      wy = Math.round(height * 0.05);
      textAlign = 'left';
    } else if (watermark.position === 'center') {
      wx = width / 2;
      wy = height / 2;
      textAlign = 'center';
    } else if (watermark.position === 'bottom-center') {
      wx = width / 2;
      wy = height - Math.round(height * 0.04);
      textAlign = 'center';
    } else if (watermark.position === 'top-center') {
      wx = width / 2;
      wy = Math.round(height * 0.05);
      textAlign = 'center';
    }

    ctx.save();
    ctx.translate(wx, wy);
    if (watermark.rotation) {
      ctx.rotate((watermark.rotation * Math.PI) / 180);
    }
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    if (watermark.showBorder) {
      const metrics = ctx.measureText(watermark.text);
      const padX = 14 * scale;
      const padY = 8 * scale;
      let bx = -padX;
      if (textAlign === 'right') bx = -metrics.width - padX;
      else if (textAlign === 'center') bx = -metrics.width / 2 - padX;
      const by = -baseFontSize / 2 - padY / 2;
      const bw = metrics.width + padX * 2;
      const bh = baseFontSize + padY;

      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = textColor;
    }

    ctx.fillText(watermark.text, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Returns CSS font string based on style and Arabic font configuration,
 * including instant Google Font custom names.
 */
export function getFontFamilyString(
  style: string,
  arabicFont?: string,
  isRtl?: boolean,
  customFontFamily?: string,
  customArabicFontFamily?: string
): string {
  if (isRtl) {
    if (customArabicFontFamily) {
      return `'${customArabicFontFamily}', 'Cairo', 'Noto Sans Arabic', sans-serif`;
    }
    const arabicFamily =
      arabicFont === 'noto-arabic'
        ? "'Noto Sans Arabic'"
        : arabicFont === 'tajawal'
        ? "'Tajawal'"
        : arabicFont === 'amiri'
        ? "'Amiri'"
        : arabicFont === 'alexandria'
        ? "'Alexandria'"
        : arabicFont === 'almarai'
        ? "'Almarai'"
        : arabicFont === 'readex'
        ? "'Readex Pro'"
        : arabicFont === 'el-messiri'
        ? "'El Messiri'"
        : "'Cairo'";

    return `${arabicFamily}, 'Plus Jakarta Sans', sans-serif`;
  }

  if (customFontFamily) {
    return `'${customFontFamily}', 'Plus Jakarta Sans', sans-serif`;
  }

  switch (style) {
    case 'editorial':
      return `'Fraunces', serif`;
    case 'avant-garde':
      return `'Syne', sans-serif`;
    case 'modern':
      return `'Plus Jakarta Sans', sans-serif`;
    case 'playfair':
      return `'Playfair Display', serif`;
    case 'outfit':
      return `'Outfit', sans-serif`;
    case 'cinzel':
      return `'Cinzel', serif`;
    case 'minimal':
      return `'Plus Jakarta Sans', -apple-system, sans-serif`;
    case 'mono':
      return `'JetBrains Mono', monospace`;
    default:
      return `'Plus Jakarta Sans', sans-serif`;
  }
}

/**
 * Renders an overlay image (image de superposition) onto the canvas
 */
async function renderOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  overlay: OverlayImageConfig,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  if (!overlay.enabled || !overlay.url) return;
  try {
    const img = await loadImage(overlay.url);
    const naturalW = img.naturalWidth || 200;
    const naturalH = img.naturalHeight || 200;
    const aspect = naturalW / naturalH;

    // Base target size relative to canvas width
    const baseSize = width * 0.35 * (overlay.scale ?? 1);
    let destW = baseSize;
    let destH = baseSize / aspect;

    // Clamp to canvas max bounds
    if (destW > width * 0.95) {
      destW = width * 0.95;
      destH = destW / aspect;
    }

    let ox = 0;
    let oy = 0;
    const marginX = paddingX;
    const marginY = paddingY;

    switch (overlay.position) {
      case 'center':
        ox = (width - destW) / 2;
        oy = (height - destH) / 2;
        break;
      case 'top-left':
        ox = marginX;
        oy = marginY;
        break;
      case 'top-right':
        ox = width - marginX - destW;
        oy = marginY;
        break;
      case 'bottom-left':
        ox = marginX;
        oy = height - marginY - destH;
        break;
      case 'bottom-right':
        ox = width - marginX - destW;
        oy = height - marginY - destH;
        break;
      case 'top-center':
        ox = (width - destW) / 2;
        oy = marginY;
        break;
      case 'bottom-center':
        ox = (width - destW) / 2;
        oy = height - marginY - destH;
        break;
      case 'custom':
        ox = ((overlay.customX ?? 50) / 100) * width - destW / 2;
        oy = ((overlay.customY ?? 50) / 100) * height - destH / 2;
        break;
    }

    ctx.save();
    ctx.globalAlpha = overlay.opacity ?? 1.0;
    ctx.globalCompositeOperation =
      overlay.blendMode === 'normal' ? 'source-over' : overlay.blendMode;
    if (overlay.rotation) {
      const centerX = ox + destW / 2;
      const centerY = oy + destH / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.drawImage(img, -destW / 2, -destH / 2, destW, destH);
    } else {
      ctx.drawImage(img, ox, oy, destW, destH);
    }
    ctx.restore();
  } catch (e) {
    console.warn('Erreur lors du rendu de l image de superposition:', e);
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
