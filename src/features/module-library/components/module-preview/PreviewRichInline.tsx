import type { ReactNode } from 'react';
import type {
  RichTextLeaf,
  RichTextMark,
} from '@/features/program-manager/types/programManager.types';

function applyMark(
  content: ReactNode,
  mark: RichTextMark,
  key: string,
): ReactNode {
  switch (mark.type) {
    case 'bold':
      return <strong key={key}>{content}</strong>;
    case 'italic':
      return <em key={key}>{content}</em>;
    case 'underline':
      return <u key={key}>{content}</u>;
    case 'strike':
      return <s key={key}>{content}</s>;
    case 'code':
      return (
        <code
          key={key}
          className="rounded bg-spice-bg-tint px-1 py-0.5 font-mono text-[0.9em]"
        >
          {content}
        </code>
      );
    case 'link':
      return (
        <a
          key={key}
          href={mark.attrs.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-spice-brand-primary underline"
        >
          {content}
        </a>
      );
    default:
      return content;
  }
}

function renderLeaf(leaf: RichTextLeaf, key: string): ReactNode {
  const marks = leaf.marks ?? [];
  let content: ReactNode = leaf.text;
  marks.forEach((mark, markIndex) => {
    content = applyMark(content, mark, `${key}-mark-${markIndex}`);
  });
  return <span key={key}>{content}</span>;
}

export interface PreviewRichInlineProps {
  content: RichTextLeaf[];
}

export const PreviewRichInline = ({ content }: PreviewRichInlineProps) => {
  if (!content.length) return null;
  return <>{content.map((leaf, index) => renderLeaf(leaf, `leaf-${index}`))}</>;
};

export function inlineHasVisibleText(content: RichTextLeaf[]): boolean {
  return content.some((leaf) => leaf.text.trim().length > 0);
}
