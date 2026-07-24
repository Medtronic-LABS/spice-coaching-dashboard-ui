import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import type { RootState } from '@/store/store';

export interface ModuleEditState {
  draftKey: string | null;
  working: ModuleDraftData | null;
  baseline: ModuleDraftData | null;
}

const initialState: ModuleEditState = {
  draftKey: null,
  working: null,
  baseline: null,
};

export function moduleEditableSnapshot(draft: ModuleDraftData): string {
  return JSON.stringify({
    title: draft.title,
    topic: draft.topic,
    description: draft.description,
    lessons: draft.lessons,
    quiz: draft.quiz,
  });
}

export const moduleEditSlice = createSlice({
  name: 'moduleEdit',
  initialState,
  reducers: {
    clearModuleEdit(state) {
      state.draftKey = null;
      state.working = null;
      state.baseline = null;
    },
    hydrateModuleFromServer(
      state,
      action: PayloadAction<{ draftKey: string; data: ModuleDraftData }>,
    ) {
      const { draftKey, data } = action.payload;
      const isNewDraft = state.draftKey !== draftKey;
      const isDirty =
        state.working &&
        state.baseline &&
        moduleEditableSnapshot(state.working) !==
          moduleEditableSnapshot(state.baseline);

      if (isNewDraft || !state.working || !state.baseline) {
        state.draftKey = draftKey;
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
        topic: state.working.topic,
        description: state.working.description,
        lessons: state.working.lessons,
        quiz: state.working.quiz,
      };
    },
    markModuleSaved(state, action: PayloadAction<ModuleDraftData>) {
      state.working = action.payload;
      state.baseline = action.payload;
    },
    updateModuleDetails(
      state,
      action: PayloadAction<{
        title?: string;
        topic?: string;
        description?: string;
      }>,
    ) {
      if (!state.working) return;
      state.working = { ...state.working, ...action.payload };
    },
    setModuleLessons(state, action: PayloadAction<ModuleDraftData['lessons']>) {
      if (!state.working) return;
      state.working = { ...state.working, lessons: action.payload };
    },
    setModuleQuiz(state, action: PayloadAction<ModuleDraftData['quiz']>) {
      if (!state.working) return;
      state.working = { ...state.working, quiz: action.payload };
    },
    discardModuleChanges(state) {
      if (!state.baseline) return;
      state.working = state.baseline;
    },
  },
});

export const {
  clearModuleEdit,
  hydrateModuleFromServer,
  markModuleSaved,
  updateModuleDetails,
  setModuleLessons,
  setModuleQuiz,
  discardModuleChanges,
} = moduleEditSlice.actions;

export const selectModuleWorking = (state: RootState) =>
  state.moduleEdit.working;

export const selectModuleIsDirty = (state: RootState): boolean => {
  const { working, baseline } = state.moduleEdit;
  if (!working || !baseline) return false;
  return moduleEditableSnapshot(working) !== moduleEditableSnapshot(baseline);
};

export const moduleEditReducer = moduleEditSlice.reducer;
