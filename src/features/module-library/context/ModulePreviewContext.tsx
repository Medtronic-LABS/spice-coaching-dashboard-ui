import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/module-library/types/modulePreview.types';
import { generateModulePreviewSnapshot } from '@/features/module-library/utils/generateModulePreviewSnapshot';
import {
  clampPosition,
  getInitialPosition,
} from '@/features/module-library/utils/modulePreviewNavigation';
import {
  selectAdminModuleBaseline,
  selectAdminModuleReviewIsDirty,
  selectAdminModuleWorking,
} from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

const EMPTY_SNAPSHOT: ModulePreviewSnapshot = {
  moduleTitle: 'Untitled module',
  cards: [],
  quiz: [],
  syncedAt: 0,
};

function formatSyncError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to refresh preview. Please try again.';
}

export interface ModulePreviewContextValue {
  isOpen: boolean;
  snapshot: ModulePreviewSnapshot | null;
  position: ModulePreviewPosition;
  syncError: string | null;
  isSyncing: boolean;
  isStale: boolean;
  openPreview: (context?: Partial<ModulePreviewPosition>) => void;
  closePreview: () => void;
  syncPreview: () => void;
  setPosition: (position: ModulePreviewPosition) => void;
  registerEditorContext: (context: Partial<ModulePreviewPosition>) => void;
}

export const ModulePreviewContext =
  createContext<ModulePreviewContextValue | null>(null);

export interface ModulePreviewProviderProps {
  moduleId: string;
  children: ReactNode;
}

export const ModulePreviewProvider = ({
  moduleId,
  children,
}: ModulePreviewProviderProps) => {
  const working = useAppSelector(selectAdminModuleWorking);
  const baseline = useAppSelector(selectAdminModuleBaseline);
  const isDirty = useAppSelector(selectAdminModuleReviewIsDirty);

  const seededRef = useRef<string | null>(null);

  const [snapshot, setSnapshot] = useState<ModulePreviewSnapshot | null>(null);
  const [position, setPosition] = useState<ModulePreviewPosition>({
    phase: 'card',
    index: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editorContext, setEditorContext] = useState<ModulePreviewPosition>({
    phase: 'card',
    index: 0,
  });

  useEffect(() => {
    seededRef.current = null;
    setSnapshot(null);
    setPosition({ phase: 'card', index: 0 });
    setSyncError(null);
    setIsOpen(false);
    setEditorContext({ phase: 'card', index: 0 });
  }, [moduleId]);

  useEffect(() => {
    if (!baseline || !moduleId) return;
    if (seededRef.current === moduleId) return;
    seededRef.current = moduleId;
    setSnapshot(generateModulePreviewSnapshot(baseline));
  }, [baseline, moduleId]);

  const syncPreview = useCallback(() => {
    if (!working) {
      setSyncError('Module not loaded.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const next = generateModulePreviewSnapshot(working);
      setSnapshot(next);
      setPosition((prev) => clampPosition(prev, next));
    } catch (error) {
      setSyncError(formatSyncError(error));
    } finally {
      setIsSyncing(false);
    }
  }, [working]);

  const openPreview = useCallback(
    (context?: Partial<ModulePreviewPosition>) => {
      let nextSnapshot = snapshot;
      if (!nextSnapshot) {
        const source = working ?? baseline;
        if (source) {
          nextSnapshot = generateModulePreviewSnapshot(source);
          setSnapshot(nextSnapshot);
        }
      }

      setPosition(
        getInitialPosition(
          nextSnapshot ?? EMPTY_SNAPSHOT,
          context ?? editorContext,
        ),
      );
      setIsOpen(true);
    },
    [snapshot, working, baseline, editorContext],
  );

  const closePreview = useCallback(() => {
    setIsOpen(false);
  }, []);

  const registerEditorContext = useCallback(
    (context: Partial<ModulePreviewPosition>) => {
      setEditorContext((prev) => {
        const next = { ...prev, ...context };
        if (isOpen && snapshot) {
          setPosition(getInitialPosition(snapshot, next));
        }
        return next;
      });
    },
    [isOpen, snapshot],
  );

  const value = useMemo<ModulePreviewContextValue>(
    () => ({
      isOpen,
      snapshot,
      position,
      syncError,
      isSyncing,
      isStale: isDirty,
      openPreview,
      closePreview,
      syncPreview,
      setPosition,
      registerEditorContext,
    }),
    [
      isOpen,
      snapshot,
      position,
      syncError,
      isSyncing,
      isDirty,
      openPreview,
      closePreview,
      syncPreview,
      registerEditorContext,
    ],
  );

  return (
    <ModulePreviewContext.Provider value={value}>
      {children}
    </ModulePreviewContext.Provider>
  );
};
