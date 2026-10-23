import { describe, expect, it } from 'vitest';
import {
  formatModuleDemandSummaryDateLabel,
  hasModuleDemandSummaryContent,
  normalizeModuleDemandSummaryResponse,
  resolveModuleDemandSummaryBucket,
} from '@/features/admin-dashboard/utils/normalizeModuleDemandSummaryResponse';
import { formatDisplayDate } from '@/utils/formatDisplayDateTime';

function expectedDateLabel(fromDate: string, toDate: string): string {
  return `${formatDisplayDate(fromDate)}–${formatDisplayDate(toDate)}`;
}

const SAMPLE_RESPONSE = {
  from_date: '2026-08-01',
  to_date: '2026-08-18',
  title: 'Insights from Module Usage',
  date_label: 'Aug 1–18, 2026',
  narrative:
    'Most demand can be addressed with existing or draft content. Prioritize assigning high-demand published modules, publish matching drafts to close immediate gaps, and create new content only for topics with no existing coverage.',
  empty_message: null,
  demand_pattern: [
    {
      bucket: 'assign',
      title: 'Existing coverage',
      description: 'Demand is concentrated around a few published modules',
    },
    {
      bucket: 'publish',
      title: 'Ready to publish',
      description: 'Some unanswered demand already has draft content',
    },
    {
      bucket: 'create',
      title: 'Content gaps',
      description: 'Remaining demand represents opportunities for new modules',
    },
  ],
};

describe('normalizeModuleDemandSummaryResponse', () => {
  it('parses structured summary fields and demand pattern items', () => {
    expect(normalizeModuleDemandSummaryResponse(SAMPLE_RESPONSE)).toEqual({
      ...SAMPLE_RESPONSE,
      demand_pattern: SAMPLE_RESPONSE.demand_pattern.map((item) => ({
        ...item,
        bucket: item.bucket as 'assign' | 'publish' | 'create',
      })),
    });
  });

  it('builds date_label from from_date and to_date when omitted', () => {
    const normalized = normalizeModuleDemandSummaryResponse({
      from_date: '2026-08-01',
      to_date: '2026-08-18',
      title: 'Insights from Module Usage',
      narrative: 'Summary text',
      demand_pattern: [],
    });

    expect(normalized.date_label).toBe(
      expectedDateLabel('2026-08-01', '2026-08-18'),
    );
  });

  it('returns empty summary for invalid payloads', () => {
    expect(normalizeModuleDemandSummaryResponse(null)).toEqual({
      from_date: '',
      to_date: '',
      title: '',
      date_label: '',
      narrative: '',
      empty_message: null,
      demand_pattern: [],
    });
  });

  it('preserves empty_message when provided', () => {
    expect(
      normalizeModuleDemandSummaryResponse({
        from_date: '2026-08-01',
        to_date: '2026-08-18',
        empty_message: 'No module demand in this range.',
      }).empty_message,
    ).toBe('No module demand in this range.');
  });

  it('maps legacy summary prose into narrative', () => {
    const normalized = normalizeModuleDemandSummaryResponse({
      from_date: '2026-07-01',
      to_date: '2026-07-31',
      summary:
        'Between 2026-07-01 to 2026-07-31, CHWs used digital help most on neonatal danger signs.',
    });

    expect(normalized.narrative).toContain('neonatal danger signs');
    expect(normalized.demand_pattern).toEqual([]);
  });
});

describe('resolveModuleDemandSummaryBucket', () => {
  it('maps known bucket values', () => {
    expect(resolveModuleDemandSummaryBucket('assign')).toBe('assign');
    expect(resolveModuleDemandSummaryBucket('publish')).toBe('publish');
    expect(resolveModuleDemandSummaryBucket('create')).toBe('create');
    expect(resolveModuleDemandSummaryBucket('unknown')).toBe('other');
  });
});

describe('hasModuleDemandSummaryContent', () => {
  it('detects when structured content is present', () => {
    expect(
      hasModuleDemandSummaryContent(
        normalizeModuleDemandSummaryResponse(SAMPLE_RESPONSE),
      ),
    ).toBe(true);
    expect(
      hasModuleDemandSummaryContent(
        normalizeModuleDemandSummaryResponse({
          from_date: '2026-08-01',
          to_date: '2026-08-18',
          empty_message: 'No demand',
        }),
      ),
    ).toBe(false);
  });
});

describe('formatModuleDemandSummaryDateLabel', () => {
  it('formats ISO dates for display', () => {
    expect(formatModuleDemandSummaryDateLabel('2026-08-01', '2026-08-18')).toBe(
      expectedDateLabel('2026-08-01', '2026-08-18'),
    );
  });
});
