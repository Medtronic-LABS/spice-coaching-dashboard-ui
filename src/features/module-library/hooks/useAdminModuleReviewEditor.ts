import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  adminModulesApi,
  useEditModuleMutation,
  type AdminModuleDetailResponse,
} from '@/features/module-library/api/adminModulesApi';
import {
  hydrateFromServer,
  markSaved,
  selectAdminModuleReviewIsDirty,
  selectAdminModuleWorking,
} from '@/features/module-library/store/adminModuleReviewSlice';
import { useAdminModuleDetailQuery } from '@/features/module-library/hooks/useAdminModuleDetailQuery';
import { persistAdminModuleDraft } from '@/features/module-library/utils/persistAdminModuleDraft';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export function useAdminModuleReviewEditor(moduleId: string) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const working = useAppSelector(selectAdminModuleWorking);
  const isDirty = useAppSelector(selectAdminModuleReviewIsDirty);
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  const query = useAdminModuleDetailQuery(moduleId, {
    skip: !moduleId,
    useCache: true,
  });

  const [editModule, editState] = useEditModuleMutation();

  useEffect(() => {
    if (query.data && moduleId) {
      dispatch(hydrateFromServer({ moduleId, data: query.data }));
    }
  }, [dispatch, moduleId, query.data]);

  const refetchModule = useCallback(
    async (targetModuleId: string) => {
      const subscription = dispatch(
        adminModulesApi.endpoints.getModuleDetail.initiate(targetModuleId, {
          forceRefetch: true,
        }),
      );
      try {
        return await subscription;
      } finally {
        subscription.unsubscribe();
      }
    },
    [dispatch],
  );

  const save = useCallback(
    async (detailsOverride?: Partial<AdminModuleDetailResponse>) => {
      if (saveInFlightRef.current) {
        return saveInFlightRef.current;
      }

      const saveTask = (async () => {
        setIsPersisting(true);
        try {
          if (!working) {
            throw new Error('Module is not loaded.');
          }
          const nextWorking = detailsOverride
            ? { ...working, ...detailsOverride }
            : working;
          await persistAdminModuleDraft({
            working: nextWorking,
            editModule,
            navigate,
            pathname,
            refetchModule,
            onSaved: (data) => dispatch(markSaved(data)),
          });
        } finally {
          setIsPersisting(false);
        }
      })();

      saveInFlightRef.current = saveTask;
      try {
        await saveTask;
      } finally {
        if (saveInFlightRef.current === saveTask) {
          saveInFlightRef.current = null;
        }
      }
    },
    [dispatch, editModule, navigate, pathname, refetchModule, working],
  );

  const isSaving = editState.isLoading || isPersisting;

  return {
    working,
    isDirty,
    isSaving,
    save,
    formatError: formatRtkQueryError,
    ...query,
  };
}
