import type {
  AdminModuleDetailResponse,
  EditAdminModuleRequestBody,
} from '@/features/module-library/api/adminModulesApi';
import { applyEditModuleAndSyncRoute } from '@/features/module-library/utils/applyEditModuleAndSyncRoute';
import type { NavigateFunction } from 'react-router-dom';

type EditModuleTrigger = (args: {
  moduleId: string;
  body: EditAdminModuleRequestBody;
}) => { unwrap: () => Promise<unknown> };

export async function persistAdminModuleDraft(options: {
  working: AdminModuleDetailResponse;
  editModule: EditModuleTrigger;
  navigate: NavigateFunction;
  pathname: string;
  refetch: () => Promise<unknown>;
  onSaved: (data: AdminModuleDetailResponse) => void;
}): Promise<void> {
  const { working } = options;

  await applyEditModuleAndSyncRoute({
    editModule: options.editModule,
    navigate: options.navigate,
    pathname: options.pathname,
    moduleEntityId: working.id,
    body: {
      title_bn: working.title_bn ?? undefined,
      title_en: working.title_en ?? undefined,
      description_bn: working.description_bn ?? undefined,
      module_json: { cards: working.cards, quiz: working.quiz },
    },
    refetch: options.refetch,
  });

  const refreshed = await options.refetch();
  if (
    refreshed &&
    typeof refreshed === 'object' &&
    'data' in refreshed &&
    refreshed.data
  ) {
    options.onSaved(refreshed.data as AdminModuleDetailResponse);
    return;
  }
  options.onSaved(working);
}
