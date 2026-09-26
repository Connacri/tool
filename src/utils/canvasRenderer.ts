import {
  AspectRatioOption,
  ColorFilterConfig,
  GradientBlurConfig,
  LogoConfig,
  OverlayImageConfig,
  SlideItem,
  TextAlign,
  TypographyConfig,
} from '../types';

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
  overlayConfig?: OverlayImageConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = aspectRatio.width;
  canvas.height = aspectRatio.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d initialiser le contexte canvas 2D');

  const width = canvas.width;
  const height = canvas.height;

  const activeBlur = slide.customBlur || blurConfig;
  const activeColorFilter = slide.customFilter || filterConfig;
  const activeOverlay = slide.customOverlayImage || overlayConfig;

  // 1. Draw Background Image or Fallback Gradient
  try {
    const bgImage = await loadImage(slide.imageUrl);
    // Draw image object-fit: cover with imagePanX, imagePanY and imageZoom
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;

    const zoom = Math.max(1, slide.imageZoom ?? 1);
    const panX = Math.max(0, Math.min(100, slide.imagePanX ?? 50)) / 100;
    const panY = Math.max(0, Math.min(100, slide.imagePanY ?? 50)) / 100;

    let baseSWidth = bgImage.naturalWidth;
    let baseSHeight = bgImage.naturalHeight;

    if (imgRatio > canvasRatio) {
      baseSWidth = bgImage.naturalHeight * canvasRatio;
    } else {
      baseSHeight = bgImage.naturalWidth / canvasRatio;
    }

    const sWidth = baseSWidth / zoom;
    const sHeight = baseSHeight / zoom;

    const maxSx = bgImage.naturalWidth - sWidth;
    const maxSy = bgImage.naturalHeight - sHeight;

    const sx = Math.max(0, Math.min(maxSx, panX * (bgImage.naturalWidth - sWidth)));
    const sy = Math.max(0, Math.min(maxSy, panY * (bgImage.naturalHeight - sHeight)));

    const brightness = slide.imageBrightness ?? 100;

    // Draw sharp base image
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
    ctx.filter = 'none';

    // Apply Gradient Blur if enabled
    if (activeBlur && activeBlur.enabled && activeBlur.blurAmount > 0) {
      const blurPx = Math.round(activeBlur.blurAmount * (width / 1000));
      if (activeBlur.direction === 'full') {
        // Redraw completely blurred
        ctx.save();
        ctx.filter = `blur(${blurPx}px) brightness(${brightness}%)`;
        ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
        ctx.restore();
      } else {
        // Progressive gradient blur using offscreen canvas mask
        const offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.filter = `blur(${blurPx}px) brightness(${brightness}%)`;
          offCtx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);

          // Create mask gradient
          offCtx.globalCompositeOperation = 'destination-in';
          let maskGrad: CanvasGradient | null = null;

          if (activeBlur.direction === 'bottom') {
            maskGrad = offCtx.createLinearGradient(0, height * 0.35, 0, height);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
          } else if (activeBlur.direction === 'top') {
            maskGrad = offCtx.createLinearGradient(0, 0, 0, height * 0.65);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else if (activeBlur.direction === 'left') {
            maskGrad = offCtx.createLinearGradient(0, 0, width * 0.65, 0);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else if (activeBlur.direction === 'right') {
            maskGrad = offCtx.createLinearGradient(width * 0.35, 0, width, 0);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
          } else if (activeBlur.direction === 'tilt-shift') {
            maskGrad = offCtx.createLinearGradient(0, 0, 0, height);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            maskGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
          } else if (activeBlur.direction === 'custom-rect') {
            const posX = ((activeBlur.positionX ?? 50) / 100) * width;
            const posY = ((activeBlur.positionY ?? 50) / 100) * height;
            const rectW = ((activeBlur.width ?? 80) / 100) * width;
            const rectH = ((activeBlur.height ?? 40) / 100) * height;
            const rx = posX - rectW / 2;
            const ry = posY - rectH / 2;

            offCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            roundRect(offCtx, rx, ry, rectW, rectH, 20);
            offCtx.fill();
          } else if (activeBlur.direction === 'custom-circle') {
            const posX = ((activeBlur.positionX ?? 50) / 100) * width;
            const posY = ((activeBlur.positionY ?? 50) / 100) * height;
            const radius = (((activeBlur.width ?? 50) / 100) * width) / 2;

            offCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            offCtx.beginPath();
            offCtx.arc(posX, posY, radius, 0, Math.PI * 2);
            offCtx.fill();
          } else if (activeBlur.direction === 'radial') {
            const posX = ((activeBlur.positionX ?? 50) / 100) * width;
            const posY = ((activeBlur.positionY ?? 50) / 100) * height;
            const rInner = width * 0.15;
            const rOuter = (width * ((activeBlur.width ?? 70) / 100)) / 2;

            maskGrad = offCtx.createRadialGradient(posX, posY, rInner, posX, posY, rOuter);
            maskGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            maskGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
          }

          if (maskGrad) {
            offCtx.fillStyle = maskGrad;
            offCtx.fillRect(0, 0, width, height);
          }

          // Composite blurred layer onto main canvas
          ctx.drawImage(offCanvas, 0, 0);
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
  const paddingX = Math.round(width * 0.08);
  const paddingY = Math.round(height * 0.08);
  const contentWidth = width - paddingX * 2;

  const textSample = `${slide.kicker || ''} ${slide.text || ''} ${slide.subtitle || ''}`;
  const layoutDir = resolveLayoutDirection(
    textSample,
    typography.direction,
    slide.customDirection
  );
  const isRtl = layoutDir === 'rtl';

  // Dynamic font configuration (supporting Arabic Google fonts)
  const fontFamily = getFontFamilyString(typography.fontStyle, typography.arabicFont, isRtl);
  const baseSize = Math.round(width * 0.048 * typography.fontSize * (slide.phraseScale ?? 1));
  const kickerSize = Math.round(baseSize * 0.38 * (slide.kickerScale ?? 1));
  const subtitleSize = Math.round(baseSize * 0.42 * (slide.subtitleScale ?? 1));
  const lineHeight = Math.round(baseSize * 1.35);

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

  const getAlignX = (align: TextAlign): number => {
    if (align === 'center') return width / 2;
    if (align === 'right') return width - paddingX;
    return paddingX;
  };

  ctx.font = `600 ${baseSize}px ${fontFamily}`;
  const lines = wrapText(ctx, slide.text, contentWidth);
  const totalTextHeight =
    lines.length * lineHeight +
    (typography.showKicker ? kickerSize * 2 : 0) +
    (typography.showSubtitle ? subtitleSize * 2 : 0);

  // Determine default Y position
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
    const boxX = slide.phrasePos ? (slide.phrasePos.x / 100) * width - contentWidth / 2 : paddingX - boxPad / 2;
    const boxY = slide.phrasePos ? (slide.phrasePos.y / 100) * height - totalTextHeight / 2 : startY - boxPad;
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
    const boxX = slide.phrasePos ? (slide.phrasePos.x / 100) * width - contentWidth / 2 : paddingX - boxPad / 2;
    const boxY = slide.phrasePos ? (slide.phrasePos.y / 100) * height - totalTextHeight / 2 : startY - boxPad;
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

  // 4. Draw Kicker with user-selected kickerAlign or custom position
  if (typography.showKicker && slide.kicker) {
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = kickerAlign;
    const kickerX = slide.kickerPos ? (slide.kickerPos.x / 100) * width : getAlignX(kickerAlign);
    const kickerYPos = slide.kickerPos ? (slide.kickerPos.y / 100) * height : currentY;

    ctx.font = isRtl
      ? `700 ${kickerSize}px ${fontFamily}`
      : `700 ${kickerSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = typography.accentColor || '#818cf8';
    if (!isRtl) {
      ctx.letterSpacing = '2px';
      ctx.fillText(slide.kicker.toUpperCase(), kickerX, kickerYPos);
    } else {
      ctx.fillText(slide.kicker, kickerX, kickerYPos);
    }
    ctx.restore();
    if (!slide.kickerPos) {
      currentY += kickerSize + 20;
    }
  }

  // 5. Draw Main Phrase Lines with user-selected phraseAlign or custom position
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = phraseAlign;
  const phraseX = slide.phrasePos ? (slide.phrasePos.x / 100) * width : getAlignX(phraseAlign);
  let phraseYPos = slide.phrasePos ? (slide.phrasePos.y / 100) * height : currentY;

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
      roundRect(ctx, hlX, phraseYPos - 4, lineMetrics.width + 24, lineHeight, 8);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillText(line, phraseX, phraseYPos);
    phraseYPos += lineHeight;
  }
  ctx.restore();
  if (!slide.phrasePos) {
    currentY = phraseYPos;
  }

  // 6. Draw Subtitle / Citation with phrase alignment or custom position
  if (typography.showSubtitle && slide.subtitle) {
    if (!slide.subtitlePos) {
      currentY += 16;
    }
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = phraseAlign;
    const subX = slide.subtitlePos ? (slide.subtitlePos.x / 100) * width : getAlignX(phraseAlign);
    const subYPos = slide.subtitlePos ? (slide.subtitlePos.y / 100) * height : currentY;

    ctx.font = isRtl
      ? `400 ${subtitleSize}px ${fontFamily}`
      : `400 ${subtitleSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(slide.subtitle, subX, subYPos);
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
    await renderLogoOnCanvas(ctx, logo, width, height, paddingX, paddingY, slide);
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
  paddingY: number,
  slide?: SlideItem
) {
  ctx.save();
  ctx.globalAlpha = logo.opacity;

  const logoScale = slide?.logoScale ?? 1;

  // Determine logo position coordinates
  const marginX = paddingX;
  const marginY = Math.round(paddingY * 0.75);

  let lx = marginX;
  let ly = marginY;
  let textAlign: CanvasTextAlign = 'left';

  if (slide?.logoPos) {
    lx = (slide.logoPos.x / 100) * width;
    ly = (slide.logoPos.y / 100) * height;
    textAlign = 'left';
  } else if (logo.position === 'top-left') {
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
      const maxW = (logo.size === 'small' ? 100 : logo.size === 'medium' ? 160 : 220) * logoScale;
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
    const emblemSize = Math.round((logo.size === 'small' ? 24 : logo.size === 'medium' ? 32 : 40) * logoScale);
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
 * Returns CSS font string based on style and Arabic font configuration
 */
export function getFontFamilyString(
  style: string,
  arabicFont?: string,
  isRtl?: boolean
): string {
  const arabicFamily =
    arabicFont === 'noto-arabic'
      ? "'Noto Sans Arabic'"
      : arabicFont === 'tajawal'
      ? "'Tajawal'"
      : arabicFont === 'amiri'
      ? "'Amiri'"
      : "'Cairo'";

  if (isRtl) {
    return `${arabicFamily}, 'Plus Jakarta Sans', sans-serif`;
  }

  switch (style) {
    case 'editorial':
      return `'Fraunces', ${arabicFamily}, serif`;
    case 'avant-garde':
      return `'Syne', ${arabicFamily}, sans-serif`;
    case 'modern':
      return `'Plus Jakarta Sans', ${arabicFamily}, sans-serif`;
    case 'minimal':
      return `'Plus Jakarta Sans', ${arabicFamily}, -apple-system, sans-serif`;
    case 'mono':
      return `'JetBrains Mono', ${arabicFamily}, monospace`;
    default:
      return `'Plus Jakarta Sans', ${arabicFamily}, sans-serif`;
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
    ctx.drawImage(img, ox, oy, destW, destH);
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
