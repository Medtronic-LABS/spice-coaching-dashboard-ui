import {
  readLegacySrcFromNodeAttrs,
  readObjectNameFromNodeAttrs,
} from '@/features/modules/utils/cardMediaNodeAttrs';
import { Fragment, Slice, type Node as PmNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export type CardMediaClipboardKind = 'image' | 'video';

const LIVE_MEDIA_QUERY: Record<
  CardMediaClipboardKind,
  { wrapper: string; element: 'img' | 'video' }
> = {
  image: { wrapper: '[data-card-image]', element: 'img' },
  video: { wrapper: '[data-card-video]', element: 'video' },
};

const NODE_NAME_TO_KIND: Record<string, CardMediaClipboardKind> = {
  image: 'image',
  cardVideo: 'video',
};

function escapeSelectorValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function usableMediaSrc(
  el: HTMLImageElement | HTMLVideoElement,
): string | null {
  const attr = el.getAttribute('src')?.trim() ?? '';
  if (attr) return el.currentSrc?.trim() || attr;
  const current = el.currentSrc?.trim();
  return current || null;
}

function queryLiveMedia(
  editorRoot: ParentNode,
  kind: CardMediaClipboardKind,
  attribute: 'data-object-name' | 'data-legacy-src',
  value: string,
): HTMLImageElement | HTMLVideoElement | null {
  const { wrapper, element } = LIVE_MEDIA_QUERY[kind];
  const found = editorRoot.querySelector(
    `${wrapper}[${attribute}="${escapeSelectorValue(value)}"] ${element}`,
  );
  if (found instanceof HTMLImageElement || found instanceof HTMLVideoElement) {
    return found;
  }
  return null;
}

/** Marks the live node view so copy can find the displayed media URL. */
export function cardMediaClipboardDomAttrs(
  objectName: string | null,
  legacySrc: string,
): { 'data-object-name'?: string; 'data-legacy-src'?: string } {
  if (objectName) return { 'data-object-name': objectName };
  if (legacySrc) return { 'data-legacy-src': legacySrc };
  return {};
}

/** Reads the displayed (usually presigned) media URL from the live node view. */
export function readLiveCardMediaSrc(
  editorRoot: ParentNode,
  attrs: Record<string, unknown>,
  kind: CardMediaClipboardKind,
): string | null {
  const objectName = readObjectNameFromNodeAttrs(attrs);
  if (objectName) {
    const el = queryLiveMedia(editorRoot, kind, 'data-object-name', objectName);
    const src = el ? usableMediaSrc(el) : null;
    if (src) return src;
  }

  const legacySrc = readLegacySrcFromNodeAttrs(attrs);
  if (legacySrc) {
    const el = queryLiveMedia(editorRoot, kind, 'data-legacy-src', legacySrc);
    const src = el ? usableMediaSrc(el) : null;
    if (src) return src;
  }

  return null;
}

function mapFragment(
  fragment: Fragment,
  mapper: (node: PmNode) => PmNode,
): Fragment {
  const mapped: PmNode[] = [];
  fragment.forEach((child) => {
    const withKids =
      child.childCount > 0
        ? child.copy(mapFragment(child.content, mapper))
        : child;
    mapped.push(mapper(withKids));
  });
  return Fragment.fromArray(mapped);
}

/** Puts live node-view media URLs onto a copied slice so paste targets get real src. */
export function sliceWithLiveCardMediaSrcs(
  slice: Slice,
  editorRoot: ParentNode,
): Slice {
  return new Slice(
    mapFragment(slice.content, (node) => {
      const kind = NODE_NAME_TO_KIND[node.type.name];
      if (!kind) return node;
      const liveSrc = readLiveCardMediaSrc(editorRoot, node.attrs, kind);
      if (!liveSrc || liveSrc === node.attrs.src) return node;
      return node.type.create(
        { ...node.attrs, src: liveSrc },
        node.content,
        node.marks,
      );
    }),
    slice.openStart,
    slice.openEnd,
  );
}

export const cardMediaClipboardPlugin = new Plugin({
  key: new PluginKey('cardMediaClipboard'),
  props: {
    transformCopied: (slice, view) =>
      sliceWithLiveCardMediaSrcs(slice, view.dom),
  },
});
