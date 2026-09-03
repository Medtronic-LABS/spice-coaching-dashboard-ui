import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { CardVideoExtension } from '@/components/ui/rich-text/tiptap/CardVideoExtension';
import {
  readLiveCardMediaSrc,
  sliceWithLiveCardMediaSrcs,
} from './cardMediaClipboard';

describe('readLiveCardMediaSrc', () => {
  it('reads the displayed image src for a matching object name', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-card-image data-object-name="media/a.png">
        <img src="https://cdn.example/presigned-a" alt="a" />
      </div>
    `;

    expect(
      readLiveCardMediaSrc(
        root,
        { objectName: 'media/a.png', src: '' },
        'image',
      ),
    ).toBe('https://cdn.example/presigned-a');
  });

  it('reads the displayed video src for a matching object name', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-card-video data-object-name="media/a.mp4">
        <video src="https://cdn.example/presigned-video"></video>
      </div>
    `;

    expect(
      readLiveCardMediaSrc(
        root,
        { objectName: 'media/a.mp4', src: '' },
        'video',
      ),
    ).toBe('https://cdn.example/presigned-video');
  });

  it('falls back to data-legacy-src when object name is missing', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-card-image data-legacy-src="http://localhost/admin/files/media/b.png">
        <img src="https://cdn.example/presigned-b" alt="b" />
      </div>
    `;

    expect(
      readLiveCardMediaSrc(
        root,
        { src: 'http://localhost/admin/files/media/b.png' },
        'image',
      ),
    ).toBe('https://cdn.example/presigned-b');
  });

  it('returns null when the node view has not loaded media yet', () => {
    const root = document.createElement('div');
    root.innerHTML = `<div data-card-image data-object-name="media/missing.png"></div>`;

    expect(
      readLiveCardMediaSrc(root, { objectName: 'media/missing.png' }, 'image'),
    ).toBeNull();
  });
});

describe('sliceWithLiveCardMediaSrcs', () => {
  it('puts displayed image and video URLs on a copied slice', () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ link: false }),
        Image.configure({ inline: false, allowBase64: false }),
        CardVideoExtension,
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
          },
          {
            type: 'image',
            attrs: { src: 'http://localhost/admin/files/media/b.png' },
          },
          {
            type: 'cardVideo',
            attrs: { src: 'http://localhost/admin/files/media/c.mp4' },
          },
        ],
      },
    });

    const editorRoot = document.createElement('div');
    editorRoot.innerHTML = `
      <div data-card-image data-legacy-src="http://localhost/admin/files/media/b.png">
        <img src="https://cdn.example/presigned-b" alt="b" />
      </div>
      <div data-card-video data-legacy-src="http://localhost/admin/files/media/c.mp4">
        <video src="https://cdn.example/presigned-c"></video>
      </div>
    `;

    const copied = sliceWithLiveCardMediaSrcs(
      editor.state.doc.slice(0),
      editorRoot,
    );
    const mediaSrcs: string[] = [];
    copied.content.descendants((node) => {
      if (node.type.name === 'image' || node.type.name === 'cardVideo') {
        mediaSrcs.push(`${node.type.name}:${String(node.attrs.src ?? '')}`);
      }
    });

    expect(mediaSrcs).toEqual([
      'image:https://cdn.example/presigned-b',
      'cardVideo:https://cdn.example/presigned-c',
    ]);
    editor.destroy();
  });
});
