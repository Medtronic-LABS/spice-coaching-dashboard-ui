import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearnerRichCardBody } from '@/features/module-library/components/module-preview/LearnerRichCardBody';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';

vi.mock('@/features/module-library/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: 'https://example.com/img.png',
    isLoading: false,
    isError: false,
  }),
}));

describe('LearnerRichCardBody', () => {
  it('renders bold text in a paragraph', () => {
    const blocks: RichBlock[] = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Bold text',
            marks: [{ type: 'bold' }],
          },
        ],
      },
    ];

    render(<LearnerRichCardBody blocks={blocks} />);

    const strong = screen.getByText('Bold text');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders heading level 2', () => {
    const blocks: RichBlock[] = [
      {
        type: 'heading',
        level: 2,
        content: [{ type: 'text', text: 'Section title' }],
      },
    ];

    render(<LearnerRichCardBody blocks={blocks} />);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Section title',
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders bullet list items on separate rows with markers', () => {
    const blocks: RichBlock[] = [
      {
        type: 'bullet_list',
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
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Second item' }],
              },
            ],
          },
        ],
      },
    ];

    const { container } = render(<LearnerRichCardBody blocks={blocks} />);

    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    expect(container.textContent).toContain('•');
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });

  it('preserves newline breaks inside paragraph text', () => {
    const blocks: RichBlock[] = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Line one\nLine two' }],
      },
    ];

    const { container } = render(<LearnerRichCardBody blocks={blocks} />);
    const paragraph = container.querySelector('p');

    expect(paragraph).toHaveClass('whitespace-pre-line');
    expect(paragraph?.textContent).toBe('Line one\nLine two');
  });

  it('renders image block via presigned URL hook', () => {
    const blocks: RichBlock[] = [
      {
        type: 'image',
        attrs: {
          object_name: 'media/image.png',
          caption: 'Diagram',
        },
      },
    ];

    render(<LearnerRichCardBody blocks={blocks} />);

    expect(screen.getByRole('img', { name: 'Lesson image' })).toHaveAttribute(
      'src',
      'https://example.com/img.png',
    );
    expect(screen.queryByText('Diagram')).not.toBeInTheDocument();
  });

  it('renders playable video with native controls and no filename', () => {
    const blocks: RichBlock[] = [
      {
        type: 'video',
        attrs: {
          object_name: 'media/lesson.mp4',
          original_filename: 'lesson.mp4',
          content_type: 'video/mp4',
        },
      },
    ];

    render(<LearnerRichCardBody blocks={blocks} />);

    const video = screen.getByLabelText('Video');
    expect(video.tagName).toBe('VIDEO');
    expect(video).toHaveAttribute('controls');
    expect(screen.queryByText('lesson.mp4')).not.toBeInTheDocument();
  });

  it('renders playable audio with native controls', () => {
    const blocks: RichBlock[] = [
      {
        type: 'audio',
        attrs: {
          url: 'https://example.com/audio.mp3',
          title: 'Narration',
        },
      },
    ];

    render(<LearnerRichCardBody blocks={blocks} />);

    const audio = screen.getByLabelText('Narration');
    expect(audio.tagName).toBe('AUDIO');
    expect(audio).toHaveAttribute('controls');
  });

  it('renders nothing for an empty blocks array', () => {
    const { container } = render(<LearnerRichCardBody blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
