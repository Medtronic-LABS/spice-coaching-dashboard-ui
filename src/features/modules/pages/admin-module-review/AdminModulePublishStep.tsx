import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Loader,
  ModulePublishedSuccessModal,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { ModuleReviewPublishView } from '@/features/modules/components/ModuleReviewPublishView';
import { useSetClinicallyReviewedMutation } from '@/features/modules/api/adminModulesApi';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { useQuizExplanationReview } from '@/features/modules/hooks/useQuizExplanationReview';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import {
  countMediaTagsFromCards,
  mapAdminCardsToLessonRows,
  mapAdminQuizToRows,
} from '@/features/modules/utils/moduleReviewPublishMappers';
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
  const [setClinicallyReviewed, { isLoading: isPublishing }] =
    useSetClinicallyReviewedMutation();
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [saveError, setSaveError] = useState('');
  const isReadonly = useAdminModuleReviewReadonly();
  const { registerEditorContext } = useModulePreview();
  const { validateBeforeProceed } = useQuizExplanationReview(moduleId);

  useEffect(() => {
    registerEditorContext({ phase: 'card', index: 0 });
  }, [registerEditorContext]);

  const goToModuleLibrary = useCallback(() => {
    setPublishSuccessOpen(false);
    const state: ModuleLibraryLocationState = { tab: 'published' };
    navigate(paths.moduleLibrary, { state });
  }, [navigate]);

  const modulePath = (suffix: string) =>
    `${paths.adminModuleReview.replace(':moduleId', encodeURIComponent(moduleId))}${suffix}`;

  const moduleDisplayTitle = working
    ? resolveDisplayText(working.title)
    : 'Untitled module';

  const publishSummary = useMemo(() => {
    if (!working) return null;
    return {
      title: moduleDisplayTitle,
      topic: working.domain,
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
  const isAlreadyPublished =
    working.clinically_reviewed || working.lifecycle_status === 'published';
  const busy = isPublishing || isSaving;
  const busyLabel = isPublishing ? 'Publishing module…' : 'Saving module…';

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
      {saveError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {saveError}
        </div>
      ) : null}
      <ModuleReviewPublishView
        title={moduleDisplayTitle}
        topic={working.domain}
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
        isAlreadyPublished={isAlreadyPublished}
        isPublishing={isPublishing}
        publishError={publishError}
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
                setSaveError('');
                try {
                  await save();
                } catch (err) {
                  setSaveError(formatError(err));
                }
              }
        }
        onPublish={() =>
          validateBeforeProceed(async () => {
            if (isReadonly) return;
            setPublishError('');
            try {
              const moduleIdForPublish = isDirty
                ? (await save()).id
                : working.id;
              await setClinicallyReviewed({
                moduleId: moduleIdForPublish,
                body: { clinically_reviewed: true },
              }).unwrap();
              await refetch();
              setPublishSuccessOpen(true);
            } catch (err) {
              setPublishError(formatError(err));
            }
          })
        }
      />
      {working.quality_flags?.flags?.length ? (
        <Card variant="bordered" className="space-y-2 p-4">
          <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
            Quality flags
          </div>
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
