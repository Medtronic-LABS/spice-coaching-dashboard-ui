import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import { hasStoredFileReference } from '@/features/module-library/utils/uploadedFileUrl';
import type {
  RichBlock,
  RichListBlock,
  RichListItem,
  RichListItemContent,
  RichHeadingBlock,
  RichBlockquoteBlock,
  RichCodeBlock,
  RichHorizontalRuleBlock,
  RichParagraphBlock,
  RichTextLeaf,
  RichTextMark,
} from '@/features/program-manager/types/programManager.types';
import { blocksToPlainText } from '@/features/program-manager/utils/richText';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function paragraphFromText(text: string): RichParagraphBlock {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

function normalizeMarks(value: unknown): RichTextMark[] {
  if (!Array.isArray(value)) return [];
  const marks: RichTextMark[] = [];
  for (const mark of value) {
    if (!isPlainObject(mark) || typeof mark.type !== 'string') continue;
    if (mark.type === 'bold') {
      marks.push({ type: 'bold' });
      continue;
    }
    if (mark.type === 'italic') {
      marks.push({ type: 'italic' });
      continue;
    }
    if (mark.type === 'underline') {
      marks.push({ type: 'underline' });
      continue;
    }
    if (mark.type === 'strike') {
      marks.push({ type: 'strike' });
      continue;
    }
    if (mark.type === 'code') {
      marks.push({ type: 'code' });
      continue;
    }
    if (mark.type === 'link' && isPlainObject(mark.attrs)) {
      const href = mark.attrs.href;
      if (typeof href === 'string' && href.trim()) {
        marks.push({ type: 'link', attrs: { href: href.trim() } });
      }
    }
  }
  return marks;
}

function normalizeTextLeaf(value: unknown): RichTextLeaf | null {
  if (!isPlainObject(value)) return null;
  const text = typeof value.text === 'string' ? value.text : '';
  const marks = normalizeMarks(value.marks);
  return {
    type: 'text',
    text,
    ...(marks.length ? { marks } : {}),
  };
}

function normalizeRichBlock(value: unknown): RichBlock | null {
  if (!isPlainObject(value) || typeof value.type !== 'string') return null;

  if (value.type === 'paragraph') {
    const rawContent = value.content;
    const content = Array.isArray(rawContent)
      ? rawContent
          .map(normalizeTextLeaf)
          .filter((leaf): leaf is RichTextLeaf => leaf !== null)
      : [];
    return {
      type: 'paragraph',
      content: content.length ? content : [{ type: 'text', text: '' }],
    };
  }

  if (value.type === 'heading') {
    const level =
      value.level === 1 ||
      value.level === 2 ||
      value.level === 3 ||
      value.level === 4 ||
      value.level === 5 ||
      value.level === 6
        ? value.level
        : 2;
    const rawContent = value.content;
    const content = Array.isArray(rawContent)
      ? rawContent
          .map(normalizeTextLeaf)
          .filter((leaf): leaf is RichTextLeaf => leaf !== null)
      : [];
    const block: RichHeadingBlock = {
      type: 'heading',
      level,
      content: content.length ? content : [{ type: 'text', text: '' }],
    };
    return block;
  }

  if (value.type === 'blockquote') {
    const content = Array.isArray(value.content)
      ? value.content
          .map(normalizeRichBlock)
          .filter((block): block is RichBlock => block !== null)
      : [];
    const block: RichBlockquoteBlock = {
      type: 'blockquote',
      content: content.length ? content : [paragraphFromText('')],
    };
    return block;
  }

  if (value.type === 'code_block') {
    const text = typeof value.text === 'string' ? value.text : '';
    const block: RichCodeBlock = { type: 'code_block', text };
    return block;
  }

  if (value.type === 'horizontal_rule') {
    const block: RichHorizontalRuleBlock = { type: 'horizontal_rule' };
    return block;
  }

  if (value.type === 'bullet_list' || value.type === 'ordered_list') {
    const items = Array.isArray(value.items)
      ? value.items
          .map(normalizeListItem)
          .filter((item): item is RichListItem => item !== null)
      : [];
    return { type: value.type, items };
  }

  if (value.type === 'image' && isPlainObject(value.attrs)) {
    const attrs = {
      object_name:
        typeof value.attrs.object_name === 'string'
          ? value.attrs.object_name.trim()
          : undefined,
      content_type:
        typeof value.attrs.content_type === 'string'
          ? value.attrs.content_type
          : undefined,
      original_filename:
        typeof value.attrs.original_filename === 'string'
          ? value.attrs.original_filename
          : undefined,
      url:
        typeof value.attrs.url === 'string'
          ? value.attrs.url.trim()
          : undefined,
      caption:
        typeof value.attrs.caption === 'string'
          ? value.attrs.caption
          : undefined,
    };
    if (!hasStoredFileReference(attrs)) return null;
    return { type: 'image', attrs };
  }

  if (value.type === 'audio' && isPlainObject(value.attrs)) {
    const url = value.attrs.url;
    if (typeof url !== 'string' || !url.trim()) return null;
    return {
      type: 'audio',
      attrs: {
        url: url.trim(),
        title:
          typeof value.attrs.title === 'string' ? value.attrs.title : undefined,
        duration:
          typeof value.attrs.duration === 'number'
            ? value.attrs.duration
            : undefined,
      },
    };
  }

  if (value.type === 'video' && isPlainObject(value.attrs)) {
    const attrs = {
      object_name:
        typeof value.attrs.object_name === 'string'
          ? value.attrs.object_name.trim()
          : undefined,
      content_type:
        typeof value.attrs.content_type === 'string'
          ? value.attrs.content_type
          : undefined,
      original_filename:
        typeof value.attrs.original_filename === 'string'
          ? value.attrs.original_filename
          : undefined,
      url:
        typeof value.attrs.url === 'string'
          ? value.attrs.url.trim()
          : undefined,
      thumbnail:
        typeof value.attrs.thumbnail === 'string'
          ? value.attrs.thumbnail
          : undefined,
    };
    if (!hasStoredFileReference(attrs)) return null;
    return { type: 'video', attrs };
  }

  return null;
}

function isTextLeafArray(value: unknown[]): boolean {
  return (
    value.length > 0 &&
    value.every(
      (entry) =>
        isPlainObject(entry) &&
        entry.type === 'text' &&
        typeof entry.text === 'string',
    )
  );
}

function normalizeListItemContent(value: unknown): RichListItemContent | null {
  const entry = normalizeRichBlock(value);
  if (
    entry?.type === 'paragraph' ||
    entry?.type === 'heading' ||
    entry?.type === 'blockquote' ||
    entry?.type === 'code_block' ||
    entry?.type === 'horizontal_rule' ||
    entry?.type === 'bullet_list' ||
    entry?.type === 'ordered_list' ||
    entry?.type === 'image' ||
    entry?.type === 'video' ||
    entry?.type === 'audio'
  ) {
    return entry;
  }
  return null;
}

function normalizeListItem(value: unknown): RichListItem | null {
  if (typeof value === 'string') {
    return {
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: value }] },
      ],
    };
  }
  if (!isPlainObject(value)) return null;

  const legacyBlocks = value.blocks;
  const rawContent = value.content;
  const contentSource = Array.isArray(rawContent)
    ? rawContent
    : Array.isArray(legacyBlocks)
      ? legacyBlocks
      : null;

  if (contentSource) {
    if (isTextLeafArray(contentSource)) {
      const leaves = contentSource
        .map(normalizeTextLeaf)
        .filter((leaf): leaf is RichTextLeaf => leaf !== null);
      const content: RichListItemContent[] = [
        {
          type: 'paragraph',
          content: leaves.length ? leaves : [{ type: 'text', text: '' }],
        },
      ];
      if (
        isPlainObject(value.nested) &&
        typeof value.nested.type === 'string'
      ) {
        const nested = normalizeRichBlock(value.nested);
        if (nested?.type === 'bullet_list' || nested?.type === 'ordered_list') {
          content.push(nested);
        }
      }
      return { content };
    }

    const content = contentSource
      .map(normalizeListItemContent)
      .filter((entry): entry is RichListItemContent => entry !== null);
    if (content.length) return { content };
  }

  const content: RichListItemContent[] = [];

  if (isPlainObject(value.nested) && typeof value.nested.type === 'string') {
    const nested = normalizeRichBlock(value.nested);
    if (nested?.type === 'bullet_list' || nested?.type === 'ordered_list') {
      content.push(nested);
    }
  }

  if (!content.length) return null;
  return { content };
}

