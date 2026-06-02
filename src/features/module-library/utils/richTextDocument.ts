import type {
  RichBlock,
  RichBlockquoteBlock,
  RichCodeBlock,
  RichHorizontalRuleBlock,
  RichImageBlock,
  RichListBlock,
  RichListItem,
  RichListItemContent,
  RichParagraphBlock,
  RichTextLeaf,
  RichTextMark,
  RichVideoBlock,
} from '@/features/program-manager/types/programManager.types';
import {
  readCardMediaTiptapAttrs,
  storedFileAttrsFromTiptap,
  storedFileAttrsToTiptap,
} from '@/features/module-library/tiptap/cardMediaAttrs';
import { hasStoredFileReference } from '@/features/module-library/utils/uploadedFileUrl';
import type { JSONContent } from '@tiptap/core';
function paragraphFromText(text: string): RichParagraphBlock {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

/** ProseMirror rejects `{ type: 'text', text: '' }` — use a bare paragraph node instead. */
function emptyParagraphNode(): JSONContent {
  return { type: 'paragraph' };
}

function headingContentToTiptap(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  leaves: RichTextLeaf[],
): JSONContent {
  const filtered = leaves.filter(
    (leaf) => leaf.text.length > 0 || (leaf.marks?.length ?? 0) > 0,
  );
  if (!filtered.length) {
    return { type: 'heading', attrs: { level } };
  }
  return {
    type: 'heading',
    attrs: { level },
    content: filtered.map(leafToTiptapText),
  };
}

function paragraphContentToTiptap(leaves: RichTextLeaf[]): JSONContent {
  const filtered = leaves.filter(
    (leaf) => leaf.text.length > 0 || (leaf.marks?.length ?? 0) > 0,
  );
  if (!filtered.length) {
    return emptyParagraphNode();
  }
  return {
    type: 'paragraph',
    content: filtered.map(leafToTiptapText),
  };
}

function imageToTiptap(node: RichImageBlock): JSONContent {
  return {
    type: 'image',
    attrs: storedFileAttrsToTiptap(node.attrs),
  };
}

function videoToTiptap(node: RichVideoBlock): JSONContent {
  return {
    type: 'cardVideo',
    attrs: storedFileAttrsToTiptap(node.attrs),
  };
}

function listItemContentToTiptap(
  entry: RichListItemContent,
): JSONContent | null {
  if (entry.type === 'paragraph') {
    return paragraphContentToTiptap(entry.content);
  }
  if (entry.type === 'heading') {
    return headingContentToTiptap(entry.level, entry.content);
  }
  if (entry.type === 'blockquote') {
    const content = entry.content
      .map((block) => listItemContentToTiptap(block))
      .filter((node): node is JSONContent => node !== null);
    return {
      type: 'blockquote',
      content: content.length ? content : [emptyParagraphNode()],
    };
  }
  if (entry.type === 'code_block') {
    return {
      type: 'codeBlock',
      content: entry.text ? [{ type: 'text', text: entry.text }] : [],
    };
  }
  if (entry.type === 'horizontal_rule') {
    return { type: 'horizontalRule' };
  }
  if (entry.type === 'bullet_list' || entry.type === 'ordered_list') {
    return listBlockToTiptap(entry);
  }
  if (entry.type === 'image') {
    return imageToTiptap(entry);
  }
  if (entry.type === 'video') {
    return videoToTiptap(entry);
  }
  if (entry.type === 'audio') {
    return {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: entry.attrs.title ?? entry.attrs.url,
          marks: [{ type: 'link', attrs: { href: entry.attrs.url } }],
        },
      ],
    };
  }
  return null;
}

function listItemToTiptap(item: RichListItem): JSONContent {
  const nodeContent = item.content
    .map((entry) => listItemContentToTiptap(entry))
    .filter((node): node is JSONContent => node !== null);
  if (!nodeContent.length) {
    nodeContent.push(emptyParagraphNode());
  }
  return { type: 'listItem', content: nodeContent };
}

function listBlockToTiptap(block: RichListBlock): JSONContent {
  return {
    type: block.type === 'bullet_list' ? 'bulletList' : 'orderedList',
    content: block.items.map((item) => listItemToTiptap(item)),
  };
}

function leafFromTiptapText(node: JSONContent): RichTextLeaf | null {
  if (node.type !== 'text' || typeof node.text !== 'string') return null;
  const marks: RichTextMark[] = [];
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') marks.push({ type: 'bold' });
    if (mark.type === 'italic') marks.push({ type: 'italic' });
    if (mark.type === 'underline') marks.push({ type: 'underline' });
    if (mark.type === 'strike') marks.push({ type: 'strike' });
    if (mark.type === 'code') marks.push({ type: 'code' });
    if (mark.type === 'link' && mark.attrs?.href) {
      marks.push({
        type: 'link',
        attrs: { href: String(mark.attrs.href) },
      });
    }
  }
  return {
    type: 'text',
    text: node.text,
    ...(marks.length ? { marks } : {}),
  };
}

