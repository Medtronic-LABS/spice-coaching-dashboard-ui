import { Button, Card } from '@/components/ui';

export interface ModuleReviewPublishLessonRow {
  id: string;
  title: string;
  mediaTags?: string[];
}

export interface ModuleReviewPublishQuizRow {
  id: string;
  question: string;
  answerSet: boolean;
}

export interface ModuleReviewPublishViewProps {
  title: string;
  topic: string;
  description: string;
  lessons: ModuleReviewPublishLessonRow[];
  quizQuestions: ModuleReviewPublishQuizRow[];
  lessonCount: number;
  quizCount: number;
  mediaFileCount?: number;
  estimateMinutes: number;
  sourceFileName?: string;
  sourceFileSizeLabel?: string;
  onEditDetails: () => void;
  onEditLessons: () => void;
  onEditQuiz: () => void;
  onPublish: () => void;
  /** Navigates to CHW assignment when the module is already published. */
  onAssign?: () => void;
  /** Returns to the module library when the module is already published. */
  onBackToLibrary?: () => void;
  onSave?: () => void;
  isPublishing: boolean;
  /** When true, disables the secondary save action on the publish card. */
  isSaving?: boolean;
  publishError?: string;
  isAlreadyPublished?: boolean;
  editActionLabel?: string;
  /** Shown when there are unsaved edits. */
  unsavedChangesMessage?: string;
  /** When true, publish is blocked until draft is saved. */
  publishDisabled?: boolean;
  /** When true, hides publish/save actions and shows read-only navigation links. */
  readonly?: boolean;
}