function listItemContentHasVisibleContent(entry: RichListItemContent): boolean {
  if (entry.type === 'paragraph') {
    return entry.content.some((leaf) => leaf.text.trim().length > 0);
  }
  if (entry.type === 'heading') {
    return entry.content.some((leaf) => leaf.text.trim().length > 0);
  }
  if (entry.type === 'blockquote') {
    return entry.content.some((block) => blockHasVisibleContent(block));
  }
  if (entry.type === 'code_block') {
    return entry.text.trim().length > 0;
  }
  if (entry.type === 'horizontal_rule') {
    return true;
  }
  if (entry.type === 'bullet_list' || entry.type === 'ordered_list') {
    return listBlockHasVisibleContent(entry);
  }
  if (entry.type === 'image' || entry.type === 'video') {
    return hasStoredFileReference(entry.attrs);
  }
  if (entry.type === 'audio') {
    return Boolean(entry.attrs.url?.trim());
  }
  return false;
}

function listItemHasVisibleContent(item: RichListItem): boolean {
  return item.content.some((entry) => listItemContentHasVisibleContent(entry));
}

function listBlockHasVisibleContent(block: RichListBlock): boolean {
  return block.items.some((item) => listItemHasVisibleContent(item));
}

export function normalizeCardBody(value: unknown): RichBlock[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [paragraphFromText(trimmed)] : [paragraphFromText('')];
  }
  if (Array.isArray(value)) {
    const blocks = value
      .map(normalizeRichBlock)
      .filter((block): block is RichBlock => block !== null);
    return blocks.length ? blocks : [paragraphFromText('')];
  }
  return [paragraphFromText('')];
}

