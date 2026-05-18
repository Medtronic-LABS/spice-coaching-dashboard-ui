import type {
  RichBlock,
  RichParagraphBlock,
  RichTextLeaf,
} from '@/features/program-manager/types/programManager.types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function blocksToHtml(blocks: RichBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        const content = block.content
          .map((leaf) =>
            leaf.marks?.some((mark) => mark.type === 'bold')
              ? `<strong>${escapeHtml(leaf.text)}</strong>`
              : escapeHtml(leaf.text),
          )
          .join('');
        return `<p>${content || '<br/>'}</p>`;
      }
      if (block.type === 'bullet_list') {
        return `<ul>${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`;
      }
      if (block.type === 'ordered_list') {
        return `<ol>${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ol>`;
      }
      if (block.type === 'image') {
        return `<p><em>Image: ${escapeHtml(block.attrs.caption ?? block.attrs.url)}</em></p>`;
      }
      if (block.type === 'audio') {
        return `<p><em>Audio: ${escapeHtml(block.attrs.title ?? block.attrs.url)}</em></p>`;
      }
      if (block.type === 'video') {
        return `<p><em>Video: ${escapeHtml(block.attrs.url)}</em></p>`;
      }
      return '';
    })
    .join('');
}

function paragraphFromText(value: string): RichParagraphBlock {
  const leaf: RichTextLeaf = { type: 'text', text: value };
  return { type: 'paragraph', content: [leaf] };
}

export function htmlToBlocks(html: string): RichBlock[] {
  if (!html.trim()) return [paragraphFromText('')];
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return [paragraphFromText('')];
  const blocks: RichBlock[] = [];

  Array.from(container.children).forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (tag === 'p') {
      const leaves: RichTextLeaf[] = [];
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          leaves.push({ type: 'text', text: child.textContent ?? '' });
          return;
        }
        if (
          child.nodeType === Node.ELEMENT_NODE &&
          ['strong', 'b'].includes((child as Element).tagName.toLowerCase())
        ) {
          leaves.push({
            type: 'text',
            text: child.textContent ?? '',
            marks: [{ type: 'bold' }],
          });
          return;
        }
        leaves.push({ type: 'text', text: child.textContent ?? '' });
      });
      blocks.push({ type: 'paragraph', content: leaves });
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      blocks.push({
        type: tag === 'ul' ? 'bullet_list' : 'ordered_list',
        items: Array.from(node.querySelectorAll('li')).map(
          (item) => item.textContent ?? '',
        ),
      });
    }
  });

  return blocks.length
    ? blocks
    : [paragraphFromText(container.textContent ?? '')];
}

export function blocksToPlainText(blocks: RichBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return block.content.map((leaf) => leaf.text).join('');
      }
      if (block.type === 'bullet_list' || block.type === 'ordered_list') {
        return block.items.join(' ');
      }
      if (block.type === 'image') return block.attrs.caption ?? 'Image';
      if (block.type === 'audio') return block.attrs.title ?? 'Audio';
      if (block.type === 'video') return 'Video';
      return '';
    })
    .join('\n');
}
