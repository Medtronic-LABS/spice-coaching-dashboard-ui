import { describe, expect, it } from 'vitest';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
} from '@/features/modules/utils/knowledgeLibraryFilters';

describe('knowledgeLibraryFilters', () => {
  it('hasActiveKnowledgeDrawerFilters is false for defaults', () => {
    expect(
      hasActiveKnowledgeDrawerFilters(KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS),
    ).toBe(false);
  });

  it('hasActiveKnowledgeDrawerFilters detects non-default drawer fields', () => {
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedBy: 'Program Manager',
      }),
    ).toBe(true);
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        assigned: 'yes',
      }),
    ).toBe(true);
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedAtFrom: '2026-01-01',
        uploadedAtTo: '2026-01-31',
      }),
    ).toBe(true);
  });

  it('isKnowledgeDrawerDateRangeInvalid requires both ends and order', () => {
    expect(
      isKnowledgeDrawerDateRangeInvalid(
        KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
      ),
    ).toBe(false);
    expect(
      isKnowledgeDrawerDateRangeInvalid({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedAtFrom: '2026-01-01',
      }),
    ).toBe(true);
    expect(
      isKnowledgeDrawerDateRangeInvalid({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        updatedAtFrom: '2026-02-01',
        updatedAtTo: '2026-01-01',
      }),
    ).toBe(true);
    expect(
      isKnowledgeDrawerDateRangeInvalid({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedAtFrom: '2026-01-01',
        uploadedAtTo: '2026-01-31',
      }),
    ).toBe(false);
  });
});
