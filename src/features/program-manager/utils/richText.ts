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

function leavesToHtml(leaves: RichTextLeaf[]): string {
  return leaves
    .map((leaf) => {
      const text = escapeHtml(leaf.text);
      const linkMark = leaf.marks?.find((mark) => mark.type === 'link');
      const linked =
        linkMark && linkMark.type === 'link'
          ? `<a href="${escapeHtml(linkMark.attrs.href)}">${text}</a>`
          : text;
      const wrapped = ((): string => {
        let value = linked;
        if (leaf.marks?.some((mark) => mark.type === 'code')) {
          value = `<code>${value}</code>`;
        }
        if (leaf.marks?.some((mark) => mark.type === 'underline')) {
          value = `<u>${value}</u>`;
        }
        if (leaf.marks?.some((mark) => mark.type === 'strike')) {
          value = `<s>${value}</s>`;
        }
        if (leaf.marks?.some((mark) => mark.type === 'italic')) {
          value = `<em>${value}</em>`;
        }
        if (leaf.marks?.some((mark) => mark.type === 'bold')) {
          value = `<strong>${value}</strong>`;
        }
        return value;
      })();
      return wrapped;
    })
    .join('');
}

function listItemContentToHtml(entry: RichListItemContent): string {
  if (entry.type === 'paragraph') {
    const body = leavesToHtml(entry.content);
    return body || '<br/>';
  }
  if (entry.type === 'heading') {
    const tag = `h${entry.level}` as const;
    const body = leavesToHtml(entry.content);
    return `<${tag}>${body || '<br/>'}</${tag}>`;
  }
  if (entry.type === 'blockquote') {
    return `<blockquote>${blocksToHtml(entry.content)}</blockquote>`;
  }
  if (entry.type === 'code_block') {
    return `<pre><code>${escapeHtml(entry.text)}</code></pre>`;
  }
  if (entry.type === 'horizontal_rule') {
    return `<hr/>`;
  }
  if (entry.type === 'bullet_list' || entry.type === 'ordered_list') {
    return listBlockToHtml(entry);
  }
  if (entry.type === 'image') {
    return `<em>Image: ${escapeHtml(imageLabel(entry))}</em>`;
  }
  if (entry.type === 'audio') {
    return `<em>Audio: ${escapeHtml(entry.attrs.title ?? entry.attrs.url)}</em>`;
  }
  if (entry.type === 'video') {
    return `<em>Video: ${escapeHtml(videoLabel(entry))}</em>`;
  }
  return '';
}

function listItemToHtml(item: RichListItem): string {
  const body = item.content
    .map((entry) => listItemContentToHtml(entry))
    .join('');
  return `<li>${body || '<br/>'}</li>`;
}

function listBlockToHtml(block: RichListBlock): string {
  const tag = block.type === 'bullet_list' ? 'ul' : 'ol';
  return `<${tag}>${block.items.map((item) => listItemToHtml(item)).join('')}</${tag}>`;
}

function listItemContentToPlainText(entry: RichListItemContent): string {
  if (entry.type === 'paragraph') {
    return entry.content.map((leaf) => leaf.text).join('');
  }
  if (entry.type === 'heading') {
    return entry.content.map((leaf) => leaf.text).join('');
  }
  if (entry.type === 'blockquote') {
    return blocksToPlainText(entry.content);
  }
  if (entry.type === 'code_block') {
    return entry.text;
  }
  if (entry.type === 'horizontal_rule') return '—';
  if (entry.type === 'bullet_list' || entry.type === 'ordered_list') {
    return listBlockToPlainText(entry);
  }
  if (entry.type === 'image') return imageLabel(entry);
  if (entry.type === 'audio') return entry.attrs.title ?? 'Audio';
  if (entry.type === 'video') return 'Video';
  return '';
}

function listItemToPlainText(item: RichListItem): string {
  return item.content
    .map((entry) => listItemContentToPlainText(entry))
    .join(' ');
}

function listBlockToPlainText(block: RichListBlock): string {
  return block.items.map((item) => listItemToPlainText(item)).join(' ');
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
      if (block.type === 'heading') {
        const tag = `h${block.level}` as const;
        const content = leavesToHtml(block.content);
        return `<${tag}>${content || '<br/>'}</${tag}>`;
      }
      if (block.type === 'blockquote') {
        return `<blockquote>${blocksToHtml(block.content)}</blockquote>`;
      }
      if (block.type === 'code_block') {
        return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
      }
      if (block.type === 'horizontal_rule') {
        return `<hr/>`;
      }
      if (block.type === 'bullet_list' || block.type === 'ordered_list') {
        return listBlockToHtml(block);
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
      if (block.type === 'heading') {
        return block.content.map((leaf) => leaf.text).join('');
      }
      if (block.type === 'blockquote') {
        return blocksToPlainText(block.content);
      }
      if (block.type === 'code_block') {
        return block.text;
      }
      if (block.type === 'horizontal_rule') {
        return '—';
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
