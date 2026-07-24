import { describe, expect, it } from 'vitest';
import {
  blocksToTiptapDoc,
  tiptapDocToBlocks,
} from '@/features/modules/utils/richTextDocument';
import type { RichBlock } from '@/features/modules/types/richText.types';

const sampleBody: RichBlock[] = [
  {
    type: 'paragraph',
    content: [
      {
        text: 'ডায়রিয়ায় আক্রান্ত শিশুদের ডিহাইড্রেশনের',
        type: 'text',
        marks: [{ type: 'bold' }],
      },
      {
        text: ' লক্ষণগুলি হল: মুখ শুকিয়ে যাওয়া',
        type: 'text',
      },
    ],
  },
  {
    type: 'paragraph',
    content: [{ text: '', type: 'text' }],
  },
  {
    type: 'image',
    attrs: {
      url: 'http://localhost:18000/admin/files/media/test.png',
      caption: 'test.png',
    },
  },
];

describe('richTextDocument', () => {
  it('builds TipTap doc for ordered list with empty item', () => {
    const doc = blocksToTiptapDoc([
      {
        type: 'ordered_list',
        items: [
          {
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'First item' }],
              },
            ],
          },
          {
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: '' }] },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'After list' }],
      },
    ]);
    expect(doc.content?.[0]?.type).toBe('orderedList');
    const listItems = doc.content?.[0]?.content ?? [];
    expect(listItems[1]?.content?.[0]?.type).toBe('paragraph');
    expect(listItems[1]?.content?.[0]?.content).toBeUndefined();
  });

  it('round-trips uploaded image metadata without persisting direct url', () => {
    const body: RichBlock[] = [
      {
        type: 'image',
        attrs: {
          object_name:
            'media/e1b67458-9a53-44bb-8287-b451f26fed94_ChatGPT Image Apr 1, 2026, 04_05_58 PM.png',
          content_type: 'image/png',
          original_filename: 'ChatGPT Image Apr 1, 2026, 04_05_58 PM.png',
        },
      },
    ];
    const back = tiptapDocToBlocks(blocksToTiptapDoc(body));
    const image = back.find((block) => block.type === 'image');
    expect(image?.type).toBe('image');
    if (image?.type === 'image') {
      expect(image.attrs.object_name).toContain('media/');
      expect(image.attrs.content_type).toBe('image/png');
      expect(image.attrs.original_filename).toContain('ChatGPT');
      expect(image.attrs.url).toBeUndefined();
    }
  });

  it('round-trips image display width and height', () => {
    const body: RichBlock[] = [
      {
        type: 'image',
        attrs: {
          object_name: 'media/example.png',
          content_type: 'image/png',
          original_filename: 'example.png',
          width: 320,
          height: 180,
        },
      },
    ];

    const back = tiptapDocToBlocks(blocksToTiptapDoc(body));
    const image = back.find((block) => block.type === 'image');
    expect(image?.type).toBe('image');
    if (image?.type === 'image') {
      expect(image.attrs.width).toBe(320);
      expect(image.attrs.height).toBe(180);
    }
  });

  it('round-trips sample card body', () => {
    const doc = blocksToTiptapDoc(sampleBody);
    expect(doc.content?.length).toBe(3);
    const back = tiptapDocToBlocks(doc);
    expect(back.length).toBeGreaterThanOrEqual(2);
    expect(back[0]?.type).toBe('paragraph');
    if (back[0]?.type === 'paragraph') {
      expect(back[0].content.map((l) => l.text).join('')).toContain(
        'ডায়রিয়ায়',
      );
    }
    expect(back.some((b) => b.type === 'image')).toBe(true);
  });

  it('round-trips bold text and nested list inside list item', () => {
    const body: RichBlock[] = [
      {
        type: 'ordered_list',
        items: [
          {
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Parent ' },
                  { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
                ],
              },
              {
                type: 'bullet_list',
                items: [
                  {
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Nested child' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const back = tiptapDocToBlocks(blocksToTiptapDoc(body));
    expect(back[0]?.type).toBe('ordered_list');
    if (back[0]?.type !== 'ordered_list') return;
    const parent = back[0].items[0];
    const paragraph = parent?.content.find((b) => b.type === 'paragraph');
    expect(
      paragraph?.type === 'paragraph' &&
        paragraph.content.some((l) => l.marks?.some((m) => m.type === 'bold')),
    ).toBe(true);
    const nested = parent?.content.find((b) => b.type === 'bullet_list');
    expect(nested?.type).toBe('bullet_list');
    if (nested?.type === 'bullet_list') {
      expect(nested.items[0]?.content[0]?.type).toBe('paragraph');
      if (nested.items[0]?.content[0]?.type === 'paragraph') {
        expect(nested.items[0].content[0].content[0]?.text).toBe(
          'Nested child',
        );
      }
    }
  });

  it('round-trips image and video inside ordered list item', () => {
    const body: RichBlock[] = [
      {
        type: 'ordered_list',
        items: [
          {
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Step with media' }],
              },
              {
                type: 'image',
                attrs: { url: 'https://example.com/a.png', caption: 'Diagram' },
              },
              {
                type: 'video',
                attrs: { url: 'https://example.com/clip.mp4' },
              },
            ],
          },
        ],
      },
    ];
    const back = tiptapDocToBlocks(blocksToTiptapDoc(body));
    expect(back[0]?.type).toBe('ordered_list');
    if (back[0]?.type !== 'ordered_list') return;
    const itemContent = back[0].items[0]?.content ?? [];
    expect(itemContent.some((b) => b.type === 'image')).toBe(true);
    expect(itemContent.some((b) => b.type === 'video')).toBe(true);
  });
});
