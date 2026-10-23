import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  FieldGroupLabel,
  Loader,
  useSnackbar,
} from '@/components/ui';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
import { AdminModuleDraftValidationDialog } from '@/features/modules/components/AdminModuleDraftValidationDialog';
import { ModulePublishedSuccessModal } from '@/features/modules/components/ModulePublishedSuccessModal';
import { ModuleReviewPublishView } from '@/features/modules/components/ModuleReviewPublishView';
import { ModuleSourceDocumentPanel } from '@/features/modules/components/ModuleSourceDocumentPanel';
import { usePublishModuleMutation } from '@/features/modules/api/moduleCreationPipelineApi';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { useQuizExplanationReview } from '@/features/modules/hooks/useQuizExplanationReview';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import { navigateToAdminModuleDraftIssue } from '@/features/modules/utils/adminModuleDraftIssueNavigation';
import {
  countMediaTagsFromCards,
  mapAdminCardsToLessonRows,
  mapAdminQuizToRows,
} from '@/features/modules/utils/moduleReviewPublishMappers';
import { formatModuleContentDomainLabel } from '@/features/ingest/constants/ingestFormOptions';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';
import { sourceDocumentLabel } from '@/features/modules/utils/sourceDocument';
import {
  isAdminModuleDraftValidationError,
  type AdminModuleDraftIssue,
} from '@/features/modules/utils/validateAdminModuleDraftContent';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import { readLocaleText } from '@/types/localized';

