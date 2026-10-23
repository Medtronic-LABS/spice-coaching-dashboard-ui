import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IngestAssessmentMode } from '@/features/ingest/api/adminIngestApi';
import {
  INGEST_FORM_DEFAULTS,
  INGEST_MODULE_COUNT_MAX_DIGITS,
  INGESTION_INSTRUCTIONS_MAX_LENGTH,
  INGESTION_INSTRUCTIONS_MAX_LINES,
  type IngestModuleCountInput,
} from '@/features/ingest/constants/ingestFormDefaults';
import { IngestConfigurationPanel } from './IngestConfigurationPanel';

function PanelHarness({
  initialAssessmentMode = INGEST_FORM_DEFAULTS.assessment_mode,
  initialInstructions = '',
}: {
  initialAssessmentMode?: IngestAssessmentMode;
  initialInstructions?: string;
}) {
  const [assessmentMode, setAssessmentMode] = useState<IngestAssessmentMode>(
    initialAssessmentMode,
  );
  const [cardsPerModule, setCardsPerModule] =
    useState<IngestModuleCountInput>('');
  const [quizzesPerModule, setQuizzesPerModule] =
    useState<IngestModuleCountInput>('');
  const [ingestionInstructions, setIngestionInstructions] =
    useState(initialInstructions);

  return (
    <IngestConfigurationPanel
      assessmentMode={assessmentMode}
      onAssessmentModeChange={setAssessmentMode}
      contentDomain={INGEST_FORM_DEFAULTS.content_domain}
      onContentDomainChange={vi.fn()}
      cardsPerModule={cardsPerModule}
      onCardsPerModuleChange={setCardsPerModule}
      quizzesPerModule={quizzesPerModule}
      onQuizzesPerModuleChange={setQuizzesPerModule}
      ingestionInstructions={ingestionInstructions}
      onIngestionInstructionsChange={setIngestionInstructions}
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

  it('hides quizzes per module when module content is Cards Only', () => {
    render(<PanelHarness initialAssessmentMode="read_only" />);

    expect(
      screen.queryByLabelText(/^quizzes per module$/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(/^learning material per module$/i),
    ).toBeInTheDocument();
  });

  it('clears quizzes per module when switching to Cards Only', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);

    const quizzes = screen.getByLabelText(/^quizzes per module$/i);
    await user.type(quizzes, '5');
    expect(quizzes).toHaveValue('5');

    await user.click(screen.getByRole('button', { name: /^module content$/i }));
    await user.click(screen.getByRole('option', { name: /cards only/i }));

    expect(
      screen.queryByLabelText(/^quizzes per module$/i),
    ).not.toBeInTheDocument();
  });

  it('caps ingestion instructions at the platform character limit', () => {
    render(<PanelHarness />);
    const instructions = screen.getByLabelText(/^ingestion instructions$/i);
    expect(instructions).toHaveAttribute(
      'maxLength',
      String(INGESTION_INSTRUCTIONS_MAX_LENGTH),
    );
  });

  it('shows a line-limit error when instructions exceed max lines', () => {
    const tooManyLines = Array.from(
      { length: INGESTION_INSTRUCTIONS_MAX_LINES + 1 },
      (_, i) => `line ${i}`,
    ).join('\n');

    render(<PanelHarness initialInstructions={tooManyLines} />);

    expect(
      screen.getByText(
        new RegExp(
          `enter at most ${INGESTION_INSTRUCTIONS_MAX_LINES} lines`,
          'i',
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^ingestion instructions$/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
