import type {
  AdminModuleDetailResponse,
  EditAdminModuleRequestBody,
  EditAdminModuleResponse,
} from '@/features/module-library/api/adminModulesApi';
import { applyEditModuleAndSyncRoute } from '@/features/module-library/utils/applyEditModuleAndSyncRoute';
import { prepareModuleJsonForSave } from '@/features/module-library/utils/prepareModuleJsonForSave';
import type { NavigateFunction } from 'react-router-dom';

type EditModuleTrigger = (args: {
  moduleId: string;
  body: EditAdminModuleRequestBody;
}) => { unwrap: () => Promise<EditAdminModuleResponse> };

function isAdminModuleDetailResponse(
  value: unknown,
): value is AdminModuleDetailResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' && typeof record.module_family_id === 'string'
  );
}

function readRefetchedModuleDetail(
  value: unknown,
): AdminModuleDetailResponse | null {
  if (!value || typeof value !== 'object' || !('data' in value)) return null;
  const data = (value as { data: unknown }).data;
  return isAdminModuleDetailResponse(data) ? data : null;
}

export async function persistAdminModuleDraft(options: {
  working: AdminModuleDetailResponse;
  editModule: EditModuleTrigger;
  navigate: NavigateFunction;
  pathname: string;
  refetchModule: (moduleId: string) => Promise<unknown>;
  onSaved: (data: AdminModuleDetailResponse) => void;
}): Promise<void> {
  const { working } = options;
  const { cards, quiz } = prepareModuleJsonForSave(working.cards, working.quiz);

  const response = await applyEditModuleAndSyncRoute({
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
      thumbnail_storage_path: working.thumbnail_storage_path,
    },
  });

  const savedModuleId = response.id;
  const savedSnapshot: AdminModuleDetailResponse = {
    ...working,
    id: savedModuleId,
    module_family_id: response.module_family_id,
    version: response.version,
    cards,
    quiz,
    module_json: { cards, quiz },
  };

  if (savedModuleId !== working.id) {
    options.onSaved(savedSnapshot);
  }

  const refreshed = await options.refetchModule(savedModuleId);
  const refetchedModule = readRefetchedModuleDetail(refreshed);
  if (refetchedModule) {
    options.onSaved(refetchedModule);
    return;
  }
  options.onSaved(savedSnapshot);
}
