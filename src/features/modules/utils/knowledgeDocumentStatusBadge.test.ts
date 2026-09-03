import { describe, expect, it } from 'vitest';
import { getKnowledgeDocumentStatusBadgeProps } from '@/features/modules/utils/knowledgeDocumentStatusBadge';

describe('getKnowledgeDocumentStatusBadgeProps', () => {
  it('maps source document statuses to semantic badge props', () => {
    expect(getKnowledgeDocumentStatusBadgeProps('ingested')).toEqual({
      status: 'success',
      label: 'Ingested',
    });
    expect(getKnowledgeDocumentStatusBadgeProps('partially_succeeded')).toEqual(
      {
        status: 'warning',
        label: 'Partially Succeeded',
      },
    );
    expect(getKnowledgeDocumentStatusBadgeProps('failed')).toEqual({
      status: 'critical',
      label: 'Failed',
    });
    expect(getKnowledgeDocumentStatusBadgeProps('uploaded')).toEqual({
      status: 'info',
      label: 'Uploaded',
    });
    expect(getKnowledgeDocumentStatusBadgeProps('retired')).toEqual({
      status: 'warning',
      label: 'Retired',
    });
    expect(getKnowledgeDocumentStatusBadgeProps(undefined)).toEqual({
      status: 'neutral',
      label: 'Unknown',
    });
  });
});
