import { Card, KeyValue, Loader, Modal } from '@/components/ui';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import { useGetModuleDetailQuery } from '@/features/modules/api/adminModulesApi';
import { LearnerRichCardBody } from '@/features/modules/components/module-preview/LearnerRichCardBody';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  readLocaleOptions,
  readLocaleRichBody,
  readLocaleText,
} from '@/types/localized';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

export interface IngestMatchedModulePreviewModalProps {
  open: boolean;
  moduleId: string | null;
  onClose: () => void;
}

export const IngestMatchedModulePreviewModal = ({
  open,
  moduleId,
  onClose,
}: IngestMatchedModulePreviewModalProps) => {
  const {
    data: module,
    isLoading,
    isFetching,
    error,
  } = useGetModuleDetailQuery(moduleId ?? '', {
    skip: !open || !moduleId,
  });

  const lessons = module?.cards ?? [];
  const quizzes = module?.quiz ?? [];

  return (
    <Modal
      open={open}
      labelledBy="ingest-matched-module-preview-title"
      onClose={onClose}
      zIndexClassName="z-[320]"
    >
      <Card
        variant="elevated"
        className="flex h-[min(90vh,900px)] w-full max-w-4xl flex-col overflow-hidden border-spice-border p-0 shadow-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-spice-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="ingest-matched-module-preview-title"
              className="text-lg font-semibold text-spice-text-primary"
            >
              Module Content
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-spice-text-muted hover:bg-spice-bg-tint hover:text-spice-text-primary focus:outline-none transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {!moduleId ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              No module id was provided for this merge decision.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {formatRtkQueryError(error)}
            </div>
          ) : null}

          {module ? (
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-spice-text-primary">
                  Module details
                </h3>
                <div className="grid gap-2 rounded-lg border border-spice-border bg-spice-bg-tint/40 p-3 sm:grid-cols-2">
                  <KeyValue
                    label="Title"
                    value={resolveDisplayText(module.title)}
                  />
                  <KeyValue label="Domain" value={module.domain || '—'} />
                  <KeyValue
                    label="Lifecycle"
                    value={module.lifecycle_status || '—'}
                  />
                  <KeyValue
                    label="Version"
                    value={String(module.version ?? '—')}
                  />
                  <KeyValue
                    label="Lessons"
                    value={String(module.card_count ?? lessons.length)}
                  />
                  <KeyValue label="Quizzes" value={String(quizzes.length)} />
                  <KeyValue
                    label="Published"
                    value={
                      module.published_at
                        ? formatDisplayDateTime(module.published_at)
                        : '—'
                    }
                  />
                  <KeyValue
                    label="Estimated minutes"
                    value={String(module.estimated_minutes ?? '—')}
                  />
                </div>
                {module.description ? (
                  <p className="text-sm text-spice-text-medium">
                    {resolveDisplayText(module.description)}
                  </p>
                ) : null}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-spice-text-primary">
                  Lessons ({lessons.length})
                </h3>
                {lessons.length ? (
                  <div className="space-y-3">
                    {lessons.map((card, index) => {
                      const title = readLocaleText(
                        card.title,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      );
                      const body =
                        readLocaleRichBody(
                          card.body,
                          DEPLOYMENT_PRIMARY_LOCALE,
                          'en',
                        ) ?? [];
                      return (
                        <article
                          key={card.id || `lesson-${index}`}
                          className="rounded-lg border border-spice-border bg-spice-bg-surface p-3"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                            Lesson {index + 1}
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-spice-text-primary">
                            {title || `Lesson ${index + 1}`}
                          </h4>
                          <div className="mt-2">
                            <LearnerRichCardBody blocks={body} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-spice-text-muted">
                    No lessons in this module.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-spice-text-primary">
                  Quizzes ({quizzes.length})
                </h3>
                {quizzes.length ? (
                  <div className="space-y-3">
                    {quizzes.map((item, index) => {
                      const question = readLocaleText(
                        item.question,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      );
                      const caseSetup = readLocaleText(
                        item.case_setup,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      );
                      const explanation = readLocaleText(
                        item.explanation,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      );
                      const options = readLocaleOptions(
                        item.options,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      );
                      return (
                        <article
                          key={item.id || `quiz-${index}`}
                          className="rounded-lg border border-spice-border bg-spice-bg-surface p-3"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                            Question {index + 1}
                          </div>
                          {caseSetup ? (
                            <p className="mt-1 text-xs text-spice-text-muted">
                              {caseSetup}
                            </p>
                          ) : null}
                          <h4 className="mt-1 text-sm font-semibold text-spice-text-primary">
                            {question || `Question ${index + 1}`}
                          </h4>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-spice-text-medium">
                            {options.map((option, optionIndex) => {
                              const isCorrect = (
                                item.correct_indices ?? []
                              ).includes(optionIndex);
                              return (
                                <li
                                  key={`${item.id}-option-${optionIndex}`}
                                  className={
                                    isCorrect
                                      ? 'font-medium text-spice-semantic-success'
                                      : undefined
                                  }
                                >
                                  {option || `Option ${optionIndex + 1}`}
                                  {isCorrect ? ' (correct)' : ''}
                                </li>
                              );
                            })}
                          </ul>
                          {explanation ? (
                            <p className="mt-2 text-xs text-spice-text-muted">
                              {explanation}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-spice-text-muted">
                    No quiz questions in this module.
                  </p>
                )}
              </section>
            </div>
          ) : null}

          <Loader
            open={Boolean(moduleId) && (isLoading || isFetching) && !module}
            label="Loading module…"
          />
        </div>
      </Card>
    </Modal>
  );
};
