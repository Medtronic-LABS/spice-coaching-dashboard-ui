import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AdminModuleDetailResponse,
  AdminModuleQuizItem,
} from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import type { ModuleVersionConflictDetail } from '@/features/modules/utils/parseModuleVersionConflictError';
import {
  buildBaselinesFromQuiz,
  ensureQuizContentBaselines,
  resolveExplanationReviewsOnSave,
  syncPendingExplanationReviews,
  type QuizContentBaseline,
} from '@/features/modules/utils/quizExplanationReviewUtils';
import type { RootState } from '@/store/store';

export interface AdminModuleReviewState {
  moduleId: string | null;
  working: AdminModuleDetailResponse | null;
  baseline: AdminModuleDetailResponse | null;
  quizContentBaselines: Record<string, QuizContentBaseline>;
  pendingExplanationReviewIds: string[];
  acknowledgedExplanationReviewIds: string[];
  shouldFocusPendingExplanation: boolean;
  explanationReviewDialogOpen: boolean;
  versionConflict: ModuleVersionConflictDetail | null;
}

const initialState: AdminModuleReviewState = {
  moduleId: null,
  working: null,
  baseline: null,
  quizContentBaselines: {},
  pendingExplanationReviewIds: [],
  acknowledgedExplanationReviewIds: [],
  shouldFocusPendingExplanation: false,
  explanationReviewDialogOpen: false,
  versionConflict: null,
};

function resetExplanationReviewState(
  state: AdminModuleReviewState,
  quiz: AdminModuleQuizItem[],
) {
  state.quizContentBaselines = buildBaselinesFromQuiz(quiz);
  state.pendingExplanationReviewIds = [];
  state.acknowledgedExplanationReviewIds = [];
  state.shouldFocusPendingExplanation = false;
}

function applyQuizContentBaselines(state: AdminModuleReviewState) {
  if (!state.working) return;
  state.quizContentBaselines = ensureQuizContentBaselines(
    state.working.quiz,
    state.baseline?.quiz ?? state.working.quiz,
    state.quizContentBaselines,
  );
}

function syncExplanationReviewState(state: AdminModuleReviewState) {
  if (!state.working) return;
  applyQuizContentBaselines(state);
  const synced = syncPendingExplanationReviews(
    state.working.quiz,
    state.quizContentBaselines,
    state.pendingExplanationReviewIds,
    state.acknowledgedExplanationReviewIds,
  );
  state.pendingExplanationReviewIds = synced.pendingIds;
  state.acknowledgedExplanationReviewIds = synced.acknowledgedIds;
}

function withSyncedCards(
  working: AdminModuleDetailResponse,
  cards: AdminModuleCard[],
): AdminModuleDetailResponse {
  return {
    ...working,
    cards,
    module_json: { ...working.module_json, cards, quiz: working.quiz },
  };
}

function withSyncedQuiz(
  working: AdminModuleDetailResponse,
  quiz: AdminModuleQuizItem[],
): AdminModuleDetailResponse {
  return {
    ...working,
    quiz,
    module_json: { ...working.module_json, cards: working.cards, quiz },
  };
}

export function editableSnapshot(module: AdminModuleDetailResponse): string {
  return JSON.stringify({
    title: module.title,
    description: module.description,
    cards: module.cards,
    quiz: module.quiz,
    thumbnail_storage_path: module.thumbnail_storage_path,
  });
}

