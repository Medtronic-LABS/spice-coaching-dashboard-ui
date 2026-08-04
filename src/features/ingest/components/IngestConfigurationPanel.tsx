import { Select, Tooltip } from '@/components/ui';
import type {
  IngestAssessmentMode,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import { CONTENT_DOMAIN_TYPE_TOOLTIP } from '@/features/ingest/constants/ingestConfigurationTooltips';
import {
  INGEST_MODULE_COUNT_MAX,
  INGEST_MODULE_COUNT_MIN,
  INGEST_MODULE_COUNT_RANGE_LABEL,
  type IngestModuleCountInput,
  isIngestModuleCountInRange,
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

function parseOptionalModuleCount(
  raw: string,
  onChange: (value: IngestModuleCountInput) => void,
) {
  if (raw === '') {
    onChange('');
    return;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isNaN(parsed)) {
    onChange(parsed);
  }
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
        <div className="text-xs font-semibold tracking-wide text-spice-text-medium uppercase">
          Configuration
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block min-w-0 space-y-1">
            <span className="text-xs font-semibold text-spice-text-primary">
              Module content
            </span>
            <Select
              className="w-full rounded-lg"
              options={INGEST_ASSESSMENT_MODE_OPTIONS}
              value={assessmentMode}
              disabled={disabled}
              onChange={(value) =>
                onAssessmentModeChange(value as IngestAssessmentMode)
              }
            />
          </label>

          <label className="block min-w-0 space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-spice-text-primary">
              Content domain type
              <Tooltip
                label="About Content domain type"
                content={CONTENT_DOMAIN_TYPE_TOOLTIP}
              />
            </span>
            <Select
              className="w-full rounded-lg"
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
              type="number"
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={cardsPerModule}
              disabled={disabled}
              onChange={(e) =>
                parseOptionalModuleCount(e.target.value, onCardsPerModuleChange)
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
              type="number"
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={quizzesPerModule}
              disabled={disabled}
              onChange={(e) =>
                parseOptionalModuleCount(
                  e.target.value,
                  onQuizzesPerModuleChange,
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
          <textarea
            className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary placeholder:text-spice-text-muted"
            value={ingestionInstructions}
            disabled={disabled}
            onChange={(e) => onIngestionInstructionsChange(e.target.value)}
            placeholder={instructionsPlaceholder}
          />
        </label>
      </div>
    </div>
  );
};
