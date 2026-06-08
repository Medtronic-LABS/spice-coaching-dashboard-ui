import { describe, expect, it } from 'vitest';
import {
  blocksToHtml,
  htmlToBlocks,
} from '@/features/program-manager/utils/richText';

describe('richText href safety', () => {
  it('does not render javascript links in generated HTML', () => {
    const html = blocksToHtml([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Click me',
            marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
          },
        ],
      },
    ]);

    expect(html).not.toContain('javascript:');
    expect(html).toContain('Click me');
    expect(html).not.toContain('<a ');
  });

  it('strips unsafe hrefs when parsing editor HTML', () => {
    const blocks = htmlToBlocks(
      '<p><a href="javascript:alert(1)">Click me</a></p>',
    );

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Click me' }],
      },
    ]);
  });

  it('preserves safe links in round-trip HTML', () => {
    const blocks = htmlToBlocks(
      '<p><a href="https://example.com">Docs</a></p>',
    );
    const html = blocksToHtml(blocks);

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Docs');
  });
});
