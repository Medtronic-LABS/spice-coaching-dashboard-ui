import type {
  AdminModuleDetailResponse,
  EditAdminModuleRequestBody,
} from '@/features/module-library/api/adminModulesApi';
import { applyEditModuleAndSyncRoute } from '@/features/module-library/utils/applyEditModuleAndSyncRoute';
import { prepareModuleJsonForSave } from '@/features/module-library/utils/prepareModuleJsonForSave';
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
  const { cards, quiz } = prepareModuleJsonForSave(working.cards, working.quiz);

  await applyEditModuleAndSyncRoute({
    editModule: options.editModule,
    navigate: options.navigate,
    pathname: options.pathname,
    moduleEntityId: working.id,
    body: {
      title_bn: working.title_bn ?? undefined,
      title_en: working.title_en ?? undefined,
      description_bn: working.description_bn ?? undefined,
      description_en: working.description_en ?? undefined,
      module_json: { cards, quiz },
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
  options.onSaved({
    ...working,
    cards,
    quiz,
    module_json: { cards, quiz },
  });
}
