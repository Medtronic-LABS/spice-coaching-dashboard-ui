import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AdminModuleDetailResponse,
  AdminModuleQuizItem,
} from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import type { RootState } from '@/store/store';

export interface AdminModuleReviewState {
  moduleId: string | null;
  working: AdminModuleDetailResponse | null;
  baseline: AdminModuleDetailResponse | null;
}

const initialState: AdminModuleReviewState = {
  moduleId: null,
  working: null,
  baseline: null,
};

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
        return;
      }

      if (!isDirty) {
        state.working = data;
        state.baseline = data;
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
    },
    markSaved(state, action: PayloadAction<AdminModuleDetailResponse>) {
      state.moduleId = action.payload.id;
      state.working = action.payload;
      state.baseline = action.payload;
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
    },
    discardChanges(state) {
      if (!state.baseline) return;
      state.working = state.baseline;
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
  discardChanges,
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

export const adminModuleReviewReducer = adminModuleReviewSlice.reducer;
