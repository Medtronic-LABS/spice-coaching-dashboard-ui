import type {
  AdminModuleDetailResponse,
  AdminModuleModuleJson,
  EditAdminModuleRequestBody,
  EditAdminModuleResponse,
} from '@/features/modules/api/adminModulesApi';
import { applyEditModuleAndSyncRoute } from '@/features/modules/utils/applyEditModuleAndSyncRoute';
import { prepareModuleJsonForSave } from '@/features/modules/utils/prepareModuleJsonForSave';
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
}): Promise<AdminModuleDetailResponse> {
  const { working } = options;
  const { cards, quiz } = prepareModuleJsonForSave(working.cards, working.quiz);

  const response = await applyEditModuleAndSyncRoute({
    editModule: options.editModule,
    navigate: options.navigate,
    pathname: options.pathname,
    moduleEntityId: working.id,
    body: {
      expected_version: working.version,
      title: working.title,
      description: working.description,
      module_json: { cards, quiz } as unknown as AdminModuleModuleJson,
      thumbnail_storage_path: working.thumbnail_storage_path,
    },
  });

  const savedModuleId = response.id;
  const savedSnapshot: AdminModuleDetailResponse = {
    ...working,
    id: savedModuleId,
    module_family_id: response.module_family_id,
    version: response.version,
    cards: working.cards,
    quiz: working.quiz,
    module_json: { cards: working.cards, quiz: working.quiz },
  };

  if (savedModuleId !== working.id) {
    options.onSaved(savedSnapshot);
  }

  const refreshed = await options.refetchModule(savedModuleId);
  const refetchedModule = readRefetchedModuleDetail(refreshed);
  if (refetchedModule) {
    options.onSaved(refetchedModule);
    return refetchedModule;
  }
  options.onSaved(savedSnapshot);
  return savedSnapshot;
}
