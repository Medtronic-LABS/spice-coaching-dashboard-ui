/** Thumbnail MIME types accepted by PUT .../thumbnail (PNG/JPEG/WebP, max 5 MB). */
export const VIDEO_THUMBNAIL_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/webp';

export const VIDEO_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED_THUMBNAIL_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

export function isAcceptedVideoThumbnailFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (ACCEPTED_THUMBNAIL_TYPES.has(type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp')
  );
}

export function formatVideoThumbnailRejectionError(file: File): string {
  if (!isAcceptedVideoThumbnailFile(file)) {
    return `"${file.name}" is not a supported thumbnail format. Use PNG, JPEG, or WebP.`;
  }
  if (file.size > VIDEO_THUMBNAIL_MAX_BYTES) {
    return `"${file.name}" exceeds the 5 MB thumbnail size limit.`;
  }
  return '';
}

export function titleFromVideoFilename(filename: string): string {
  const trimmed = filename.trim();
  const stem = trimmed.replace(/\.[^.]+$/, '').trim();
  return stem || trimmed || 'Untitled video';
}

/**
 * Capture the first decoded frame of a local video file as a JPEG File.
 * Returns null if the browser cannot decode the video.
 */
export function captureVideoFirstFrame(
  videoFile: File,
  options?: { maxWidth?: number; quality?: number },
): Promise<File | null> {
  const maxWidth = options?.maxWidth ?? 640;
  const quality = options?.quality ?? 0.85;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const fail = () => {
      cleanup();
      resolve(null);
    };

    video.onerror = fail;
    video.onloadeddata = () => {
      const seekTo =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(0.1, video.duration / 2)
          : 0;
      const capture = () => {
        try {
          const width = video.videoWidth || maxWidth;
          const height = video.videoHeight || Math.round((maxWidth * 9) / 16);
          if (!width || !height) {
            fail();
            return;
          }
          const scale = Math.min(1, maxWidth / width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            fail();
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (!blob) {
                resolve(null);
                return;
              }
              const stem = titleFromVideoFilename(videoFile.name);
              resolve(
                new File([blob], `${stem}-thumbnail.jpg`, {
                  type: 'image/jpeg',
                }),
              );
            },
            'image/jpeg',
            quality,
          );
        } catch {
          fail();
        }
      };

      if (seekTo <= 0) {
        capture();
        return;
      }
      video.onseeked = capture;
      try {
        video.currentTime = seekTo;
      } catch {
        capture();
      }
    };

    video.src = objectUrl;
  });
}
