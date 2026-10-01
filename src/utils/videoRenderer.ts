import {
  AspectRatioOption,
  ColorFilterConfig,
  GradientBlurConfig,
  LogoConfig,
  OverlayImageConfig,
  SlideItem,
  TypographyConfig,
  VideoTransitionOption,
  VideoTransitionType,
  WatermarkConfig,
} from '../types';
import { renderSlideToCanvas } from './canvasRenderer';

export const PREDEFINED_TRANSITIONS: VideoTransitionOption[] = [
  {
    id: 'fade',
    name: 'Fondu Enchaîné',
    description: 'Transition douce et élégante universelle (Crossfade)',
    category: 'classique',
  },
  {
    id: 'slide-left',
    name: 'Glissement Gauche',
    description: 'Effet carrousel dynamique et immersif (Push Left)',
    category: 'dynamique',
  },
  {
    id: 'slide-up',
    name: 'Défilement Vertical',
    description: 'Effet flux continu style Reel & Story (Slide Up)',
    category: 'dynamique',
  },
  {
    id: 'zoom',
    name: 'Zoom Cinématique',
    description: 'Effet caméra Ken Burns immersif avec mise à l\'échelle',
    category: 'cinematique',
  },
  {
    id: 'wipe',
    name: 'Volet Moderne',
    description: 'Dévoilement éditorial net et graphique (Wipe)',
    category: 'classique',
  },
  {
    id: 'flash',
    name: 'Flash Énergique',
    description: 'Transition rythmée avec éclat lumineux (Beat Flash)',
    category: 'dynamique',
  },
  {
    id: 'dip-black',
    name: 'Fondu au Noir',
    description: 'Coupe dramatique et cinématographique (Dip to Black)',
    category: 'cinematique',
  },
];

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Creates an empty/silent AudioTrack so that the generated video file
 * contains an audio stream. This ensures standard video players and social media
 * algorithms (Reels, TikTok, Shorts, WhatsApp) recognize the file as a true video.
 */
function createSilentAudioTrack(): MediaStreamTrack | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0; // Completely silent
    oscillator.connect(gain);
    const dest = ctx.createMediaStreamDestination();
    gain.connect(dest);
    oscillator.start();
    return dest.stream.getAudioTracks()[0] || null;
  } catch {
    return null;
  }
}

export interface VideoRenderParams {
  slides: SlideItem[];
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  gradientBlur?: GradientBlurConfig;
  colorFilter?: ColorFilterConfig;
  overlayImage?: OverlayImageConfig;
  watermark?: WatermarkConfig;
  transition: VideoTransitionType;
  slideDuration: number; // e.g. 2.5s
  transitionDuration: number; // e.g. 0.6s
  fps?: number; // 30
  onProgress?: (percent: number, statusText: string) => void;
  previewCanvas?: HTMLCanvasElement | null;
}

export interface GeneratedVideoResult {
  blob: Blob;
  url: string;
  filename: string;
  durationSeconds: number;
  mimeType: string;
}

/**
 * Pre-renders all slide canvases into memory for ultra-fast frame composition
 */
export async function preRenderAllSlideCanvases(
  params: VideoRenderParams
): Promise<HTMLCanvasElement[]> {
  const { slides, aspectRatio, typography, logo, gradientBlur, colorFilter, overlayImage, watermark, onProgress } =
    params;
  const renderedCanvases: HTMLCanvasElement[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (onProgress) {
      const pct = Math.round(((i + 1) / slides.length) * 25);
      onProgress(pct, `Pré-rendu HD de la diapo ${i + 1} sur ${slides.length}...`);
    }

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
    renderedCanvases.push(canvas);
  }

  return renderedCanvases;
}

/**
 * Draws a single video frame at time `t` onto the target canvas
 */
