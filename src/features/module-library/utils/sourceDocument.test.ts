import { describe, expect, it } from 'vitest';
import type { AdminModuleSourceDocument } from '@/features/module-library/api/adminModulesApi';
import {
  sourceDocumentIsPdf,
  sourceDocumentLabel,
} from '@/features/module-library/utils/sourceDocument';

const sampleDoc: AdminModuleSourceDocument = {
  source_document_id: 'c3fd9673-d0e8-40cd-9636-402d4d0fcc83',
  presigned_url:
    'http://localhost:9002/bucket/file.pdf?response-content-disposition=inline%3B%20filename%3D%22Module%207%20Hindi.pdf%22&response-content-type=application%2Fpdf',
  presigned_expires_seconds: 86400,
};

const secondDoc: AdminModuleSourceDocument = {
  source_document_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  presigned_url:
    'http://localhost:9002/bucket/appendix.docx?response-content-type=application%2Fvnd.openxmlformats-officedocument.wordprocessingml.document',
  presigned_expires_seconds: 3600,
};

describe('sourceDocument', () => {
  it('reads filename from presigned URL', () => {
    expect(sourceDocumentLabel(sampleDoc)).toBe('Module 7 Hindi.pdf');
    expect(sourceDocumentIsPdf(sampleDoc)).toBe(true);
    expect(sourceDocumentIsPdf(secondDoc)).toBe(false);
  });

  it('labels non-pdf files from path when disposition is missing', () => {
    expect(sourceDocumentLabel(secondDoc)).toBe('appendix.docx');
  });
});
