import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { cardMediaTiptapAttributeConfig } from '@/features/modules/tiptap/cardMediaAttrs';
import { RichTextMediaNodeHeader } from '@/features/modules/tiptap/RichTextMediaNodeHeader';
import {
  initialDisplayDimensions,
  readImageDisplayDimensions,
  resizeDimensionsByWidth,
} from '@/features/modules/utils/cardImageDimensions';
import {
  mediaFilenameFromNodeAttrs,
  readLegacySrcFromNodeAttrs,
  readObjectNameFromNodeAttrs,
} from '@/features/modules/utils/cardMediaNodeAttrs';
import Image from '@tiptap/extension-image';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const RESIZE_CORNERS: ResizeCorner[] = ['nw', 'ne', 'sw', 'se'];

function cornerHandleClass(corner: ResizeCorner): string {
  const base = 'absolute z-10 h-4 w-4 bg-transparent';
  switch (corner) {
    case 'nw':
      return `${base} left-0 top-0 cursor-nw-resize`;
    case 'ne':
      return `${base} right-0 top-0 cursor-ne-resize`;
    case 'sw':
      return `${base} bottom-0 left-0 cursor-sw-resize`;
    case 'se':
      return `${base} bottom-0 right-0 cursor-se-resize`;
  }
}

function nextWidthForCorner(
  corner: ResizeCorner,
  startWidth: number,
  deltaX: number,
): number {
  switch (corner) {
    case 'se':
    case 'ne':
      return startWidth + deltaX;
    case 'sw':
    case 'nw':
      return startWidth - deltaX;
  }
}

function CardImageNodeView({
  node,
  selected,
  deleteNode,
  editor,
  updateAttributes,
}: NodeViewProps) {
  const attrs = node.attrs as Record<string, unknown>;
  const objectName = readObjectNameFromNodeAttrs(attrs);
  const legacySrc = readLegacySrcFromNodeAttrs(attrs);
  const label = mediaFilenameFromNodeAttrs(attrs, 'Image');
  const editable = editor.isEditable;
  const displayDimensions = readImageDisplayDimensions(attrs);
  const resizeStateRef = useRef<{
    corner: ResizeCorner;
    startX: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const { url, isLoading, isError } = usePresignedFileUrl(objectName, {
    legacyUrl: legacySrc || undefined,
  });

  const applyDimensions = useCallback(
    (width: number, height: number) => {
      updateAttributes({ width, height });
    },
    [updateAttributes],
  );

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (displayDimensions.width && displayDimensions.height) return;

    const img = event.currentTarget;
    const next = initialDisplayDimensions(img.naturalWidth, img.naturalHeight);
    applyDimensions(next.width, next.height);
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    corner: ResizeCorner,
  ) => {
    if (!editable || !displayDimensions.width || !displayDimensions.height) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      corner,
      startX: event.clientX,
      startWidth: displayDimensions.width,
      startHeight: displayDimensions.height,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;

      const deltaX = moveEvent.clientX - state.startX;
      const next = resizeDimensionsByWidth(
        state.startWidth,
        state.startHeight,
        nextWidthForCorner(state.corner, state.startWidth, deltaX),
      );
      applyDimensions(next.width, next.height);
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const frameStyle =
    displayDimensions.width && displayDimensions.height
      ? {
          width: `${displayDimensions.width}px`,
          height: `${displayDimensions.height}px`,
        }
      : undefined;

  const frameClassName = [
    'relative shrink-0 overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint',
    editable && selected && displayDimensions.width
      ? 'ring-2 ring-spice-brand-primary'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const imageClassName =
    displayDimensions.width && displayDimensions.height
      ? 'block h-full w-full object-contain'
      : 'block max-h-64 max-w-full object-contain';

  return (
    <NodeViewWrapper
      as="div"
      className={`my-2 inline-block w-fit max-w-full ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      data-card-image=""
      contentEditable={false}
      {...(editable ? { 'data-drag-handle': '' } : {})}
    >
      {!url || isError ? (
        <div className="rounded-md border border-spice-border bg-spice-bg-tint p-2">
          <RichTextMediaNodeHeader
            label={label}
            title={label}
            showLabel
            onRemove={editable ? deleteNode : undefined}
          />
        </div>
      ) : null}
      {isError ? (
        <div className="mt-1 text-xs text-spice-semantic-error">
          Could not load image.
        </div>
      ) : null}
      {url ? (
        <div className="flex items-start gap-2">
          <div className={frameClassName} style={frameStyle}>
            <img
              src={url}
              alt={label}
              className={imageClassName}
              draggable={false}
              onLoad={handleImageLoad}
            />
            {editable && selected && displayDimensions.width
              ? RESIZE_CORNERS.map((corner) => (
                  <button
                    key={corner}
                    type="button"
                    aria-label={`Resize image from ${corner} corner`}
                    className={cornerHandleClass(corner)}
                    onPointerDown={(event) =>
                      handleResizePointerDown(event, corner)
                    }
                  />
                ))
              : null}
          </div>
          {/* {editable ? (
            <button
              type="button"
              className="shrink-0 pt-0.5 text-[11px] font-semibold text-spice-semantic-error hover:underline"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={deleteNode}
            >
              Remove
            </button>
          ) : null} */}
        </div>
      ) : null}
      {!url && !isLoading && !objectName && !legacySrc ? (
        <div className="text-xs text-spice-text-muted">Image unavailable</div>
      ) : null}
    </NodeViewWrapper>
  );
}

export const CardImageExtension = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cardMediaTiptapAttributeConfig,
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CardImageNodeView);
  },
});
