import { useCallback, useEffect } from 'react';
import {
  useGetModuleDraftQuery,
  useSaveModuleContentMutation,
  useSaveModuleDraftMutation,
  useSaveModuleQuizMutation,
} from '@/features/modules/api/moduleDraftApi';
import { useSaveModuleAsDraftMutation } from '@/features/modules/api/moduleCreationPipelineApi';
import {
  hydrateModuleFromServer,
  markModuleSaved,
  selectModuleIsDirty,
  selectModuleWorking,
} from '@/features/modules/store/moduleEditSlice';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

export function useModuleEditor() {
  const dispatch = useAppDispatch();
  const working = useAppSelector(selectModuleWorking);
  const isDirty = useAppSelector(selectModuleIsDirty);

  const query = useGetModuleDraftQuery();
  const [saveModuleContent, saveContentState] = useSaveModuleContentMutation();
  const [saveModuleQuiz, saveQuizState] = useSaveModuleQuizMutation();
  const [saveModuleDraftMock, saveMockDraftState] =
    useSaveModuleDraftMutation();
  const [saveModuleAsDraft, saveModuleDraftState] =
    useSaveModuleAsDraftMutation();

  const draftKey = query.data?.backendModuleId ?? query.data?.id ?? '';

  useEffect(() => {
    if (query.data && draftKey) {
      dispatch(hydrateModuleFromServer({ draftKey, data: query.data }));
    }
  }, [dispatch, draftKey, query.data]);

  const markRefetched = useCallback(async (): Promise<ModuleDraftData> => {
    const refreshed = await query.refetch();
    const saved: ModuleDraftData = refreshed.data ?? working!;
    dispatch(markModuleSaved(saved));
    return saved;
  }, [dispatch, query, working]);

  const saveContent = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveModuleContent({
      title: working.title,
      topic: working.topic,
      description: working.description,
      lessons: working.lessons,
      moduleContent: working.moduleContent,
      moduleDetails: working.moduleDetails,
      estimateMinutes: working.estimateMinutes,
    }).unwrap();

    await markRefetched();
  }, [markRefetched, saveModuleContent, working]);

  const saveQuiz = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveModuleQuiz({ quiz: working.quiz }).unwrap();
    await markRefetched();
  }, [markRefetched, saveModuleQuiz, working]);

  /** Review step: persist draft status and return to library (same as pre-Redux flow). */
  const saveReviewAndExit = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    if (working.backendModuleId) {
      await saveModuleAsDraft({ moduleId: working.backendModuleId }).unwrap();
    } else {
      await saveModuleDraftMock().unwrap();
    }
  }, [saveModuleDraftMock, saveModuleAsDraft, working]);

  const saveAllForLeave = useCallback(async () => {
    if (!working) {
      throw new Error('Module draft is not loaded.');
    }

    await saveModuleContent({
      title: working.title,
      topic: working.topic,
      description: working.description,
      lessons: working.lessons,
      moduleContent: working.moduleContent,
      moduleDetails: working.moduleDetails,
      estimateMinutes: working.estimateMinutes,
    }).unwrap();

    await saveModuleQuiz({ quiz: working.quiz }).unwrap();
    await markRefetched();
  }, [markRefetched, saveModuleContent, saveModuleQuiz, working]);

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
