export const CARD_IMAGE_FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export const CARD_VIDEO_FILE_ACCEPT =
  'video/mp4,video/quicktime,video/x-matroska,.mp4,.mov,.mkv';

export function cardMediaAcceptAttribute(): string {
  return `${CARD_IMAGE_FILE_ACCEPT},${CARD_VIDEO_FILE_ACCEPT}`;
}

export function isCardImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
}

export function isCardVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const name = file.name.toLowerCase();
  return /\.(mp4|mov|mkv)$/.test(name);
}

export function cardMediaKindFromFile(file: File): 'image' | 'video' | null {
  if (isCardImageFile(file)) return 'image';
  if (isCardVideoFile(file)) return 'video';
  return null;
}
