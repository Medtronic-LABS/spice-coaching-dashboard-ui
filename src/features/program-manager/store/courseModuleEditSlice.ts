import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CourseDraftData } from '@/features/program-manager/types/programManager.types';
import type { RootState } from '@/store/store';

export interface CourseModuleEditState {
  draftKey: string | null;
  working: CourseDraftData | null;
  baseline: CourseDraftData | null;
}

const initialState: CourseModuleEditState = {
  draftKey: null,
  working: null,
  baseline: null,
};

export function courseEditableSnapshot(draft: CourseDraftData): string {
  return JSON.stringify({
    title: draft.title,
    topic: draft.topic,
    description: draft.description,
    lessons: draft.lessons,
    quiz: draft.quiz,
  });
}

export const courseModuleEditSlice = createSlice({
  name: 'courseModuleEdit',
  initialState,
  reducers: {
    clearCourseModuleEdit(state) {
      state.draftKey = null;
      state.working = null;
      state.baseline = null;
    },
    hydrateCourseFromServer(
      state,
      action: PayloadAction<{ draftKey: string; data: CourseDraftData }>,
    ) {
      const { draftKey, data } = action.payload;
      const isNewDraft = state.draftKey !== draftKey;
      const isDirty =
        state.working &&
        state.baseline &&
        courseEditableSnapshot(state.working) !==
          courseEditableSnapshot(state.baseline);

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
    markCourseSaved(state, action: PayloadAction<CourseDraftData>) {
      state.working = action.payload;
      state.baseline = action.payload;
    },
    updateCourseDetails(
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
    setCourseLessons(state, action: PayloadAction<CourseDraftData['lessons']>) {
      if (!state.working) return;
      state.working = { ...state.working, lessons: action.payload };
    },
    setCourseQuiz(state, action: PayloadAction<CourseDraftData['quiz']>) {
      if (!state.working) return;
      state.working = { ...state.working, quiz: action.payload };
    },
    discardCourseChanges(state) {
      if (!state.baseline) return;
      state.working = state.baseline;
    },
  },
});

export const {
  clearCourseModuleEdit,
  hydrateCourseFromServer,
  markCourseSaved,
  updateCourseDetails,
  setCourseLessons,
  setCourseQuiz,
  discardCourseChanges,
} = courseModuleEditSlice.actions;

export const selectCourseModuleWorking = (state: RootState) =>
  state.courseModuleEdit.working;

export const selectCourseModuleIsDirty = (state: RootState): boolean => {
  const { working, baseline } = state.courseModuleEdit;
  if (!working || !baseline) return false;
  return courseEditableSnapshot(working) !== courseEditableSnapshot(baseline);
};

export const courseModuleEditReducer = courseModuleEditSlice.reducer;
