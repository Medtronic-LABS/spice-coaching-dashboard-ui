import type { ReactNode } from 'react';
import type {
  RichBlock,
  RichListBlock,
  RichListItem,
} from '@/features/program-manager/types/programManager.types';
import { PreviewAudioBlock } from '@/features/module-library/components/module-preview/PreviewAudioBlock';
import { PreviewImageBlock } from '@/features/module-library/components/module-preview/PreviewImageBlock';
import {
  inlineHasVisibleText,
  PreviewRichInline,
} from '@/features/module-library/components/module-preview/PreviewRichInline';
import { PreviewVideoBlock } from '@/features/module-library/components/module-preview/PreviewVideoBlock';
import { cn } from '@/utils';

export interface LearnerRichCardBodyProps {
  blocks: RichBlock[];
  className?: string;
}

function unorderedMarker(depth: number): string {
  switch (depth % 3) {
    case 0:
      return '•';
    case 1:
      return '◦';
    default:
      return '▪';
  }
}

function headingClassName(level: number): string {
  switch (level) {
    case 1:
      return 'my-3 text-lg font-bold text-spice-text-primary';
    case 2:
      return 'my-3 text-base font-bold text-spice-text-primary';
    case 3:
      return 'my-2 text-sm font-bold text-spice-text-primary';
    case 4:
      return 'my-2 text-sm font-semibold text-spice-text-primary';
    case 5:
      return 'my-2 text-sm font-semibold text-spice-text-primary';
    default:
      return 'my-2 text-sm font-semibold text-spice-text-primary';
  }
}

function renderListItemBlocks(
  item: RichListItem,
  key: string,
  listDepth: number,
): ReactNode {
  return item.content.map((entry, index) =>
    renderBlock(entry, `${key}-content-${index}`, {
      insideList: true,
      listDepth,
    }),
  );
}

function renderList(
  block: RichListBlock,
  key: string,
  listDepth = 0,
): ReactNode {
  const start = block.start ?? 1;

  return (
    <div
      key={key}
      className={cn(listDepth === 0 ? 'my-2 space-y-1.5' : 'space-y-1.5')}
    >
      {block.items.map((item, index) => {
        const marker =
          block.type === 'ordered_list'
            ? `${start + index}.`
            : unorderedMarker(listDepth);

        return (
          <div key={`${key}-item-${index}`} className="flex items-start gap-1">
            <span
              aria-hidden
              className="w-5 shrink-0 text-sm font-normal leading-relaxed text-spice-text-primary"
            >
              {marker}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              {renderListItemBlocks(
                item,
                `${key}-item-${index}`,
                listDepth + 1,
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RenderBlockContext {
  insideList?: boolean;
  listDepth?: number;
}

function renderBlock(
  block: RichBlock,
  key: string,
  context: RenderBlockContext = {},
): ReactNode {
  const { insideList = false, listDepth = 0 } = context;

  switch (block.type) {
    case 'paragraph': {
      if (!inlineHasVisibleText(block.content)) return null;
      return (
        <p
          key={key}
          className={cn(
            'whitespace-pre-line text-sm leading-relaxed text-spice-text-primary',
            insideList ? 'my-0' : 'my-2',
          )}
        >
          <PreviewRichInline content={block.content} />
        </p>
      );
    }
    case 'heading': {
      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
      if (!inlineHasVisibleText(block.content)) return null;
      return (
        <HeadingTag key={key} className={headingClassName(block.level)}>
          <PreviewRichInline content={block.content} />
        </HeadingTag>
      );
    }
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="my-3 rounded-md bg-spice-bg-tint px-3 py-2 text-spice-text-medium"
        >
          {block.content.map((child, index) =>
            renderBlock(child, `${key}-child-${index}`, context),
          )}
        </blockquote>
      );
    case 'code_block':
      return (
        <pre
          key={key}
          className="my-3 overflow-x-auto rounded-lg bg-spice-bg-tint p-3 text-xs"
        >
          <code>{block.text}</code>
        </pre>
      );
    case 'horizontal_rule':
      return <hr key={key} className="my-4 border-spice-border" />;
    case 'bullet_list':
    case 'ordered_list':
      return renderList(block, key, listDepth);
    case 'image':
      return <PreviewImageBlock key={key} attrs={block.attrs} />;
    case 'video':
      return <PreviewVideoBlock key={key} attrs={block.attrs} />;
    case 'audio':
      return <PreviewAudioBlock key={key} attrs={block.attrs} />;
    default:
      return null;
  }
}

export const LearnerRichCardBody = ({
  blocks,
  className,
}: LearnerRichCardBodyProps) => {
  if (!blocks.length) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {blocks.map((block, index) => renderBlock(block, `block-${index}`))}
    </div>
  );
};
