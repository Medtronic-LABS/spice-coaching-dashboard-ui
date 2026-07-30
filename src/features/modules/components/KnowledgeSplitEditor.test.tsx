import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeSplitEditor } from './KnowledgeSplitEditor';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';

vi.mock('@/features/modules/hooks/usePdfPageThumbnail', () => ({
  usePdfPageThumbnail: (_pdf: unknown, _page: unknown, enabled: boolean) => ({
    url: enabled ? 'blob:mock-auto-thumb' : null,
    isRendering: false,
  }),
}));

function draft(
  partial: Partial<KnowledgeSplitDraft> = {},
): KnowledgeSplitDraft {
  return {
    title: 'Split title',
    startPage: 1,
    endPage: 2,
    thumbnailFile: null,
    suppressAutoThumbnail: false,
    ...partial,
  };
}

describe('KnowledgeSplitEditor', () => {
  it('shows PDF auto preview and clearing leaves intentional blank for backend', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <KnowledgeSplitEditor
        index={0}
        value={draft()}
        onChange={onChange}
        onRemove={vi.fn()}
        pdfDocument={{} as PDFDocumentProxy}
        pageCount={5}
      />,
    );

    expect(screen.getByText(/thumbnail \(from pdf\)/i)).toBeInTheDocument();
    expect(screen.getByAltText('Split 1 thumbnail')).toHaveAttribute(
      'src',
      'blob:mock-auto-thumb',
    );

    await user.click(
      screen.getByRole('button', { name: /remove selected image/i }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnailFile: null,
        suppressAutoThumbnail: true,
      }),
    );
  });

  it('blank state shows backend copy and can restore PDF preview', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <KnowledgeSplitEditor
        index={0}
        value={draft({ suppressAutoThumbnail: true })}
        onChange={onChange}
        onRemove={vi.fn()}
        pdfDocument={{} as PDFDocumentProxy}
        pageCount={5}
      />,
    );

    expect(
      screen.getByText(/thumbnail \(blank — backend will generate\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/optional — leave blank for backend/i),
    ).toBeInTheDocument();
    expect(screen.queryByAltText('Split 1 thumbnail')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /use pdf preview/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnailFile: null,
        suppressAutoThumbnail: false,
      }),
    );
  });
});
