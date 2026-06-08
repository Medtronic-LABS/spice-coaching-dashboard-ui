import { useCallback, useEffect } from 'react';
import {
  useGetCourseDraftQuery,
  useSaveCourseContentMutation,
  useSaveCourseDraftMutation,
  useSaveCourseQuizMutation,
} from '@/features/program-manager/api/programManagerApi';
import { useSaveModuleAsDraftMutation } from '@/features/program-manager/api/moduleCreationPipelineApi';
import {
  hydrateCourseFromServer,
  markCourseSaved,
  selectCourseModuleIsDirty,
  selectCourseModuleWorking,
} from '@/features/program-manager/store/courseModuleEditSlice';
import type { CourseDraftData } from '@/features/program-manager/types/programManager.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export function useCourseModuleEditor() {
  const dispatch = useAppDispatch();
  const working = useAppSelector(selectCourseModuleWorking);
  const isDirty = useAppSelector(selectCourseModuleIsDirty);

  const query = useGetCourseDraftQuery();
  const [saveCourseContent, saveContentState] = useSaveCourseContentMutation();
  const [saveCourseQuiz, saveQuizState] = useSaveCourseQuizMutation();
  const [saveCourseDraft, saveMockDraftState] = useSaveCourseDraftMutation();
  const [saveModuleAsDraft, saveModuleDraftState] =
    useSaveModuleAsDraftMutation();

  const draftKey = query.data?.backendModuleId ?? query.data?.id ?? '';

  useEffect(() => {
    if (query.data && draftKey) {
      dispatch(hydrateCourseFromServer({ draftKey, data: query.data }));
    }
  }, [dispatch, draftKey, query.data]);

  const markRefetched = useCallback(async (): Promise<CourseDraftData> => {
    const refreshed = await query.refetch();
    const saved: CourseDraftData = refreshed.data ?? working!;
    dispatch(markCourseSaved(saved));
    return saved;
  }, [dispatch, query, working]);

  const saveContent = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveCourseContent({
      title: working.title,
      topic: working.topic,
      description: working.description,
      lessons: working.lessons,
      moduleContent: working.moduleContent,
      moduleDetails: working.moduleDetails,
      estimateMinutes: working.estimateMinutes,
    }).unwrap();

    await markRefetched();
  }, [markRefetched, saveCourseContent, working]);

  const saveQuiz = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveCourseQuiz({ quiz: working.quiz }).unwrap();
    await markRefetched();
  }, [markRefetched, saveCourseQuiz, working]);

  /** Review step: persist draft status and return to library (same as pre-Redux flow). */
  const saveReviewAndExit = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    if (working.backendModuleId) {
      await saveModuleAsDraft({ moduleId: working.backendModuleId }).unwrap();
    } else {
      await saveCourseDraft().unwrap();
    }
  }, [saveCourseDraft, saveModuleAsDraft, working]);

  const saveAllForLeave = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveCourseContent({
      title: working.title,
      topic: working.topic,
      description: working.description,
      lessons: working.lessons,
      moduleContent: working.moduleContent,
      moduleDetails: working.moduleDetails,
      estimateMinutes: working.estimateMinutes,
    }).unwrap();

    await saveCourseQuiz({ quiz: working.quiz }).unwrap();
    await markRefetched();
  }, [markRefetched, saveCourseContent, saveCourseQuiz, working]);

  const isSavingContent = saveContentState.isLoading;
  const isSavingQuiz = saveQuizState.isLoading;
  const isSavingReview =
    saveMockDraftState.isLoading || saveModuleDraftState.isLoading;
  const isSaving = isSavingContent || isSavingQuiz || isSavingReview;

  return {
    working,
    isDirty,
    isSaving,
    isSavingContent,
    isSavingQuiz,
    isSavingReview,
    saveContent,
    saveQuiz,
    saveReviewAndExit,
    saveAllForLeave,
    formatError: formatRtkQueryError,
    ...query,
  };
}
