import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Film,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Sliders,
  Layers,
  Clock,
  Zap,
  Eye,
  Check,
} from 'lucide-react';
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
import {
  PREDEFINED_TRANSITIONS,
  generateVideoFromSlides,
  preRenderAllSlideCanvases,
  drawVideoFrameAtTime,
  calculateTotalVideoDuration,
  GeneratedVideoResult,
} from '../utils/videoRenderer';
import { exportVideoBlob } from '../utils/fileDownloader';
import { adManager } from '../services/adService';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  aspectRatio: AspectRatioOption;
  typography: TypographyConfig;
  logo: LogoConfig;
  gradientBlur?: GradientBlurConfig;
  colorFilter?: ColorFilterConfig;
  overlayImage?: OverlayImageConfig;
  watermark?: WatermarkConfig;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  aspectRatio,
  typography,
  logo,
  gradientBlur,
  colorFilter,
  overlayImage,
  watermark,
}) => {
  // Video settings
  const [selectedTransition, setSelectedTransition] = useState<VideoTransitionType>('slide-left');
  const [slideDuration, setSlideDuration] = useState<number>(2.5); // seconds per slide
  const [transitionDuration, setTransitionDuration] = useState<number>(0.6); // seconds per transition
  const [fps, setFps] = useState<number>(30);

  // Live preview player states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [previewTime, setPreviewTime] = useState<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const slideCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const isPreRenderingRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number | null>(null);

  // Video recording / generation states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordingStatusText, setRecordingStatusText] = useState<string>('');
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalDuration = calculateTotalVideoDuration(slides.length, slideDuration, transitionDuration);

  // Pre-render slides on modal open or slide changes
  useEffect(() => {
    if (!isOpen || slides.length === 0) return;

    let isMounted = true;
    const loadCanvases = async () => {
      isPreRenderingRef.current = true;
      try {
        const canvases = await preRenderAllSlideCanvases({
          slides,
          aspectRatio,
          typography,
          logo,
          gradientBlur,
          colorFilter,
          overlayImage,
          watermark,
          transition: selectedTransition,
          slideDuration,
          transitionDuration,
        });

        if (isMounted) {
          slideCanvasesRef.current = canvases;
          setPreviewTime(0);
          lastTimestampRef.current = null;
        }
      } catch (e: any) {
        console.error('Erreur pré-rendu vidéo:', e);
      } finally {
        isPreRenderingRef.current = false;
      }
    };

    loadCanvases();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, slides, aspectRatio, typography, logo, gradientBlur, colorFilter, overlayImage, watermark]);

  // Live preview animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      if (isPlaying && slideCanvasesRef.current.length > 0) {
        const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
        setPreviewTime((prevTime) => {
          let nextTime = prevTime + deltaSec;
          if (nextTime >= totalDuration) {
            nextTime = 0; // Loop preview
          }
          drawVideoFrameAtTime(
            canvas,
            slideCanvasesRef.current,
            nextTime,
            selectedTransition,
            slideDuration,
            transitionDuration
          );
          return nextTime;
        });
      } else if (slideCanvasesRef.current.length > 0) {
        drawVideoFrameAtTime(
          canvas,
          slideCanvasesRef.current,
          previewTime,
          selectedTransition,
          slideDuration,
          transitionDuration
        );
      }

      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isPlaying, totalDuration, selectedTransition, slideDuration, transitionDuration, previewTime]);

  // Trigger video generation
  const handleStartGeneration = async () => {
    setIsRecording(true);
    setIsPlaying(false);
    setRecordingProgress(5);
    setRecordingStatusText('Préparation de l\'enregistrement vidéo...');
    setErrorMessage(null);
    setGeneratedVideo(null);

    adManager.triggerAd({
      actionTitle: `Export Vidéo (${selectedTransition})`,
      actionType: 'video_export',
      onAdCompleted: async () => {
        try {
          const result = await generateVideoFromSlides({
            slides,
            aspectRatio,
            typography,
            logo,
            gradientBlur,
            colorFilter,
            overlayImage,
            watermark,
            transition: selectedTransition,
            slideDuration,
            transitionDuration,
            fps,
            onProgress: (pct, text) => {
              setRecordingProgress(pct);
              setRecordingStatusText(text);
            },
            previewCanvas: previewCanvasRef.current,
          });

          setGeneratedVideo(result);

          // Automatically trigger download or share
          await exportVideoBlob(
            result.blob,
            result.filename,
            `Vidéo ${aspectRatio.label} (${selectedTransition}) - AutoPost Studio`
          );
        } catch (err: any) {
          console.error('Erreur génération vidéo:', err);
          setErrorMessage(err.message || 'Impossible de générer la vidéo');
        } finally {
          setIsRecording(false);
        }
      },
    });
  };

  const handleDownloadGenerated = async () => {
    if (!generatedVideo) return;
    await exportVideoBlob(
      generatedVideo.blob,
      generatedVideo.filename,
      `Vidéo ${aspectRatio.label} - AutoPost Studio`
    );
  };

  if (!isOpen) return null;

  // Aspect ratio canvas style
  const isPortrait = aspectRatio.height > aspectRatio.width;
  const canvasWidth = isPortrait ? 270 : 360;
  const canvasHeight = isPortrait ? Math.round(270 * (aspectRatio.height / aspectRatio.width)) : Math.round(360 * (aspectRatio.height / aspectRatio.width));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <span>Générateur Vidéo & Transitions</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Reels · TikTok · Shorts
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Transformez vos {slides.length} diapositives en vidéo animée fluide HD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Canvas Preview Player */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <div className="relative rounded-lg overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950 max-h-[380px] flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={aspectRatio.width}
                height={aspectRatio.height}
                style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                  maxHeight: '360px',
                  objectFit: 'contain',
                }}
                className="rounded-lg"
              />

              {/* Player Overlay controls on hover */}
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-neutral-950/80 backdrop-blur-md border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isRecording}
                  className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${(previewTime / totalDuration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono tabular-nums">
                    <span>{previewTime.toFixed(1)}s</span>
                    <span>{totalDuration.toFixed(1)}s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewTime(0)}
                  disabled={isRecording}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                  title="Recommencer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 mt-3 text-center">
              Aperçu en temps réel : {totalDuration.toFixed(1)}s totales · Format {aspectRatio.label} ({aspectRatio.width}x{aspectRatio.height})
            </p>
          </div>

          {/* Right Column: Predefined Transitions & Settings */}
          <div className="lg:col-span-6 space-y-5">
            {/* Transition selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Transition Prédéfinie</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-0.5">
                {PREDEFINED_TRANSITIONS.map((trans) => {
                  const isSelected = selectedTransition === trans.id;
                  return (
                    <button
                      key={trans.id}
                      type="button"
                      onClick={() => setSelectedTransition(trans.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{trans.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                        {trans.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timing & Rhythm Settings */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rythme & Durées</span>
              </span>

              {/* Slide duration */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Affichage par diapo :</span>
                  <span className="font-mono text-white font-semibold">{slideDuration.toFixed(1)} s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>1.0s (Rapide)</span>
                  <span>2.5s (Recommandé)</span>
                  <span>5.0s (Posé)</span>
                </div>
              </div>

              {/* Transition duration */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Vitesse de transition :</span>
                  <span className="font-mono text-white font-semibold">{transitionDuration.toFixed(1)} s</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.2"
                  step="0.1"
                  value={transitionDuration}
                  onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>0.3s (Net)</span>
                  <span>0.6s (Standard)</span>
                  <span>1.2s (Doux)</span>
                </div>
              </div>
            </div>

            {/* Progress / Status during generation */}
            {isRecording && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span>{recordingStatusText}</span>
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{recordingProgress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success state */}
            {generatedVideo && !isRecording && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Vidéo générée avec succès ({generatedVideo.durationSeconds.toFixed(1)}s) !</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadGenerated}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger la Vidéo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGenerated}
                    className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-neutral-700"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>Partager / Enregistrer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error state */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Action button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isRecording}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50"
            >
              <Film className="w-4 h-4 text-amber-300" />
              <span>
                {isRecording
                  ? 'Génération de la vidéo en cours...'
                  : `Générer et Exporter la Vidéo HD (${slides.length} diapos)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
