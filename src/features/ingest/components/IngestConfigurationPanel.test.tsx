import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  INGEST_FORM_DEFAULTS,
  INGEST_MODULE_COUNT_MAX_DIGITS,
  type IngestModuleCountInput,
} from '@/features/ingest/constants/ingestFormDefaults';
import { IngestConfigurationPanel } from './IngestConfigurationPanel';

function PanelHarness() {
  const [cardsPerModule, setCardsPerModule] =
    useState<IngestModuleCountInput>('');
  const [quizzesPerModule, setQuizzesPerModule] =
    useState<IngestModuleCountInput>('');

  return (
    <IngestConfigurationPanel
      assessmentMode={INGEST_FORM_DEFAULTS.assessment_mode}
      onAssessmentModeChange={vi.fn()}
      contentDomain={INGEST_FORM_DEFAULTS.content_domain}
      onContentDomainChange={vi.fn()}
      cardsPerModule={cardsPerModule}
      onCardsPerModuleChange={setCardsPerModule}
      quizzesPerModule={quizzesPerModule}
      onQuizzesPerModuleChange={setQuizzesPerModule}
      ingestionInstructions=""
      onIngestionInstructionsChange={vi.fn()}
    />
  );
}

describe('IngestConfigurationPanel', () => {
  it('blocks extra digits on optional module counts', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);

    const cards = screen.getByLabelText(/^learning material per module$/i);
    const quizzes = screen.getByLabelText(/^quizzes per module$/i);

    expect(cards).toHaveAttribute(
      'maxLength',
      String(INGEST_MODULE_COUNT_MAX_DIGITS),
    );
    expect(quizzes).toHaveAttribute(
      'maxLength',
      String(INGEST_MODULE_COUNT_MAX_DIGITS),
    );

    await user.type(cards, '17');
    expect(cards).toHaveValue('1');

    await user.type(quizzes, '99');
    expect(quizzes).toHaveValue('9');
  });

  it('does not cap ingestion instructions', () => {
    render(<PanelHarness />);
    const instructions = screen.getByPlaceholderText(
      /focus on hypertension counselling workflows/i,
    );
    expect(instructions).not.toHaveAttribute('maxLength');
  });
});
