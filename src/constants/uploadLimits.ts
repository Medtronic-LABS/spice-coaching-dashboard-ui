/**
 * Upload caps aligned with coaching-platform (`admin_file_max_upload_bytes`,
 * `ingest_media_max_upload_bytes`, source-document thumbnail PUT).
 */
export const ADMIN_FILE_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const INGEST_MEDIA_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const THUMBNAIL_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ADMIN_FILE_MAX_UPLOAD_LABEL = 'Max 100 MB';
export const INGEST_MEDIA_MAX_UPLOAD_LABEL = 'Max 100 MB';
/** Source-document / milestone image PUT or client-side image pickers capped at 5 MB. */
export const THUMBNAIL_ACCEPT_SIZE_HINT = 'PNG, JPEG, or WebP · max 5 MB';
/** Images uploaded via POST /admin/files (module / knowledge custom thumbs, card media). */
export const ADMIN_IMAGE_ACCEPT_SIZE_HINT = 'PNG, JPEG, or WebP · max 100 MB';
export const CARD_MEDIA_ACCEPT_SIZE_HINT =
  'Images (jpg, png, webp) and videos (mp4, mov, mkv) · max 100 MB';
