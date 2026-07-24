import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  parseLocalizedRichBodyField,
  parseLocalizedStringField,
  serializeLocalizedRichBody,
  serializeLocalizedString,
} from '@/features/modules/utils/localizedWire';
import { readLocaleRichBody, readLocaleText } from '@/types/localized';
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
} from '@/features/modules/types/richText.types';
import { blocksToPlainText } from '@/features/modules/utils/richText';
import { hasStoredFileReference } from '@/features/modules/utils/uploadedFileUrl';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Match Android RichContentParser.normalizeType — snake_case, camelCase, kebab-case. */
function normalizeBlockType(type: unknown): string | null {
  if (typeof type !== 'string') return null;
  return type.toLowerCase().replace(/[_-]/g, '');
}

function paragraphFromText(text: string): RichParagraphBlock {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

function isMarkdownListLine(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
}

function isMarkdownHeadingLine(line: string): boolean {
  return /^\s*#{1,6}\s+/.test(line);
}

/**
 * Parse legacy markdown/plain-text bodies the way Android RichCardBody does:
 * GFM lists, headings, and newline-separated lines become structured blocks.
 */
function parseMarkdownishString(raw: string): RichBlock[] {
  const trimmed = raw.trim();
  if (!trimmed) return [paragraphFromText('')];

  const lines = trimmed.split('\n');
  const blocks: RichBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = Math.min(
        headingMatch[1].length,
        6,
      ) as RichHeadingBlock['level'];
      const block: RichHeadingBlock = {
        type: 'heading',
        level,
        content: [{ type: 'text', text: headingMatch[2] ?? '' }],
      };
      blocks.push(block);
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: RichListItem[] = [];
      while (index < lines.length) {
        const bulletMatch = lines[index]?.match(/^\s*[-*+]\s+(.*)$/);
        if (!bulletMatch) break;
        items.push({
          content: [paragraphFromText(bulletMatch[1] ?? '')],
        });
        index += 1;
      }
      if (items.length) {
        blocks.push({ type: 'bullet_list', items });
      }
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: RichListItem[] = [];
      let start = 1;
      const firstMatch = lines[index]?.match(/^\s*(\d+)\.\s+(.*)$/);
      if (firstMatch) {
        start = Number.parseInt(firstMatch[1], 10) || 1;
      }
      while (index < lines.length) {
        const orderedMatch = lines[index]?.match(/^\s*\d+\.\s+(.*)$/);
        if (!orderedMatch) break;
        items.push({
          content: [paragraphFromText(orderedMatch[1] ?? '')],
        });
        index += 1;
      }
      if (items.length) {
        blocks.push({ type: 'ordered_list', items, start });
      }
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (
        !current.trim() ||
        isMarkdownHeadingLine(current) ||
        isMarkdownListLine(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    if (paragraphLines.length) {
      blocks.push(paragraphFromText(paragraphLines.join('\n')));
    }
  }

  return blocks.length ? blocks : [paragraphFromText(trimmed)];
}

function normalizeMarks(value: unknown): RichTextMark[] {
  if (!Array.isArray(value)) return [];
  const marks: RichTextMark[] = [];
  for (const mark of value) {
    if (!isPlainObject(mark) || typeof mark.type !== 'string') continue;
    const markType = normalizeBlockType(mark.type);
    if (markType === 'bold' || markType === 'strong') {
      marks.push({ type: 'bold' });
      continue;
    }
    if (markType === 'italic' || markType === 'em') {
      marks.push({ type: 'italic' });
      continue;
    }
    if (markType === 'underline') {
      marks.push({ type: 'underline' });
      continue;
    }
    if (
      markType === 'strike' ||
      markType === 'strikethrough' ||
      markType === 's'
    ) {
      marks.push({ type: 'strike' });
      continue;
    }
    if (markType === 'code') {
      marks.push({ type: 'code' });
      continue;
    }
    if (markType === 'link' && isPlainObject(mark.attrs)) {
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

function normalizeInlineContent(rawContent: unknown): RichTextLeaf[] {
  if (!Array.isArray(rawContent)) {
    return [{ type: 'text', text: '' }];
  }

  const content: RichTextLeaf[] = [];
  for (const node of rawContent) {
    if (!isPlainObject(node)) continue;
    const nodeType = normalizeBlockType(node.type);
    if (nodeType === 'hardbreak') {
      content.push({ type: 'text', text: '\n' });
      continue;
    }
    const leaf = normalizeTextLeaf(node);
    if (leaf) content.push(leaf);
  }

  return content.length ? content : [{ type: 'text', text: '' }];
}

function headingLevelFromValue(
  value: Record<string, unknown>,
): RichHeadingBlock['level'] {
  const attrs = isPlainObject(value.attrs) ? value.attrs : null;
  const rawLevel = attrs?.level ?? value.level;
  if (
    rawLevel === 1 ||
    rawLevel === 2 ||
    rawLevel === 3 ||
    rawLevel === 4 ||
    rawLevel === 5 ||
    rawLevel === 6
  ) {
    return rawLevel;
  }
  return 2;
}

function normalizeListItems(value: Record<string, unknown>): RichListItem[] {
  const source = Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.content)
      ? value.content
      : [];

  return source
    .map(normalizeListItem)
    .filter((item): item is RichListItem => item !== null);
}

function normalizeRichBlock(value: unknown): RichBlock | null {
  if (!isPlainObject(value) || typeof value.type !== 'string') return null;
  const blockType = normalizeBlockType(value.type);
  if (!blockType) return null;

  if (blockType === 'paragraph') {
    const content = normalizeInlineContent(value.content);
    if (content.every((leaf) => leaf.text.trim().length === 0)) {
      return null;
    }
    return { type: 'paragraph', content };
  }

  if (blockType === 'heading') {
    const block: RichHeadingBlock = {
      type: 'heading',
      level: headingLevelFromValue(value),
      content: normalizeInlineContent(value.content),
    };
    return block;
  }

  if (blockType === 'blockquote') {
    const content = Array.isArray(value.content)
      ? value.content.flatMap((child) => flattenNormalizeBlock(child))
      : [];
    const block: RichBlockquoteBlock = {
      type: 'blockquote',
      content: content.length ? content : [paragraphFromText('')],
    };
    return block;
  }

  if (blockType === 'codeblock') {
    const inlineText = normalizeInlineContent(value.content)
      .map((leaf) => leaf.text)
      .join('');
    const text =
      typeof value.text === 'string' && value.text.length > 0
        ? value.text
        : inlineText;
    const block: RichCodeBlock = { type: 'code_block', text };
    return block;
  }

  if (blockType === 'horizontalrule') {
    const block: RichHorizontalRuleBlock = { type: 'horizontal_rule' };
    return block;
  }

  if (blockType === 'bulletlist') {
    return { type: 'bullet_list', items: normalizeListItems(value) };
  }

  if (blockType === 'orderedlist') {
    const attrs = isPlainObject(value.attrs) ? value.attrs : null;
    const rawStart = attrs?.start ?? value.start;
    const start =
      typeof rawStart === 'number' && Number.isFinite(rawStart)
        ? Math.max(1, Math.trunc(rawStart))
        : 1;
    return { type: 'ordered_list', items: normalizeListItems(value), start };
  }

  if (blockType === 'image' && isPlainObject(value.attrs)) {
    const width =
      typeof value.attrs.width === 'number' &&
      Number.isFinite(value.attrs.width) &&
      value.attrs.width > 0
        ? Math.round(value.attrs.width)
        : undefined;
    const height =
      typeof value.attrs.height === 'number' &&
      Number.isFinite(value.attrs.height) &&
      value.attrs.height > 0
        ? Math.round(value.attrs.height)
        : undefined;
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
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    };
    if (!hasStoredFileReference(attrs)) return null;
    return { type: 'image', attrs };
  }

  if (blockType === 'audio' && isPlainObject(value.attrs)) {
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

  if (blockType === 'video' && isPlainObject(value.attrs)) {
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
    const text = value.trim();
    if (!text) return null;
    return {
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: value }] },
      ],
    };
  }
  if (!isPlainObject(value)) return null;

  if (normalizeBlockType(value.type) === 'listitem') {
    const contentSource = Array.isArray(value.content) ? value.content : null;
    if (contentSource) {
      const content = contentSource
        .map(normalizeListItemContent)
        .filter((entry): entry is RichListItemContent => entry !== null);
      if (content.length) return { content };
    }
    return null;
  }

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

function flattenNormalizeBlock(value: unknown): RichBlock[] {
  const block = normalizeRichBlock(value);
  if (block) return [block];

  if (!isPlainObject(value) || !Array.isArray(value.content)) return [];

  return value.content.flatMap((child) => flattenNormalizeBlock(child));
}

export function normalizeCardBody(value: unknown): RichBlock[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [paragraphFromText('')];
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizeCardBody(parsed);
      } catch {
        // Fall through to markdown/plain-text parsing.
      }
    }
    return parseMarkdownishString(trimmed);
  }
  if (Array.isArray(value)) {
    const blocks = value.flatMap((entry) => flattenNormalizeBlock(entry));
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
      title: {},
      body: { bn: [paragraphFromText('')] },
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

  const title = parseLocalizedStringField(
    card,
    'title',
    'title_bn',
    'title_en',
  );
  const body = parseLocalizedRichBodyField(
    card,
    'body',
    normalizeCardBody,
    'body_bn',
    'body_en',
  );
  if (!Object.keys(body).length) {
    body.bn = [paragraphFromText('')];
  }

  const previous_practice = parseLocalizedStringField(
    card,
    'previous_practice',
    'previous_practice_bn',
    'previous_practice_en',
  );
  const current_practice = parseLocalizedStringField(
    card,
    'current_practice',
    'current_practice_bn',
    'current_practice_en',
  );

  return {
    id,
    card_family_id:
      typeof card.card_family_id === 'string' ? card.card_family_id : undefined,
    card_order:
      typeof card.card_order === 'number' ? card.card_order : undefined,
    title,
    body,
    ...(Object.keys(previous_practice).length ? { previous_practice } : {}),
    ...(Object.keys(current_practice).length ? { current_practice } : {}),
  };
}

export function serializeAdminModuleCard(
  card: AdminModuleCard,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: card.id,
    title: serializeLocalizedString(card.title),
    body: serializeLocalizedRichBody(card.body),
  };
  if (card.card_family_id) payload.card_family_id = card.card_family_id;
  if (typeof card.card_order === 'number') payload.card_order = card.card_order;
  if (card.previous_practice && Object.keys(card.previous_practice).length) {
    payload.previous_practice = serializeLocalizedString(
      card.previous_practice,
    );
  }
  if (card.current_practice && Object.keys(card.current_practice).length) {
    payload.current_practice = serializeLocalizedString(card.current_practice);
  }
  return payload;
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
  const titleEn = readLocaleText(card.title, 'en').trim();
  const bodyEn = cardBodyPreview(readLocaleRichBody(card.body, 'en'));
  return Boolean(titleEn || bodyEn);
}