export function drawVideoFrameAtTime(
  targetCanvas: HTMLCanvasElement,
  slideCanvases: HTMLCanvasElement[],
  t: number,
  transition: VideoTransitionType,
  slideDuration: number,
  transitionDuration: number
): void {
  const ctx = targetCanvas.getContext('2d', { alpha: false });
  if (!ctx || slideCanvases.length === 0) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  // Single slide case
  if (slideCanvases.length === 1) {
    ctx.drawImage(slideCanvases[0], 0, 0, w, h);
    return;
  }

  const cycleDuration = slideDuration + transitionDuration;
  const totalSlides = slideCanvases.length;

  // Determine current slide index
  let currentIndex = Math.floor(t / cycleDuration);
  if (currentIndex >= totalSlides) {
    currentIndex = totalSlides - 1;
  }

  const timeInCycle = t - currentIndex * cycleDuration;
  const isTransitioning = timeInCycle >= slideDuration && currentIndex < totalSlides - 1;

  // Clear canvas background
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);

  if (!isTransitioning) {
    // Static hold with subtle cinematic Ken Burns drift
    const currentCanvas = slideCanvases[currentIndex];
    const holdProgress = timeInCycle / slideDuration;
    const scale = 1.0 + 0.025 * holdProgress;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    ctx.drawImage(currentCanvas, 0, 0, w, h);
    ctx.restore();
    return;
  }

  // Active transition between slide `currentIndex` and `currentIndex + 1`
  const nextIndex = currentIndex + 1;
  const currentCanvas = slideCanvases[currentIndex];
  const nextCanvas = slideCanvases[nextIndex];

  const rawP = Math.min(1, Math.max(0, (timeInCycle - slideDuration) / transitionDuration));
  const p = easeInOutCubic(rawP);

  switch (transition) {
    case 'slide-left': {
      // Current slide pushes left, next slide enters from right
      ctx.drawImage(currentCanvas, -w * p, 0, w, h);
      ctx.drawImage(nextCanvas, w * (1 - p), 0, w, h);
      // Subtle shadow between sliding slides
      ctx.fillStyle = `rgba(0,0,0,${(1 - p) * 0.35})`;
      ctx.fillRect(-w * p + w - 4, 0, 8, h);
      break;
    }

    case 'slide-up': {
      // Current slide pushes up, next slide enters from bottom
      ctx.drawImage(currentCanvas, 0, -h * p, w, h);
      ctx.drawImage(nextCanvas, 0, h * (1 - p), w, h);
      ctx.fillStyle = `rgba(0,0,0,${(1 - p) * 0.35})`;
      ctx.fillRect(0, -h * p + h - 4, w, 8);
      break;
    }

    case 'zoom': {
      // Ken burns dynamic zoom with cross-dissolve
      // Current slide zooms in and fades
      ctx.save();
      const scaleCurrent = 1.0 + 0.12 * p;
      ctx.translate(w / 2, h / 2);
      ctx.scale(scaleCurrent, scaleCurrent);
      ctx.translate(-w / 2, -h / 2);
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.drawImage(currentCanvas, 0, 0, w, h);
      ctx.restore();

      // Next slide scales down from 1.12 to 1.0 and fades in
      ctx.save();
      const scaleNext = 1.12 - 0.12 * (1 - p);
      ctx.translate(w / 2, h / 2);
      ctx.scale(scaleNext, scaleNext);
      ctx.translate(-w / 2, -h / 2);
      ctx.globalAlpha = Math.min(1, p);
      ctx.drawImage(nextCanvas, 0, 0, w, h);
      ctx.restore();
      break;
    }

    case 'wipe': {
      // Editorial wipe from left to right with divider line
      ctx.drawImage(currentCanvas, 0, 0, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w * p, h);
      ctx.clip();
      ctx.drawImage(nextCanvas, 0, 0, w, h);
      ctx.restore();

      // Clean glowing divider line at wipe boundary
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(w * p - 2, 0, 3, h);
      break;
    }

    case 'flash': {
      // High-energy white flash (beat transition)
      if (p < 0.5) {
        const flashP = p / 0.5;
        ctx.drawImage(currentCanvas, 0, 0, w, h);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashP * 0.95})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        const flashP = (1 - p) / 0.5;
        ctx.drawImage(nextCanvas, 0, 0, w, h);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashP * 0.95})`;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }

    case 'dip-black': {
      // Cinema dip to solid black
      if (p < 0.5) {
        const fadeP = 1 - p / 0.5;
        ctx.drawImage(currentCanvas, 0, 0, w, h);
        ctx.fillStyle = `rgba(10, 10, 12, ${1 - fadeP})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        const fadeP = (p - 0.5) / 0.5;
        ctx.drawImage(nextCanvas, 0, 0, w, h);
        ctx.fillStyle = `rgba(10, 10, 12, ${1 - fadeP})`;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }

    case 'fade':
    default: {
      // Pure crossfade
      ctx.drawImage(currentCanvas, 0, 0, w, h);
      ctx.globalAlpha = p;
      ctx.drawImage(nextCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    }
  }
}