function leafToTiptapText(leaf: RichTextLeaf): JSONContent {
  const marks: RichTextMark[] = [];
  for (const mark of leaf.marks ?? []) {
    if (mark.type === 'bold') marks.push({ type: 'bold' });
    if (mark.type === 'italic') marks.push({ type: 'italic' });
    if (mark.type === 'underline') marks.push({ type: 'underline' });
    if (mark.type === 'strike') marks.push({ type: 'strike' });
    if (mark.type === 'code') marks.push({ type: 'code' });
    if (mark.type === 'link' && mark.attrs?.href) {
      marks.push({
        type: 'link',
        attrs: { href: String(mark.attrs.href) },
      });
    }
  }
  return {
    type: 'text',
    text: typeof leaf.text === 'string' ? leaf.text : '',
    ...(marks.length ? { marks } : {}),
  };
}

function imageFromTiptap(node: JSONContent): RichImageBlock | null {
  if (node.type !== 'image') return null;
  const attrs = storedFileAttrsFromTiptap(readCardMediaTiptapAttrs(node));
  if (!hasStoredFileReference(attrs)) return null;
  return { type: 'image', attrs };
}

function videoFromTiptap(node: JSONContent): RichVideoBlock | null {
  if (node.type !== 'cardVideo') return null;
  const attrs = storedFileAttrsFromTiptap(readCardMediaTiptapAttrs(node));
  if (!hasStoredFileReference(attrs)) return null;
  return { type: 'video', attrs };
}

function listItemContentFromTiptap(
  node: JSONContent,
): RichListItemContent | null {
  if (node.type === 'paragraph') {
    const content = (node.content ?? [])
      .map(leafFromTiptapText)
      .filter((leaf): leaf is RichTextLeaf => leaf !== null);
    return {
      type: 'paragraph',
      content: content.length ? content : [{ type: 'text', text: '' }],
    };
  }
  if (node.type === 'heading') {
    const rawLevel = node.attrs?.level;
    const level =
      rawLevel === 1 ||
      rawLevel === 2 ||
      rawLevel === 3 ||
      rawLevel === 4 ||
      rawLevel === 5 ||
      rawLevel === 6
        ? rawLevel
        : 2;
    const content = (node.content ?? [])
      .map(leafFromTiptapText)
      .filter((leaf): leaf is RichTextLeaf => leaf !== null);
    return {
      type: 'heading',
      level,
      content: content.length ? content : [{ type: 'text', text: '' }],
    };
  }
  if (node.type === 'blockquote') {
    const content = (node.content ?? [])
      .map(blockFromTiptapNode)
      .filter((block): block is RichBlock => block !== null);
    const blockquote: RichBlockquoteBlock = {
      type: 'blockquote',
      content: content.length ? content : [paragraphFromText('')],
    };
    return blockquote;
  }
  if (node.type === 'codeBlock') {
    const text = (node.content ?? [])
      .filter(
        (child) => child.type === 'text' && typeof child.text === 'string',
      )
      .map((child) => child.text ?? '')
      .join('');
    const block: RichCodeBlock = { type: 'code_block', text };
    return block;
  }
  if (node.type === 'horizontalRule') {
    const block: RichHorizontalRuleBlock = { type: 'horizontal_rule' };
    return block;
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return listBlockFromTiptap(node);
  }
  return imageFromTiptap(node) ?? videoFromTiptap(node);
}

function listBlockFromTiptap(node: JSONContent): RichListBlock {
  return {
    type: node.type === 'bulletList' ? 'bullet_list' : 'ordered_list',
    items: listItemsFromTiptap(node),
  };
}

function listItemFromTiptap(node: JSONContent): RichListItem {
  const content: RichListItemContent[] = [];
  for (const child of node.content ?? []) {
    const entry = listItemContentFromTiptap(child);
    if (entry) content.push(entry);
  }
  if (!content.length) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });
  }
  return { content };
}

function listItemsFromTiptap(node: JSONContent): RichListItem[] {
  const items: RichListItem[] = [];
  for (const child of node.content ?? []) {
    if (child.type === 'listItem') {
      items.push(listItemFromTiptap(child));
    }
  }
  return items;
}

function blockFromTiptapNode(node: JSONContent): RichBlock | null {
  return listItemContentFromTiptap(node);
}

export function blocksToTiptapDoc(blocks: RichBlock[]): JSONContent {
  const content: JSONContent[] = [];

  for (const block of blocks) {
    const node = listItemContentToTiptap(block);
    if (node) content.push(node);
  }

  if (!content.length) {
    return { type: 'doc', content: [emptyParagraphNode()] };
  }

  return { type: 'doc', content };
}

export function tiptapDocToBlocks(doc: JSONContent): RichBlock[] {
  const blocks: RichBlock[] = [];

  for (const node of doc.content ?? []) {
    const block = blockFromTiptapNode(node);
    if (block) blocks.push(block);
  }

  return blocks.length ? blocks : [paragraphFromText('')];
}

export function richBlocksEqual(a: RichBlock[], b: RichBlock[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
