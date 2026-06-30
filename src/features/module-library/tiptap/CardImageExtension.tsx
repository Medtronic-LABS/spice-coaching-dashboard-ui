import Image from '@tiptap/extension-image';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { usePresignedFileUrl } from '@/features/module-library/hooks/usePresignedFileUrl';
import { cardMediaTiptapAttributeConfig } from '@/features/module-library/tiptap/cardMediaAttrs';
import { RichTextMediaNodeHeader } from '@/features/module-library/tiptap/RichTextMediaNodeHeader';
import {
  mediaFilenameFromNodeAttrs,
  readLegacySrcFromNodeAttrs,
  readObjectNameFromNodeAttrs,
} from '@/features/module-library/utils/cardMediaNodeAttrs';

function CardImageNodeView({
  node,
  selected,
  deleteNode,
  editor,
}: NodeViewProps) {
  const attrs = node.attrs as Record<string, unknown>;
  const objectName = readObjectNameFromNodeAttrs(attrs);
  const legacySrc = readLegacySrcFromNodeAttrs(attrs);
  const label = mediaFilenameFromNodeAttrs(attrs, 'Image');
  const editable = editor.isEditable;
  const { url, isLoading, isError } = usePresignedFileUrl(objectName, {
    legacyUrl: legacySrc || undefined,
  });

  const cardClassName = `my-2 rounded-lg border border-spice-border bg-spice-bg-tint p-2 ${selected ? 'ring-2 ring-spice-brand-primary' : ''} ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`;

  return (
    <NodeViewWrapper
      as="div"
      className={cardClassName}
      data-card-image=""
      contentEditable={false}
      {...(editable ? { 'data-drag-handle': '' } : {})}
    >
      {!url || editable || isError ? (
        <RichTextMediaNodeHeader
          label={label}
          title={label}
          showLabel={!url}
          onRemove={editable ? deleteNode : undefined}
        />
      ) : null}
      {isError ? (
        <div className="py-2 text-center text-xs text-spice-semantic-error">
          Could not load image.
        </div>
      ) : null}
      {url ? (
        <img
          src={url}
          alt={label}
          className="max-h-64 max-w-full rounded-md object-contain"
          draggable={false}
        />
      ) : null}
      {!url && !isLoading && !objectName && !legacySrc ? (
        <div className="py-2 text-center text-xs text-spice-text-muted">
          Image unavailable
        </div>
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