/**
 * Calculates total video duration in seconds based on slide count and durations
 */
export function calculateTotalVideoDuration(
  slidesCount: number,
  slideDuration: number,
  transitionDuration: number
): number {
  if (slidesCount <= 1) return slideDuration;
  return slidesCount * slideDuration + (slidesCount - 1) * transitionDuration;
}

/**
 * Generates and records an animated video from slides with predefined transitions
 */
export async function generateVideoFromSlides(
  params: VideoRenderParams
): Promise<GeneratedVideoResult> {
  const {
    slides,
    aspectRatio,
    transition,
    slideDuration,
    transitionDuration,
    fps = 30,
    onProgress,
    previewCanvas,
  } = params;

  if (slides.length === 0) {
    throw new Error('Aucune diapositive à exporter.');
  }

  // Step 1: Pre-render all slide canvases at full resolution
  const slideCanvases = await preRenderAllSlideCanvases(params);

  // Step 2: Prepare recording canvas
  // Keep resolution standard (e.g. 1080p) for high visual quality & performance
  const recordWidth = aspectRatio.width;
  const recordHeight = aspectRatio.height;

  const recordCanvas = document.createElement('canvas');
  recordCanvas.width = recordWidth;
  recordCanvas.height = recordHeight;

  // Determine best supported video codec
  const supportedTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  const selectedMimeType =
    supportedTypes.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ||
    'video/webm';

  const isMp4 = selectedMimeType.includes('mp4');
  const fileExt = isMp4 ? 'mp4' : 'webm';
  const totalDuration = calculateTotalVideoDuration(slides.length, slideDuration, transitionDuration);
  const totalFrames = Math.ceil(totalDuration * fps);

  // Setup stream & recorder
  const stream = recordCanvas.captureStream(fps);

  // Add silent audio track for broad social platform compatibility
  const silentTrack = createSilentAudioTrack();
  if (silentTrack) {
    stream.addTrack(silentTrack);
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 8_500_000, // 8.5 Mbps for crisp HD
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start();

  // Draw initial frame
  drawVideoFrameAtTime(recordCanvas, slideCanvases, 0, transition, slideDuration, transitionDuration);
  if (previewCanvas) {
    const prevCtx = previewCanvas.getContext('2d');
    if (prevCtx) prevCtx.drawImage(recordCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
  }

  const frameIntervalMs = 1000 / fps;

  // Step 3: Frame by frame recording loop
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / fps;

    drawVideoFrameAtTime(
      recordCanvas,
      slideCanvases,
      currentTime,
      transition,
      slideDuration,
      transitionDuration
    );

    // Sync to preview canvas if provided
    if (previewCanvas) {
      const prevCtx = previewCanvas.getContext('2d');
      if (prevCtx) {
        prevCtx.drawImage(recordCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
    }

    if (onProgress && frame % 5 === 0) {
      const pct = Math.round(25 + (frame / totalFrames) * 70);
      onProgress(
        pct,
        `Enregistrement de la vidéo (${Math.round(currentTime)}s / ${Math.round(totalDuration)}s)...`
      );
    }

    // Wait frame duration to maintain real-time MediaRecorder capture synchronization
    await new Promise((resolve) => setTimeout(resolve, frameIntervalMs));
  }

  if (onProgress) {
    onProgress(97, 'Finalisation et encodage du fichier vidéo...');
  }

  // Step 4: Stop recorder and build blob
  const videoBlob: Blob = await new Promise((resolve, reject) => {
    recorder.onstop = () => {
      if (recordedChunks.length === 0) {
        reject(new Error('Aucune donnée vidéo enregistrée.'));
        return;
      }
      const blob = new Blob(recordedChunks, { type: selectedMimeType });
      resolve(blob);
    };

    recorder.onerror = (err) => reject(err);
    recorder.stop();
  });

  // Stop tracks
  stream.getTracks().forEach((track) => track.stop());

  const filename = `AutoPost_Video_${aspectRatio.id.replace(':', 'x')}_${transition}_${Date.now()}.${fileExt}`;
  const url = URL.createObjectURL(videoBlob);

  if (onProgress) {
    onProgress(100, 'Vidéo prête et enregistrée avec succès !');
  }

  return {
    blob: videoBlob,
    url,
    filename,
    durationSeconds: totalDuration,
    mimeType: selectedMimeType,
  };
}
