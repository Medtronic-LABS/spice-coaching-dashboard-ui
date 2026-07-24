import type { AdminModuleDetailResponse } from '@/features/modules/api/adminModulesApi';
import type { ModuleCreationPipelineResponse } from '@/features/modules/types/modulePipeline.types';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import { mapModulePipelineToDraft } from '@/features/modules/utils/mapModulePipelineToDraft';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mapAdminModuleDetailToDraft(
  detail: AdminModuleDetailResponse,
): ModuleDraftData {
  const moduleJson = isPlainObject(detail.module_json)
    ? (detail.module_json as ModuleCreationPipelineResponse['module_json'])
    : undefined;

  const pipeline: ModuleCreationPipelineResponse = {
    document_id: detail.document_id ?? 'unknown_document',
    module_id: detail.module_id,
    clinical_domain: detail.clinical_domain,
    module_json: {
      estimated_time_minutes: detail.estimated_time_minutes,
      ...(moduleJson ?? {}),
    },
  };

  const draft = mapModulePipelineToDraft(pipeline, {
    sourceFileName: '—',
    title:
      (isPlainObject(moduleJson) && typeof moduleJson.title === 'string'
        ? moduleJson.title
        : undefined) ?? undefined,
    topic: detail.clinical_domain,
    description:
      (isPlainObject(moduleJson) && typeof moduleJson.description === 'string'
        ? moduleJson.description
        : undefined) ?? undefined,
    estimatedTimeMinutes: detail.estimated_time_minutes ?? 0,
  });

  return {
    ...draft,
    status:
      (detail.validation_status ?? '').toLowerCase() === 'published'
        ? 'published'
        : 'draft',
    isReadOnly: true,
  };
}
