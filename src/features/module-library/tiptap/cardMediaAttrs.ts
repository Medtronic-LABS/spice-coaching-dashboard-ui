import { readObjectNameFromNodeAttrs } from '@/features/module-library/utils/cardMediaNodeAttrs';
import type { RichStoredFileAttrs } from '@/features/program-manager/types/programManager.types';
import type { JSONContent } from '@tiptap/core';

export interface CardMediaTiptapAttrs {
  src?: string | null;
  objectName?: string | null;
  contentType?: string | null;
  originalFilename?: string | null;
  alt?: string | null;
}

export function storedFileAttrsToTiptap(
  attrs: RichStoredFileAttrs & { caption?: string },
): CardMediaTiptapAttrs {
  const objectName = attrs.object_name?.trim() || null;
  return {
    src: attrs.url?.trim() || '',
    alt: attrs.caption ?? attrs.original_filename ?? '',
    objectName,
    contentType: attrs.content_type ?? null,
    originalFilename: attrs.original_filename ?? null,
  };
}

export function storedFileAttrsFromTiptap(
  attrs: CardMediaTiptapAttrs,
): RichStoredFileAttrs & { caption?: string } {
  const objectName =
    typeof attrs.objectName === 'string' && attrs.objectName.trim()
      ? attrs.objectName.trim()
      : undefined;

  if (objectName) {
    return {
      object_name: objectName,
      content_type:
        typeof attrs.contentType === 'string' ? attrs.contentType : undefined,
      original_filename:
        typeof attrs.originalFilename === 'string'
          ? attrs.originalFilename
          : undefined,
      caption:
        typeof attrs.alt === 'string' && attrs.alt.trim()
          ? attrs.alt.trim()
          : undefined,
    };
  }

  const src = typeof attrs.src === 'string' ? attrs.src.trim() : '';
  if (!src) {
    return {};
  }

  return {
    url: src,
    caption:
      typeof attrs.alt === 'string' && attrs.alt.trim()
        ? attrs.alt.trim()
        : undefined,
  };
}

export const cardMediaTiptapAttributeConfig = {
  objectName: {
    default: null,
    parseHTML: (element) => element.getAttribute('data-object-name'),
    renderHTML: (attributes) =>
      attributes.objectName
        ? { 'data-object-name': attributes.objectName }
        : {},
  },
  contentType: {
    default: null,
    parseHTML: (element) => element.getAttribute('data-content-type'),
    renderHTML: (attributes) =>
      attributes.contentType
        ? { 'data-content-type': attributes.contentType }
        : {},
  },
  originalFilename: {
    default: null,
    parseHTML: (element) => element.getAttribute('data-original-filename'),
    renderHTML: (attributes) =>
      attributes.originalFilename
        ? { 'data-original-filename': attributes.originalFilename }
        : {},
  },
};

export function readCardMediaTiptapAttrs(
  node: JSONContent,
): CardMediaTiptapAttrs {
  const raw = node.attrs ?? {};
  const objectName = readObjectNameFromNodeAttrs(raw);
  return {
    src: typeof raw.src === 'string' ? raw.src : '',
    objectName,
    contentType: typeof raw.contentType === 'string' ? raw.contentType : null,
    originalFilename:
      typeof raw.originalFilename === 'string'
        ? raw.originalFilename
        : typeof raw.original_filename === 'string'
          ? raw.original_filename
          : null,
    alt: typeof raw.alt === 'string' ? raw.alt : null,
  };
}
