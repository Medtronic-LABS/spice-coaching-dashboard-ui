import { LimitedTextarea, Select, Tooltip } from '@/components/ui';
import type {
  IngestAssessmentMode,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import { CONTENT_DOMAIN_TYPE_TOOLTIP } from '@/features/ingest/constants/ingestConfigurationTooltips';
import {
  INGEST_MODULE_COUNT_MAX,
  INGEST_MODULE_COUNT_MAX_DIGITS,
  INGEST_MODULE_COUNT_MIN,
  INGEST_MODULE_COUNT_RANGE_LABEL,
  INGESTION_INSTRUCTIONS_LIMIT_LABEL,
  INGESTION_INSTRUCTIONS_MAX_LENGTH,
  INGESTION_INSTRUCTIONS_MAX_LINES,
  type IngestModuleCountInput,
  countIngestionInstructionLines,
  isIngestModuleCountInRange,
  isIngestionInstructionsValid,
  parseOptionalIngestModuleCountInput,
} from '@/features/ingest/constants/ingestFormDefaults';
import {
  INGEST_ASSESSMENT_MODE_OPTIONS,
  INGEST_CONTENT_DOMAIN_OPTIONS,
} from '@/features/ingest/constants/ingestFormOptions';
import { cn } from '@/utils';

const DEFAULT_INSTRUCTIONS_PLACEHOLDER =
  'e.g. Focus on hypertension counselling workflows…';

export interface IngestConfigurationPanelProps {
  disabled?: boolean;
  assessmentMode: IngestAssessmentMode;
  onAssessmentModeChange: (value: IngestAssessmentMode) => void;
  contentDomain: IngestContentDomain;
  onContentDomainChange: (value: IngestContentDomain) => void;
  cardsPerModule: IngestModuleCountInput;
  onCardsPerModuleChange: (value: IngestModuleCountInput) => void;
  quizzesPerModule: IngestModuleCountInput;
  onQuizzesPerModuleChange: (value: IngestModuleCountInput) => void;
  ingestionInstructions: string;
  onIngestionInstructionsChange: (value: string) => void;
  instructionsPlaceholder?: string;
  className?: string;
}

export const IngestConfigurationPanel = ({
  disabled = false,
  assessmentMode,
  onAssessmentModeChange,
  contentDomain,
  onContentDomainChange,
  cardsPerModule,
  onCardsPerModuleChange,
  quizzesPerModule,
  onQuizzesPerModuleChange,
  ingestionInstructions,
  onIngestionInstructionsChange,
  instructionsPlaceholder = DEFAULT_INSTRUCTIONS_PLACEHOLDER,
  className,
}: IngestConfigurationPanelProps) => {
  const instructionsLineCount = countIngestionInstructionLines(
    ingestionInstructions,
  );
  const instructionsValid = isIngestionInstructionsValid(ingestionInstructions);

  return (
    <div
      className={cn(
        'relative min-w-0 overflow-hidden rounded-xl border border-spice-border-mid/70 bg-gradient-to-b from-spice-bg-tint/75 via-spice-bg-tint/40 to-spice-bg-surface/5 p-4 shadow-sm ring-1 ring-inset ring-white/50 sm:p-5',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 bg-gradient-to-b from-transparent via-spice-bg-surface/50 to-spice-bg-surface"
        aria-hidden
      />

      <div className="relative z-10 space-y-4">
        <h2 className="text-sm font-semibold text-spice-text-primary sm:text-base">
          Configuration
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block min-w-0 space-y-1">
            <span className="flex min-h-5 items-center text-xs font-semibold text-spice-text-primary">
              Module content
            </span>
            <Select
              className="w-full"
              options={INGEST_ASSESSMENT_MODE_OPTIONS}
              value={assessmentMode}
              disabled={disabled}
              onChange={(value) =>
                onAssessmentModeChange(value as IngestAssessmentMode)
              }
            />
          </label>

          <label className="block min-w-0 space-y-1">
            <span className="flex min-h-5 items-center gap-1.5 text-xs font-semibold text-spice-text-primary">
              Content domain type
              <Tooltip
                label="About Content domain type"
                content={CONTENT_DOMAIN_TYPE_TOOLTIP}
                placement="top"
              />
            </span>
            <Select
              className="w-full"
              options={INGEST_CONTENT_DOMAIN_OPTIONS}
              value={contentDomain}
              disabled={disabled}
              onChange={(value) =>
                onContentDomainChange(value as IngestContentDomain)
              }
            />
          </label>

          <label className="block min-w-0 space-y-1">
            <span className="text-xs font-semibold text-spice-text-primary">
              Learning Material per Module{' '}
              <span className="font-normal text-spice-text-muted/65">
                (Optional)
              </span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={INGEST_MODULE_COUNT_MAX_DIGITS}
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={cardsPerModule}
              disabled={disabled}
              aria-label="Learning material per module"
              onChange={(e) =>
                onCardsPerModuleChange(
                  parseOptionalIngestModuleCountInput(e.target.value),
                )
              }
              placeholder="e.g. 5"
            />
            {cardsPerModule !== '' &&
            !isIngestModuleCountInRange(cardsPerModule) ? (
              <span className="text-[11px] text-spice-semantic-error">
                Enter a number from {INGEST_MODULE_COUNT_MIN} to{' '}
                {INGEST_MODULE_COUNT_MAX}.
              </span>
            ) : (
              <span className="text-[11px] text-spice-text-muted">
                {INGEST_MODULE_COUNT_RANGE_LABEL}
              </span>
            )}
          </label>

          <label className="block min-w-0 space-y-1">
            <span className="text-xs font-semibold text-spice-text-primary">
              Quizzes per Module{' '}
              <span className="font-normal text-spice-text-muted/65">
                (Optional)
              </span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={INGEST_MODULE_COUNT_MAX_DIGITS}
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={quizzesPerModule}
              disabled={disabled}
              aria-label="Quizzes per module"
              onChange={(e) =>
                onQuizzesPerModuleChange(
                  parseOptionalIngestModuleCountInput(e.target.value),
                )
              }
              placeholder="e.g. 5"
            />
            {quizzesPerModule !== '' &&
            !isIngestModuleCountInRange(quizzesPerModule) ? (
              <span className="text-[11px] text-spice-semantic-error">
                Enter a number from {INGEST_MODULE_COUNT_MIN} to{' '}
                {INGEST_MODULE_COUNT_MAX}.
              </span>
            ) : (
              <span className="text-[11px] text-spice-text-muted">
                {INGEST_MODULE_COUNT_RANGE_LABEL}
              </span>
            )}
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-spice-text-primary">
            Ingestion instructions{' '}
            <span className="font-normal text-spice-text-muted/65">
              (Optional)
            </span>
          </span>
          <LimitedTextarea
            id="ingest-ingestion-instructions"
            value={ingestionInstructions}
            disabled={disabled}
            maxLength={INGESTION_INSTRUCTIONS_MAX_LENGTH}
            onChange={onIngestionInstructionsChange}
            placeholder={instructionsPlaceholder}
            aria-invalid={!instructionsValid}
            aria-label="Ingestion instructions"
            textareaClassName={cn(
              'min-h-[84px] placeholder:text-spice-text-muted',
              !instructionsValid && 'border-spice-semantic-error',
            )}
          />
          {!instructionsValid ? (
            <span className="text-[11px] text-spice-semantic-error">
              Enter at most {INGESTION_INSTRUCTIONS_MAX_LINES} lines (
              {instructionsLineCount} used).
            </span>
          ) : (
            <span className="text-[11px] text-spice-text-muted">
              {INGESTION_INSTRUCTIONS_LIMIT_LABEL}
            </span>
          )}
        </label>
      </div>
    </div>
  );
};
