import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModuleSourceDocumentPanel } from '@/features/modules/components/ModuleSourceDocumentPanel';

describe('ModuleSourceDocumentPanel', () => {
  it('reserves right-side space for the source-document select arrow', () => {
    render(
      <ModuleSourceDocumentPanel
        documents={[
          {
            source_document_id: 'document-1.pdf',
            presigned_url: 'https://example.test/document-1.pdf',
            presigned_expires_seconds: 300,
          },
          {
            source_document_id: 'document-2.pdf',
            presigned_url: 'https://example.test/document-2.pdf',
            presigned_expires_seconds: 300,
          },
        ]}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveClass('select-arrow');
  });

  it('loads the PDF iframe with FitH preview params', () => {
    render(
      <ModuleSourceDocumentPanel
        documents={[
          {
            source_document_id: 'document-1.pdf',
            presigned_url: 'https://example.test/document-1.pdf',
            presigned_expires_seconds: 300,
          },
        ]}
      />,
    );

    expect(screen.getByTitle('document-1.pdf')).toHaveAttribute(
      'src',
      'https://example.test/document-1.pdf#toolbar=1&navpanes=0&scrollbar=1&view=FitH',
    );
  });
});
