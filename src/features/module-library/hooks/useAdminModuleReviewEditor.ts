import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEditModuleMutation } from '@/features/module-library/api/adminModulesApi';
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

  const save = useCallback(async () => {
    if (!working) {
      throw new Error('Module is not loaded.');
    }
    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname,
      refetch: query.refetch,
      onSaved: (data) => dispatch(markSaved(data)),
    });
  }, [dispatch, editModule, navigate, pathname, query.refetch, working]);

  const isSaving = editState.isLoading;

  return {
    working,
    isDirty,
    isSaving,
    save,
    formatError: formatRtkQueryError,
    ...query,
  };
}
