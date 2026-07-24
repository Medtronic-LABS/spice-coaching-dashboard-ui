export interface ModuleVersionConflictDetail {
  code: 'module_version_conflict';
  message: string;
  expected_version: number;
  current_version: number;
  latest_module_id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFetchBaseQueryError(
  error: unknown,
): error is { status: number; data?: unknown } {
  return (
    isRecord(error) && 'status' in error && typeof error.status === 'number'
  );
}

function isModuleVersionConflictDetail(
  value: unknown,
): value is ModuleVersionConflictDetail {
  if (!isRecord(value)) return false;
  if (value.code !== 'module_version_conflict') return false;
  if (typeof value.message !== 'string') return false;
  if (typeof value.expected_version !== 'number') return false;
  if (typeof value.current_version !== 'number') return false;
  if (typeof value.latest_module_id !== 'string') return false;
  return value.latest_module_id.length > 0;
}

/** Parse RTK Query 409 module_version_conflict errors from PUT /admin/modules. */
export function parseModuleVersionConflictError(
  error: unknown,
): ModuleVersionConflictDetail | null {
  if (!isFetchBaseQueryError(error) || error.status !== 409) return null;

  const data = error.data;
  if (!isRecord(data)) return null;

  const detail = data.detail;
  if (isModuleVersionConflictDetail(detail)) return detail;
  if (isModuleVersionConflictDetail(data)) return data;

  return null;
}
