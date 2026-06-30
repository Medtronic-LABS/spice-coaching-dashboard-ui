import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { CardVideoExtension } from '@/features/module-library/tiptap/CardVideoExtension';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';
import {
  blocksToTiptapDoc,
  tiptapDocToBlocks,
} from '@/features/module-library/utils/richTextDocument';

const card0Body: RichBlock[] = [
  {
    type: 'ordered_list',
    items: [
      {
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'ডায়রিয়ায় আক্রান্ত শিশুদের ডিহাইড্রেশনের লক্ষণগুলি হল: মুখ শুকিয়ে যাওয়া।',
              },
            ],
          },
        ],
      },
      {
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'এবং শিশুর অশক্তি।' }],
          },
        ],
      },
      {
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
      },
    ],
  },
  {
    type: 'image',
    attrs: {
      url: 'http://localhost:18000/admin/v3/files/media/test.png',
      caption: 'test.png',
    },
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Test images - ' },
      {
        type: 'text',
        text: 'https://www.youtube.com/watch?v=9-cYPGjiXtw',
        marks: [
          {
            type: 'link',
            attrs: { href: 'https://www.youtube.com/watch?v=9-cYPGjiXtw' },
          },
        ],
      },
    ],
  },
];

const extensions = [
  StarterKit.configure({ link: false }),
  Link.configure({ openOnClick: false }),
  Image.configure({ inline: false, allowBase64: false }),
  CardVideoExtension,
];

describe('TipTap editor with media blocks', () => {
  it('loads and round-trips card body with ordered list, empty item, and image', () => {
    const doc = blocksToTiptapDoc(card0Body);
    const editor = new Editor({ extensions, content: doc });

    expect(editor.getText()).toContain('ডায়রিয়ায়');
    expect(editor.getText()).toContain('Test images');
    const json = editor.getJSON();
    expect(json.content?.some((node) => node.type === 'orderedList')).toBe(
      true,
    );
    expect(json.content?.some((node) => node.type === 'image')).toBe(true);

    const back = tiptapDocToBlocks(json);
    expect(back.some((block) => block.type === 'ordered_list')).toBe(true);
    expect(back.some((block) => block.type === 'image')).toBe(true);

    editor.destroy();
  });

  it('loads image inside an ordered list item', () => {
    const body: RichBlock[] = [
      {
        type: 'ordered_list',
        items: [
          {
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'See diagram:' }],
              },
              {
                type: 'image',
                attrs: {
                  url: 'http://localhost:18000/admin/v3/files/media/test.png',
                  caption: 'test.png',
                },
              },
            ],
          },
        ],
      },
    ];
    const editor = new Editor({ extensions, content: blocksToTiptapDoc(body) });
    const listItem = editor.getJSON().content?.[0]?.content?.[0];
    expect(listItem?.type).toBe('listItem');
    expect(listItem?.content?.some((node) => node.type === 'image')).toBe(true);

    const back = tiptapDocToBlocks(editor.getJSON());
    if (back[0]?.type === 'ordered_list') {
      expect(
        back[0].items[0]?.content.some((entry) => entry.type === 'image'),
      ).toBe(true);
    }

    editor.destroy();
  });
});
