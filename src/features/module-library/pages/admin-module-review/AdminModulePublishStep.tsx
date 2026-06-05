import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Loader,
  ModulePublishedSuccessModal,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { ModuleReviewPublishView } from '@/features/module-library/components/ModuleReviewPublishView';
import { useSetClinicallyReviewedMutation } from '@/features/module-library/api/adminModulesApi';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import {
  countMediaTagsFromCards,
  mapAdminCardsToLessonRows,
  mapAdminQuizToRows,
} from '@/features/module-library/utils/moduleReviewPublishMappers';

export const AdminModulePublishStep = () => {
  const navigate = useNavigate();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const {
    working,
    isDirty,
    isLoading,
    isFetching,
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

  const goToModuleLibrary = useCallback(() => {
    setPublishSuccessOpen(false);
    navigate(paths.moduleLibrary);
  }, [navigate]);

  const modulePath = (suffix: string) =>
    `${paths.adminModuleReview.replace(':moduleId', encodeURIComponent(moduleId))}${suffix}`;

  const publishSummary = useMemo(() => {
    if (!working) return null;
    return {
      title: working.title_en ?? working.title_bn ?? 'Untitled module',
      topic: working.domain,
      lessonCount: working.cards.length,
      quizCount: working.quiz.length,
      estimateMinutes: working.estimated_minutes,
    };
  }, [working]);

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
  const busy = isFetching || isPublishing || isSaving;

  return (
    <section className="space-y-4">
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
        title={working.title_en ?? working.title_bn ?? 'Untitled module'}
        topic={working.domain}
        description={working.description_bn ?? ''}
        lessons={lessonRows}
        quizQuestions={quizRows}
        lessonCount={working.cards.length}
        quizCount={working.quiz.length}
        mediaFileCount={mediaCount}
        estimateMinutes={working.estimated_minutes}
        isAlreadyPublished={isAlreadyPublished}
        isPublishing={busy}
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
        onAssign={() =>
          navigate(paths.moduleAssigned, {
            state: {
              moduleName: moduleDisplayTitle,
              deadlineLabel: 'Mon, 28 Apr 2026',
              assignedCount: 8,
            },
          })
        }
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
        onPublish={async () => {
          if (isReadonly) return;
          setPublishError('');
          if (isAlreadyPublished) {
            goToModuleLibrary();
            return;
          }
          try {
            if (isDirty) {
              await save();
            }
            await setClinicallyReviewed({
              moduleId: working.id,
              body: { clinically_reviewed: true },
            }).unwrap();
            await refetch();
            setPublishSuccessOpen(true);
          } catch (err) {
            setPublishError(formatError(err));
          }
        }}
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