export function normalizeAdminModuleCard(
  card: unknown,
  index?: number,
): AdminModuleCard {
  if (!isPlainObject(card)) {
    return {
      id: typeof index === 'number' ? `card-${index}` : 'unknown',
      title_bn: null,
      body_bn: [paragraphFromText('')],
    };
  }

  const id =
    (typeof card.id === 'string' && card.id && card.id !== 'unknown'
      ? card.id
      : null) ||
    (typeof card.card_family_id === 'string' && card.card_family_id) ||
    (typeof card.card_order === 'number'
      ? `card-order-${card.card_order}`
      : null) ||
    (typeof index === 'number' ? `card-${index}` : 'unknown');

  return {
    id,
    card_family_id:
      typeof card.card_family_id === 'string' ? card.card_family_id : undefined,
    card_order:
      typeof card.card_order === 'number' ? card.card_order : undefined,
    title_bn: typeof card.title_bn === 'string' ? card.title_bn : null,
    title_en:
      typeof card.title_en === 'string'
        ? card.title_en
        : typeof card.title === 'string'
          ? card.title
          : null,
    title: typeof card.title === 'string' ? card.title : null,
    body_bn: normalizeCardBody(card.body_bn),
    body_en:
      card.body_en === undefined || card.body_en === null
        ? null
        : normalizeCardBody(card.body_en),
    previous_practice_bn:
      typeof card.previous_practice_bn === 'string'
        ? card.previous_practice_bn
        : null,
    current_practice_bn:
      typeof card.current_practice_bn === 'string'
        ? card.current_practice_bn
        : null,
    previous_practice_en:
      typeof card.previous_practice_en === 'string'
        ? card.previous_practice_en
        : null,
    current_practice_en:
      typeof card.current_practice_en === 'string'
        ? card.current_practice_en
        : null,
  };
}

function blockHasVisibleContent(block: RichBlock): boolean {
  if (block.type === 'paragraph') {
    return block.content.some((leaf) => leaf.text.trim().length > 0);
  }
  if (block.type === 'heading') {
    return block.content.some((leaf) => leaf.text.trim().length > 0);
  }
  if (block.type === 'blockquote') {
    return block.content.some((child) => blockHasVisibleContent(child));
  }
  if (block.type === 'code_block') {
    return block.text.trim().length > 0;
  }
  if (block.type === 'horizontal_rule') {
    return true;
  }
  if (block.type === 'bullet_list' || block.type === 'ordered_list') {
    return listBlockHasVisibleContent(block);
  }
  if (block.type === 'image' || block.type === 'video') {
    return hasStoredFileReference(block.attrs);
  }
  if (block.type === 'audio') {
    return Boolean(block.attrs.url?.trim());
  }
  return false;
}

export function cardBodyHasVisibleContent(
  body: RichBlock[] | null | undefined,
): boolean {
  if (!body?.length) return false;
  return body.some((block) => blockHasVisibleContent(block));
}

export function cardBodyPreview(body: RichBlock[] | null | undefined): string {
  if (!body?.length) return '';
  return blocksToPlainText(body).trim();
}

export function hasEnglishCardContent(card: AdminModuleCard): boolean {
  const titleEn = (card.title_en ?? card.title ?? '').trim();
  const bodyEn = cardBodyPreview(card.body_en);
  return Boolean(titleEn || bodyEn);
}
