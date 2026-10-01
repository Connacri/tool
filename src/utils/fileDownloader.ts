import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Converts a Blob to a base64 string safely
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier Blob'));
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads or shares a single Canvas as a high-definition PNG image.
 * Works seamlessly on:
 * 1. Android APK / Capacitor native runtime (writes to Filesystem & opens native Share Sheet / Save to Gallery)
 * 2. Mobile web browsers (Web Share API Level 2 or Blob download)
 * 3. Desktop browsers (direct file download)
 */
export async function exportCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<{ success: boolean; method: string; dataUrl?: string }> {
  const safeFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
  const dataUrl = canvas.toDataURL('image/png');

  // Case 1: Native Android APK or iOS App via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const savedFile = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: safeFilename,
        text: 'Visuel HD créé avec AutoPost Studio',
        url: savedFile.uri,
        dialogTitle: 'Enregistrer dans vos photos ou partager',
      });

      return { success: true, method: 'capacitor-native-share', dataUrl };
    } catch (err: any) {
      console.warn('Native Capacitor share failed, falling back to Web Share / Blob:', err);
    }
  }

  // Convert canvas to Blob for web handling
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  if (!blob) {
    // Pure dataUrl fallback
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'dataurl-download', dataUrl };
  }

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // Case 2: Mobile Web browser supporting Web Share Level 2 with files
  if (isMobile && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], safeFilename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: safeFilename,
          text: 'Visuel HD généré avec AutoPost Studio',
        });
        return { success: true, method: 'web-share-file', dataUrl };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        // User voluntarily dismissed the share sheet
        return { success: true, method: 'user-dismissed', dataUrl };
      }
      console.warn('Web Share failed, falling back to link download:', shareErr);
    }
  }

  // Case 3: Standard Browser Blob download
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return { success: true, method: 'blob-download', dataUrl };
  } catch {
    // Ultimate fallback: open in window or dataUrl
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'dataurl-download', dataUrl };
  }
}

/**
 * Downloads or shares a ZIP archive blob.
 * Works seamlessly on:
 * 1. Android APK / Capacitor native runtime (writes to Filesystem & opens native Share Sheet to Save to Files/Drive)
 * 2. Mobile web browsers (Web Share API Level 2 or Blob download)
 * 3. Desktop browsers (direct file download)
 */
export async function exportZipArchive(
  zipBlob: Blob,
  filename: string
): Promise<{ success: boolean; method: string }> {
  const safeFilename = filename.toLowerCase().endsWith('.zip') ? filename : `${filename}.zip`;

  // Case 1: Native Android APK or iOS App via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(zipBlob);
      const savedFile = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: safeFilename,
        text: 'Archive ZIP des visuels HD - AutoPost Studio',
        url: savedFile.uri,
        dialogTitle: 'Enregistrer le ZIP dans vos fichiers ou partager',
      });

      return { success: true, method: 'capacitor-native-share' };
    } catch (err: any) {
      console.warn('Native Capacitor ZIP share failed, falling back to Web Share / Blob:', err);
    }
  }

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // Case 2: Mobile Web browser supporting Web Share Level 2
  if (isMobile && typeof navigator.share === 'function') {
    try {
      const file = new File([zipBlob], safeFilename, { type: 'application/zip' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: safeFilename,
          text: 'Archive ZIP des visuels HD - AutoPost Studio',
        });
        return { success: true, method: 'web-share-file' };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return { success: true, method: 'user-dismissed' };
      }
      console.warn('Web Share for ZIP failed, falling back to link download:', shareErr);
    }
  }

  // Case 3: Standard Browser Blob download
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = safeFilename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  return { success: true, method: 'blob-download' };
}

/**
 * Downloads or shares a generated animated video file (MP4/WebM).
 * Works seamlessly across:
 * 1. Android APK native runtime via Capacitor
 * 2. Mobile web browsers via Web Share API
 * 3. Desktop browsers via standard Blob download
 */
export async function exportVideoBlob(
  videoBlob: Blob,
  filename: string,
  title: string = 'Vidéo Réseaux Sociaux - AutoPost Studio'
): Promise<{ success: boolean; method: string }> {
  const safeFilename = filename;

  // Case 1: Native Android APK or iOS App via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(videoBlob);
      const savedFile = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: safeFilename,
        text: title,
        url: savedFile.uri,
        dialogTitle: 'Enregistrer la vidéo ou partager sur vos réseaux',
      });

      return { success: true, method: 'capacitor-native-share' };
    } catch (err: any) {
      console.warn('Native Capacitor video share failed, falling back to Web Share / Blob:', err);
    }
  }

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // Case 2: Mobile Web browser supporting Web Share Level 2 with video files
  if (isMobile && typeof navigator.share === 'function') {
    try {
      const file = new File([videoBlob], safeFilename, { type: videoBlob.type || 'video/webm' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: safeFilename,
          text: title,
        });
        return { success: true, method: 'web-share-file' };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return { success: true, method: 'user-dismissed' };
      }
      console.warn('Web Share for video failed, falling back to link download:', shareErr);
    }
  }

  // Case 3: Standard Browser Blob download
  const blobUrl = URL.createObjectURL(videoBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = safeFilename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  return { success: true, method: 'blob-download' };
}

