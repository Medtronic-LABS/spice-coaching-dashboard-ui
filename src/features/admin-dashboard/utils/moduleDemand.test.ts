import { describe, expect, it } from 'vitest';
import {
  existingModuleSearchCount,
  filterAndRankSearchedModules,
  mapDigitalHelpQuestionsToRows,
  mapDigitalHelpRequestsToRows,
  mapSuggestionEvidenceToRows,
  resolveSuggestionReasonLabel,
} from '@/features/admin-dashboard/utils/moduleDemand';
import type { DigitalHelpModuleUsageItem } from '@/features/admin-dashboard/types/dashboard.types';

function module(
  id: string,
  digitalHelpCount: number,
  moduleRequestedCount: number,
): DigitalHelpModuleUsageItem {
  return {
    module_id: id,
    module_family_id: null,
    title: { en: id },
    digital_help_count: digitalHelpCount,
    module_requested_count: moduleRequestedCount,
  };
}

const userSummary = {
  user_id: 10042,
  user_name: 'SK Name',
  user_role: 'SHASTIYA_KORMI',
  division: 'Rangpur',
  district: 'Lalmonirhat',
  upazila: 'Lalmonirhat Sadar',
};

describe('moduleDemand ranking', () => {
  it('combines chatbot and assignment counts for searched modules', () => {
    expect(existingModuleSearchCount(module('both', 12, 8))).toBe(20);
  });

  it('ranks searched modules by combined chatbot and assignment volume', () => {
    const modules = [
      module('high-requests', 5, 100),
      module('high-searches', 80, 2),
      module('both', 40, 40),
      module('no-activity', 0, 0),
    ];

    expect(
      filterAndRankSearchedModules(modules).map((item) => item.module_id),
    ).toEqual(['high-requests', 'high-searches', 'both']);
  });
});

describe('moduleDemand drill-down mappers', () => {
  it('maps chatbot questions with asked_by metadata', () => {
    const rows = mapDigitalHelpQuestionsToRows([
      {
        question: 'What are neonatal danger signs?',
        occurrence_count: 6,
        last_asked_at: '2026-07-29T14:22:10Z',
        asked_by: userSummary,
      },
    ]);

    expect(rows[0]).toMatchObject({
      primaryText: 'What are neonatal danger signs?',
      occurrenceCount: 6,
      timestamp: '2026-07-29T14:22:10Z',
      skId: 10042,
      skName: 'SK Name',
      division: 'Rangpur',
      district: 'Lalmonirhat',
      upazila: 'Lalmonirhat Sadar',
      interactionType: 'chatbot_served',
    });
    expect(rows[0]?.users).toHaveLength(1);
  });

  it('groups repeated questions into one row with multiple users', () => {
    const rows = mapDigitalHelpQuestionsToRows([
      {
        question: 'What are neonatal danger signs?',
        occurrence_count: 1,
        last_asked_at: '2026-08-12T19:55:50Z',
        asked_by: userSummary,
      },
      {
        question: 'What are neonatal danger signs?',
        occurrence_count: 1,
        last_asked_at: '2026-08-11T10:12:00Z',
        asked_by: {
          ...userSummary,
          user_id: 101,
          user_name: 'Mst. Hosneyara Begum',
          upazila: 'Hatibandha',
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.occurrenceCount).toBe(2);
    expect(rows[0]?.users.map((user) => user.skName)).toEqual([
      'SK Name',
      'Mst. Hosneyara Begum',
    ]);
  });

  it('maps assignment requests with requested_by metadata and fallback text', () => {
    const rows = mapDigitalHelpRequestsToRows(
      [
        {
          requested_at: '2026-07-29T10:12:00Z',
          reason: 'Need training on neonatal danger signs',
          requested_by: userSummary,
        },
        {
          requested_at: '2026-07-30T10:12:00Z',
          reason: null,
          requested_by: userSummary,
        },
      ],
      'Training access requested',
    );

    expect(rows[0]?.primaryText).toBe('Need training on neonatal danger signs');
    expect(rows[0]?.occurrenceCount).toBe(1);
    expect(rows[1]?.primaryText).toBe('Training access requested');
  });

  it('maps suggestion evidence with prompted_by metadata', () => {
    const rows = mapSuggestionEvidenceToRows(
      [
        {
          source: 'digital_help',
          text: 'How do I assess danger signs?',
          occurrence_count: 4,
          last_seen_at: '2026-07-29T14:22:10Z',
          prompted_by: userSummary,
        },
      ],
      'q',
      'Draft module exists',
    );

    expect(rows[0]).toMatchObject({
      skId: 10042,
      skName: 'SK Name',
      division: 'Rangpur',
      district: 'Lalmonirhat',
      upazila: 'Lalmonirhat Sadar',
      reason: 'Draft module exists',
    });
  });
});

describe('resolveSuggestionReasonLabel', () => {
  const translate = (key: string) => key;

  it('maps matched draft suggestions', () => {
    expect(
      resolveSuggestionReasonLabel(
        {
          suggestion_kind: 'matched_draft',
          rationale: null,
          proposed_topic: null,
          question_count: 1,
          request_count: 0,
        },
        translate,
      ),
    ).toBe('adminDashboard.suggestedModules.reasons.draftModule');
  });

  it('maps new topic requests', () => {
    expect(
      resolveSuggestionReasonLabel(
        {
          suggestion_kind: 'new_topic',
          rationale: null,
          proposed_topic: null,
          question_count: 0,
          request_count: 3,
        },
        translate,
      ),
    ).toBe('adminDashboard.suggestedModules.reasons.newTopicRequest');
  });

  it('maps proposed topics without matching modules', () => {
    expect(
      resolveSuggestionReasonLabel(
        {
          suggestion_kind: 'proposed_topic',
          rationale: null,
          proposed_topic: 'Neonatal danger signs',
          question_count: 2,
          request_count: 1,
        },
        translate,
      ),
    ).toBe('adminDashboard.suggestedModules.reasons.noMatchingModule');
  });

  it('maps insufficient metadata rationale', () => {
    expect(
      resolveSuggestionReasonLabel(
        {
          suggestion_kind: 'other',
          rationale: 'Insufficient metadata for matching',
          proposed_topic: null,
          question_count: 2,
          request_count: 1,
        },
        translate,
      ),
    ).toBe('adminDashboard.suggestedModules.reasons.insufficientMetadata');
  });
});
