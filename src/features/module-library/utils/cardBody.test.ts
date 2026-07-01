import { describe, expect, it } from 'vitest';
import { normalizeCardBody } from '@/features/module-library/utils/cardBody';

describe('normalizeCardBody', () => {
  it('parses markdown bullet lines into a bullet list', () => {
    const blocks = normalizeCardBody('- First item\n- Second item');

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('bullet_list');
    if (blocks[0]?.type === 'bullet_list') {
      expect(blocks[0].items).toHaveLength(2);
      expect(blocks[0].items[0]?.content[0]?.type).toBe('paragraph');
      if (blocks[0].items[0]?.content[0]?.type === 'paragraph') {
        expect(blocks[0].items[0].content[0].content[0]?.text).toBe(
          'First item',
        );
      }
    }
  });

  it('keeps single-newline plain text in one paragraph for pre-line rendering', () => {
    const blocks = normalizeCardBody('Line one\nLine two');

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('paragraph');
    if (blocks[0]?.type === 'paragraph') {
      expect(blocks[0].content[0]?.text).toBe('Line one\nLine two');
    }
  });

  it('normalizes ProseMirror bullet lists that use content + list_item nodes', () => {
    const blocks = normalizeCardBody([
      {
        type: 'bullet_list',
        content: [
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item one' }],
              },
            ],
          },
        ],
      },
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('bullet_list');
    if (blocks[0]?.type === 'bullet_list') {
      expect(blocks[0].items).toHaveLength(1);
    }
  });

  it('normalizes string list items the way Android RichContentParser does', () => {
    const blocks = normalizeCardBody([
      {
        type: 'ordered_list',
        items: ['First step', 'Second step'],
      },
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('ordered_list');
    if (blocks[0]?.type === 'ordered_list') {
      expect(blocks[0].items).toHaveLength(2);
      expect(blocks[0].start).toBe(1);
    }
  });

  it('converts inline hard_break nodes to newline runs', () => {
    const blocks = normalizeCardBody([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Line one' },
          { type: 'hard_break' },
          { type: 'text', text: 'Line two' },
        ],
      },
    ]);

    expect(blocks).toHaveLength(1);
    if (blocks[0]?.type === 'paragraph') {
      expect(blocks[0].content.map((leaf) => leaf.text).join('')).toBe(
        'Line one\nLine two',
      );
    }
  });
});