export const AdminModulePublishStep = () => {
  const navigate = useNavigate();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const {
    working,
    isDirty,
    isLoading,
    error,
    refetch,
    isSaving,
    save,
    formatError,
  } = useAdminModuleReviewEditor(moduleId);
  const [publishModule, { isLoading: isPublishing }] =
    usePublishModuleMutation();
  const snackbar = useSnackbar();
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [sourceDocOpen, setSourceDocOpen] = useState(false);
  const isReadonly = useAdminModuleReviewReadonly();
  const {
    registerEditorContext,
    isOpen: isPreviewOpen,
    closePreview,
  } = useModulePreview();
  const { validateBeforeProceed } = useQuizExplanationReview(moduleId);
  const {
    draftIssues,
    draftValidationOpen,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  } = useAdminModuleDraftSaveFeedback(formatError);

  const reviewDraftIssue = useCallback(
    (issue: AdminModuleDraftIssue) => {
      navigateToAdminModuleDraftIssue({
        navigate,
        moduleId,
        issue,
        onBeforeNavigate: closeDraftValidation,
      });
    },
    [closeDraftValidation, moduleId, navigate],
  );

  useEffect(() => {
    registerEditorContext({ phase: 'card', index: 0 });
  }, [registerEditorContext]);

  // Preview and source side panels both take horizontal space — only one at a time.
  useEffect(() => {
    if (isPreviewOpen) {
      setSourceDocOpen(false);
    }
  }, [isPreviewOpen]);

  const goToModuleLibrary = useCallback(() => {
    setPublishSuccessOpen(false);
    const state: ModuleLibraryLocationState = { tab: 'published' };
    navigate(paths.moduleLibrary, { state });
  }, [navigate]);

  const modulePath = (suffix: string) =>
    `${adminModuleReviewPaths.root(moduleId)}${suffix}`;

  const moduleDisplayTitle = working
    ? resolveDisplayText(working.title)
    : 'Untitled module';

  const sourceDocuments = working?.source_documents ?? [];
  const primarySourceDocument = sourceDocuments[0];
  const sourceFileName = primarySourceDocument
    ? sourceDocumentLabel(primarySourceDocument)
    : undefined;

  const publishSummary = useMemo(() => {
    if (!working) return null;
    return {
      title: moduleDisplayTitle,
      topic: formatModuleDomainLabel(working.domain),
      lessonCount: working.cards.length,
      quizCount: working.quiz.length,
      estimateMinutes: working.estimated_minutes,
    };
  }, [moduleDisplayTitle, working]);

  if (isLoading && !working) {
    return <Loader label="Loading module…" />;
  }

  if (error || !working) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatError(error) : 'Module not found.'}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const lessonRows = mapAdminCardsToLessonRows(working.cards);
  const quizRows = mapAdminQuizToRows(working.quiz);
  const mediaCount = countMediaTagsFromCards(working.cards);
  const isAlreadyPublished = working.lifecycle_status === 'published';
  const busy = isPublishing || isSaving;
  const busyLabel = isPublishing ? 'Publishing module…' : 'Saving module…';
  const showSourcePanel = sourceDocOpen && sourceDocuments.length > 0;

  return (
    <section className="space-y-4">
      <Loader open={busy} label={busyLabel} />
      {publishSummary ? (
        <ModulePublishedSuccessModal
          open={publishSuccessOpen}
          summary={publishSummary}
          onRedirect={goToModuleLibrary}
        />
      ) : null}
      <AdminModuleDraftValidationDialog
        open={draftValidationOpen}
        issues={draftIssues}
        onClose={closeDraftValidation}
        onReviewIssue={reviewDraftIssue}
      />
      <div
        className={
          showSourcePanel
            ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]'
            : undefined
        }
      >
        <ModuleReviewPublishView
          title={moduleDisplayTitle}
          topic={formatModuleDomainLabel(working.domain)}
          contentDomainType={formatModuleContentDomainLabel(
            working.content_domain,
          )}
          description={readLocaleText(
            working.description,
            DEPLOYMENT_PRIMARY_LOCALE,
          )}
          lessons={lessonRows}
          quizQuestions={quizRows}
          lessonCount={working.cards.length}
          quizCount={working.quiz.length}
          mediaFileCount={mediaCount}
          estimateMinutes={working.estimated_minutes}
          sourceFileName={sourceFileName}
          onPreviewSource={
            sourceDocuments.length
              ? () => {
                  closePreview();
                  setSourceDocOpen(true);
                }
              : undefined
          }
          isAlreadyPublished={isAlreadyPublished}
          isPublishing={isPublishing}
          isSaving={isSaving}
          readonly={isReadonly}
          unsavedChangesMessage={
            !isReadonly && isDirty
              ? 'You have unsaved changes. Save here or on any step before leaving this review flow.'
              : undefined
          }
          onEditDetails={() => navigate(modulePath('/details'))}
          onEditLessons={() => navigate(modulePath('/lessons'))}
          onEditQuiz={() => navigate(modulePath('/quiz'))}
          assignDisabled={Boolean(working.chatbot_faqs_only)}
          onAssign={() => {
            const state: ModuleLibraryLocationState = {
              tab: 'published',
              openAssignment: {
                moduleId: working.id,
                moduleTitle: moduleDisplayTitle,
              },
            };
            navigate(paths.moduleLibrary, { state });
          }}
          onBackToLibrary={goToModuleLibrary}
          onSave={
            isReadonly
              ? undefined
              : async () => {
                  clearSaveFeedback();
                  try {
                    await save();
                  } catch (err) {
                    captureSaveError(err);
                  }
                }
          }
          onPublish={() =>
            validateBeforeProceed(async () => {
              if (isReadonly) return;
              clearSaveFeedback();
              try {
                const moduleIdForPublish = isDirty
                  ? (await save()).id
                  : working.id;
                await publishModule({
                  moduleId: moduleIdForPublish,
                }).unwrap();
                await refetch();
                setPublishSuccessOpen(true);
              } catch (err) {
                if (isAdminModuleDraftValidationError(err)) {
                  captureSaveError(err);
                  return;
                }
                snackbar.showApiError(err);
              }
            })
          }
        />
        {showSourcePanel ? (
          <ModuleSourceDocumentPanel
            documents={sourceDocuments}
            onClose={() => setSourceDocOpen(false)}
            className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] xl:self-start"
          />
        ) : null}
      </div>
      {working.quality_flags?.flags?.length ? (
        <Card variant="bordered" className="space-y-2 p-4">
          <FieldGroupLabel>Quality flags</FieldGroupLabel>
          <ul className="list-inside list-disc text-xs text-spice-text-medium">
            {working.quality_flags.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </section>
  );
};