export const adminModuleReviewSlice = createSlice({
  name: 'adminModuleReview',
  initialState,
  reducers: {
    clearAdminModuleReview(state) {
      state.moduleId = null;
      state.working = null;
      state.baseline = null;
      state.quizContentBaselines = {};
      state.pendingExplanationReviewIds = [];
      state.acknowledgedExplanationReviewIds = [];
      state.shouldFocusPendingExplanation = false;
      state.explanationReviewDialogOpen = false;
      state.versionConflict = null;
    },
    hydrateFromServer(
      state,
      action: PayloadAction<{
        moduleId: string;
        data: AdminModuleDetailResponse;
      }>,
    ) {
      const { moduleId, data } = action.payload;
      const isNewModule = state.moduleId !== moduleId;
      const isDirty =
        state.working &&
        state.baseline &&
        editableSnapshot(state.working) !== editableSnapshot(state.baseline);

      if (isNewModule || !state.working || !state.baseline) {
        state.moduleId = moduleId;
        state.working = data;
        state.baseline = data;
        resetExplanationReviewState(state, data.quiz);
        return;
      }

      if (!isDirty) {
        state.working = data;
        state.baseline = data;
        resetExplanationReviewState(state, data.quiz);
        return;
      }

      state.working = {
        ...data,
        title: state.working.title,
        description: state.working.description,
        cards: state.working.cards,
        quiz: state.working.quiz,
        thumbnail_storage_path: state.working.thumbnail_storage_path,
        thumbnail_presigned_url: state.working.thumbnail_presigned_url,
        thumbnail_presigned_expires_seconds:
          state.working.thumbnail_presigned_expires_seconds,
      };
      syncExplanationReviewState(state);
    },
    markSaved(state, action: PayloadAction<AdminModuleDetailResponse>) {
      state.moduleId = action.payload.id;
      state.working = action.payload;
      state.baseline = action.payload;
      state.versionConflict = null;
      const resolved = resolveExplanationReviewsOnSave(action.payload.quiz);
      state.quizContentBaselines = resolved.baselines;
      state.pendingExplanationReviewIds = resolved.pendingIds;
      state.acknowledgedExplanationReviewIds = resolved.acknowledgedIds;
    },
    updateDetails(
      state,
      action: PayloadAction<{
        title?: AdminModuleDetailResponse['title'];
        description?: AdminModuleDetailResponse['description'];
        thumbnail_storage_path?: string | null;
        thumbnail_presigned_url?: string | null;
      }>,
    ) {
      if (!state.working) return;
      state.working = { ...state.working, ...action.payload };
    },
    setCards(state, action: PayloadAction<AdminModuleCard[]>) {
      if (!state.working) return;
      state.working = withSyncedCards(state.working, action.payload);
    },
    updateCardAtIndex(
      state,
      action: PayloadAction<{ index: number; card: AdminModuleCard }>,
    ) {
      if (!state.working) return;
      const cards = [...state.working.cards];
      cards[action.payload.index] = action.payload.card;
      state.working = withSyncedCards(state.working, cards);
    },
    insertCardAtIndex(
      state,
      action: PayloadAction<{ index: number; card: AdminModuleCard }>,
    ) {
      if (!state.working) return;
      const cards = [...state.working.cards];
      const clampedIndex = Math.max(
        0,
        Math.min(action.payload.index, cards.length),
      );
      cards.splice(clampedIndex, 0, action.payload.card);
      state.working = withSyncedCards(state.working, cards);
    },
    removeCardAtIndex(state, action: PayloadAction<{ index: number }>) {
      if (!state.working) return;
      const cards = [...state.working.cards];
      if (action.payload.index < 0 || action.payload.index >= cards.length)
        return;
      cards.splice(action.payload.index, 1);
      state.working = withSyncedCards(state.working, cards);
    },
    setQuiz(state, action: PayloadAction<AdminModuleQuizItem[]>) {
      if (!state.working) return;
      state.working = withSyncedQuiz(state.working, action.payload);
      syncExplanationReviewState(state);
    },
    acknowledgeExplanationReview(state, action: PayloadAction<string>) {
      const quizId = action.payload;
      if (!state.pendingExplanationReviewIds.includes(quizId)) {
        return;
      }
      state.pendingExplanationReviewIds =
        state.pendingExplanationReviewIds.filter((id) => id !== quizId);
      if (!state.acknowledgedExplanationReviewIds.includes(quizId)) {
        state.acknowledgedExplanationReviewIds = [
          ...state.acknowledgedExplanationReviewIds,
          quizId,
        ];
      }
    },
    clearExplanationReviewAcknowledgement(
      state,
      action: PayloadAction<string>,
    ) {
      state.acknowledgedExplanationReviewIds =
        state.acknowledgedExplanationReviewIds.filter(
          (id) => id !== action.payload,
        );
    },
    setShouldFocusPendingExplanation(state, action: PayloadAction<boolean>) {
      state.shouldFocusPendingExplanation = action.payload;
    },
    openExplanationReviewDialog(state) {
      state.explanationReviewDialogOpen = true;
    },
    closeExplanationReviewDialog(state) {
      state.explanationReviewDialogOpen = false;
    },
    discardChanges(state) {
      if (!state.baseline) return;
      state.working = state.baseline;
      resetExplanationReviewState(state, state.baseline.quiz);
    },
    setVersionConflict(
      state,
      action: PayloadAction<ModuleVersionConflictDetail>,
    ) {
      state.versionConflict = action.payload;
    },
    clearVersionConflict(state) {
      state.versionConflict = null;
    },
  },
});

export const {
  clearAdminModuleReview,
  hydrateFromServer,
  markSaved,
  updateDetails,
  setCards,
  updateCardAtIndex,
  insertCardAtIndex,
  removeCardAtIndex,
  setQuiz,
  acknowledgeExplanationReview,
  clearExplanationReviewAcknowledgement,
  setShouldFocusPendingExplanation,
  openExplanationReviewDialog,
  closeExplanationReviewDialog,
  discardChanges,
  setVersionConflict,
  clearVersionConflict,
} = adminModuleReviewSlice.actions;

export const selectAdminModuleWorking = (state: RootState) =>
  state.adminModuleReview.working;

export const selectAdminModuleBaseline = (state: RootState) =>
  state.adminModuleReview.baseline;

export const selectAdminModuleReviewIsDirty = (state: RootState): boolean => {
  const { working, baseline } = state.adminModuleReview;
  if (!working || !baseline) return false;
  return editableSnapshot(working) !== editableSnapshot(baseline);
};

export const selectPendingExplanationReviewIds = (state: RootState): string[] =>
  state.adminModuleReview.pendingExplanationReviewIds;

export const selectHasPendingExplanationReviews = (state: RootState): boolean =>
  state.adminModuleReview.pendingExplanationReviewIds.length > 0;

export const selectShouldFocusPendingExplanation = (
  state: RootState,
): boolean => state.adminModuleReview.shouldFocusPendingExplanation;

export const selectExplanationReviewDialogOpen = (state: RootState): boolean =>
  state.adminModuleReview.explanationReviewDialogOpen;

export const selectModuleVersionConflict = (
  state: RootState,
): ModuleVersionConflictDetail | null =>
  state.adminModuleReview.versionConflict;

export const adminModuleReviewReducer = adminModuleReviewSlice.reducer;
