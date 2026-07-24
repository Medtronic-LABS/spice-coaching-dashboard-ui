import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/constants/routes';
import {
  acknowledgeExplanationReview,
  closeExplanationReviewDialog,
  openExplanationReviewDialog,
  selectExplanationReviewDialogOpen,
  selectHasPendingExplanationReviews,
  selectPendingExplanationReviewIds,
  selectShouldFocusPendingExplanation,
  setShouldFocusPendingExplanation,
} from '@/features/modules/store/adminModuleReviewSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function focusQuizExplanationField(quizId: string): void {
  const element = document.querySelector<HTMLTextAreaElement>(
    `[data-quiz-explanation-id="${quizId}"]`,
  );
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus();
  const end = element.value.length;
  element.setSelectionRange(end, end);
}

export function useQuizExplanationReview(moduleId: string) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pendingIds = useAppSelector(selectPendingExplanationReviewIds);
  const hasPendingReview = useAppSelector(selectHasPendingExplanationReviews);
  const dialogOpen = useAppSelector(selectExplanationReviewDialogOpen);
  const shouldFocus = useAppSelector(selectShouldFocusPendingExplanation);

  const quizPath = paths.adminModuleReviewQuiz.replace(
    ':moduleId',
    encodeURIComponent(moduleId),
  );
  const isOnQuizStep = pathname.endsWith('/quiz');

  const focusFirstPendingExplanation = useCallback(() => {
    const firstId = pendingIds[0];
    if (!firstId) return;
    focusQuizExplanationField(firstId);
    dispatch(setShouldFocusPendingExplanation(false));
  }, [dispatch, pendingIds]);

  useEffect(() => {
    if (!shouldFocus || pendingIds.length === 0 || !isOnQuizStep) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      focusFirstPendingExplanation();
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [
    focusFirstPendingExplanation,
    isOnQuizStep,
    pendingIds.length,
    shouldFocus,
  ]);

  const validateBeforeProceed = useCallback(
    (onProceed: () => void) => {
      if (!hasPendingReview) {
        onProceed();
        return;
      }
      dispatch(openExplanationReviewDialog());
    },
    [dispatch, hasPendingReview],
  );

  const handleReviewExplanations = useCallback(() => {
    dispatch(closeExplanationReviewDialog());
    dispatch(setShouldFocusPendingExplanation(true));

    if (isOnQuizStep) {
      window.setTimeout(() => focusFirstPendingExplanation(), 0);
      return;
    }

    navigate(quizPath);
  }, [
    dispatch,
    focusFirstPendingExplanation,
    isOnQuizStep,
    navigate,
    quizPath,
  ]);

  const acknowledgeReview = useCallback(
    (quizId: string) => {
      dispatch(acknowledgeExplanationReview(quizId));
    },
    [dispatch],
  );

  return {
    pendingIds,
    hasPendingReview,
    dialogOpen,
    validateBeforeProceed,
    handleReviewExplanations,
    acknowledgeReview,
  };
}