const EditLinkButton = ({
  label,
  onClick,
  showIcon = true,
}: {
  label: string;
  onClick: () => void;
  showIcon?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 text-xs font-semibold text-spice-brand-primary hover:underline"
  >
    {showIcon && <span aria-hidden="true">✎</span>}
    {label}
  </button>
);

const SectionLabel = ({ children }: { children: string }) => (
  <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
    {children}
  </div>
);

const MediaTag = ({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-md bg-spice-bg-tint px-2 py-0.5 text-[10px] font-medium text-spice-text-medium ring-1 ring-spice-border">
    {label}
  </span>
);

export const ModuleReviewPublishView = ({
  title,
  topic,
  description,
  lessons,
  quizQuestions,
  lessonCount,
  quizCount,
  mediaFileCount = 0,
  estimateMinutes,
  sourceFileName,
  sourceFileSizeLabel,
  onEditDetails,
  onEditLessons,
  onEditQuiz,
  onPublish,
  onAssign,
  onBackToLibrary,
  onSave,
  isPublishing,
  isSaving = false,
  publishError,
  isAlreadyPublished = false,
  editActionLabel = 'Edit',
  unsavedChangesMessage,
  publishDisabled = false,
  readonly = false,
}: ModuleReviewPublishViewProps) => {
  const sectionActionLabel = readonly ? 'View' : editActionLabel;
  const lessonLabel = lessonCount === 1 ? '1 lesson' : `${lessonCount} lessons`;
  const quizLabel = quizCount === 1 ? '1 question' : `${quizCount} questions`;

  return (
    <div className="space-y-4">
      {unsavedChangesMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {unsavedChangesMessage}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card variant="elevated" className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-spice-text-primary">
                Module Details
              </h2>
              <EditLinkButton
                label={sectionActionLabel}
                onClick={onEditDetails}
                showIcon={!readonly}
              />
            </div>
            <div className="space-y-3">
              <div>
                <SectionLabel>TITLE</SectionLabel>
                <div className="mt-1 text-sm font-semibold text-spice-text-primary">
                  {title}
                </div>
              </div>
              <div>
                <SectionLabel>TOPIC</SectionLabel>
                <div className="mt-1 text-sm text-spice-text-primary">
                  {topic}
                </div>
              </div>
              {description ? (
                <p className="text-sm leading-relaxed text-spice-text-medium">
                  {description}
                </p>
              ) : null}
            </div>
          </Card>

          <Card variant="elevated" className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-spice-text-primary">
                  Lessons
                </h2>
                <span className="text-xs text-spice-text-muted">
                  {lessonLabel}
                </span>
              </div>
              <EditLinkButton
                label={sectionActionLabel}
                onClick={onEditLessons}
                showIcon={!readonly}
              />
            </div>
            <ol className="space-y-2">
              {lessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-spice-bg-tint px-3 py-2.5"
                >
                  <span className="text-sm text-spice-text-primary">
                    <span className="font-medium text-spice-text-muted">
                      {index + 1}.{' '}
                    </span>
                    {lesson.title}
                  </span>
                  {lesson.mediaTags && lesson.mediaTags.length > 0 ? (
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {lesson.mediaTags.map((tag) => (
                        <MediaTag key={`${lesson.id}-${tag}`} label={tag} />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </Card>

          <Card variant="elevated" className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-spice-text-primary">
                  Quiz
                </h2>
                <span className="text-xs text-spice-text-muted">
                  {quizLabel}
                </span>
              </div>
              <EditLinkButton
                label={sectionActionLabel}
                onClick={onEditQuiz}
                showIcon={!readonly}
              />
            </div>
            <ul className="space-y-2">
              {quizQuestions.map((question) => (
                <li
                  key={question.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-spice-bg-tint px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-sm text-spice-text-primary">
                    {question.question || 'Untitled question'}
                  </span>
                  {question.answerSet ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-spice-semantic-success">
                      <span aria-hidden="true">✓</span>
                      Answer set
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-spice-text-muted">
                      No answer
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card variant="elevated" className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-spice-text-primary">
              Module Summary
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-spice-text-muted">Lessons</dt>
                <dd className="font-semibold text-spice-text-primary">
                  {lessonCount}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-spice-text-muted">Quiz Questions</dt>
                <dd className="font-semibold text-spice-text-primary">
                  {quizCount}
                </dd>
              </div>
              {mediaFileCount > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-spice-text-muted">Media files</dt>
                  <dd className="font-semibold text-spice-text-primary">
                    {mediaFileCount}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-spice-text-muted">Est. completion time</dt>
                <dd className="font-semibold text-spice-text-primary">
                  ~{estimateMinutes} min
                </dd>
              </div>
            </dl>
          </Card>

          {sourceFileName ? (
            <Card variant="elevated" className="space-y-2 p-4">
              <h3 className="text-sm font-semibold text-spice-text-primary">
                Source Document
              </h3>
              <div className="flex items-center gap-3 rounded-lg bg-spice-bg-tint px-3 py-3 ring-1 ring-spice-border">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg ring-1 ring-spice-border">
                  📄
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-spice-text-primary">
                    {sourceFileName}
                  </div>
                  {sourceFileSizeLabel ? (
                    <div className="text-xs text-spice-text-muted">
                      {sourceFileSizeLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          <div className="rounded-xl bg-spice-brand-primary p-5 text-white shadow-spiceCard">
            <div className="text-base font-semibold">
              {readonly
                ? 'Module review'
                : isAlreadyPublished
                  ? 'Published module'
                  : 'Ready to publish?'}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/90">
              {readonly
                ? 'Review module content before assigning it to CHWs.'
                : isAlreadyPublished
                  ? 'This module is already published. Assign it to CHWs or return to the module library.'
                  : 'This module will be added to the library. You can assign it to CHWs after publishing.'}
            </p>
            {publishError ? (
              <div className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-xs text-white">
                {publishError}
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {readonly || isAlreadyPublished ? (
                <>
                  {onAssign ? (
                    <Button
                      variant="secondary"
                      className="h-10 w-full bg-white text-spice-brand-primary hover:bg-white/95"
                      disabled={isPublishing || isSaving}
                      onClick={onAssign}
                    >
                      Assign to CHWs
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="h-10 w-full text-white ring-1 ring-white/40 hover:bg-white/10"
                    disabled={isPublishing || isSaving}
                    onClick={onBackToLibrary ?? onPublish}
                  >
                    Back to Module Library
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="h-10 w-full bg-white text-spice-brand-primary hover:bg-white/95"
                  disabled={isPublishing || isSaving || publishDisabled}
                  onClick={onPublish}
                >
                  {isPublishing ? 'Publishing…' : '↑ Publish Module'}
                </Button>
              )}
              {!readonly && onSave ? (
                <Button
                  variant="ghost"
                  className="h-10 w-full text-white ring-1 ring-white/40 hover:bg-white/10"
                  disabled={isPublishing || isSaving}
                  onClick={onSave}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
