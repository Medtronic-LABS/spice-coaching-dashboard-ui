import { describe, expect, it } from 'vitest';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
  uploadedDateInputToFromIso,
  uploadedDateInputToToIso,
} from '@/features/modules/utils/knowledgeLibraryFilters';

describe('knowledgeLibraryFilters', () => {
  it('hasActiveKnowledgeDrawerFilters is false for defaults', () => {
    expect(
      hasActiveKnowledgeDrawerFilters(KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS),
    ).toBe(false);
  });

  it('hasActiveKnowledgeDrawerFilters detects uploaded date filters', () => {
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedAtFrom: '2026-01-01',
        uploadedAtTo: '2026-01-31',
      }),
    ).toBe(true);
  });

  it('hasActiveKnowledgeDrawerFilters detects assignment and uploader filters', () => {
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        uploadedBy: 'alice',
      }),
    ).toBe(true);
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        assigned: 'true',
      }),
    ).toBe(true);
    expect(
      hasActiveKnowledgeDrawerFilters({
        ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
        ingested: 'false',
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
        uploadedAtFrom: '2026-02-01',
        uploadedAtTo: '2026-01-01',
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

  it('converts date inputs to inclusive UTC ISO bounds', () => {
    expect(uploadedDateInputToFromIso('2026-01-01')).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(uploadedDateInputToToIso('2026-01-01')).toBe(
      '2026-01-01T23:59:59.999Z',
    );
  });
});
