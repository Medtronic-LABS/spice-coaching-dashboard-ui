import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { cardMediaTiptapAttributeConfig } from '@/features/modules/tiptap/cardMediaAttrs';
import { RichTextMediaNodeHeader } from '@/features/modules/tiptap/RichTextMediaNodeHeader';
import {
  mediaFilenameFromNodeAttrs,
  readLegacySrcFromNodeAttrs,
  readObjectNameFromNodeAttrs,
} from '@/features/modules/utils/cardMediaNodeAttrs';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cardVideo: {
      setCardVideo: (options: {
        objectName: string;
        contentType?: string;
        originalFilename?: string;
      }) => ReturnType;
    };
  }
}

function CardVideoNodeView({
  node,
  selected,
  deleteNode,
  editor,
}: NodeViewProps) {
  const attrs = node.attrs as Record<string, unknown>;
  const objectName = readObjectNameFromNodeAttrs(attrs);
  const legacySrc = readLegacySrcFromNodeAttrs(attrs);
  const label = mediaFilenameFromNodeAttrs(attrs, 'Video');
  const editable = editor.isEditable;
  const { url, isLoading, isError } = usePresignedFileUrl(objectName, {
    legacyUrl: legacySrc || undefined,
  });

  const cardClassName = `my-2 rounded-lg border border-spice-border bg-spice-bg-tint p-2 ${selected ? 'ring-2 ring-spice-brand-primary' : ''} ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`;

  return (
    <NodeViewWrapper
      as="div"
      className={cardClassName}
      data-card-video=""
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
          Could not load video.
        </div>
      ) : null}
      {url ? (
        <video
          src={url}
          controls
          className="max-h-48 w-full rounded-md"
          draggable={false}
          onMouseDown={(event) => event.stopPropagation()}
        />
      ) : null}
      {!url && !isLoading && !objectName && !legacySrc ? (
        <div className="py-2 text-center text-xs text-spice-text-muted">
          Video unavailable
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

export const CardVideoExtension = Node.create({
  name: 'cardVideo',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      ...cardMediaTiptapAttributeConfig,
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-card-video]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-card-video': '' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CardVideoNodeView);
  },
  addCommands() {
    return {
      setCardVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: '',
              objectName: options.objectName,
              contentType: options.contentType ?? null,
              originalFilename: options.originalFilename ?? null,
            },
          }),
    };
  },
});
