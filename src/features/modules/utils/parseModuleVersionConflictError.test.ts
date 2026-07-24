import { describe, expect, it } from 'vitest';
import { parseModuleVersionConflictError } from '@/features/modules/utils/parseModuleVersionConflictError';

describe('parseModuleVersionConflictError', () => {
  it('parses FastAPI detail-shaped 409 module_version_conflict', () => {
    const detail = {
      code: 'module_version_conflict',
      message: 'module has been modified; refetch and retry',
      expected_version: 1,
      current_version: 2,
      latest_module_id: 'mod-tip',
    };
    expect(
      parseModuleVersionConflictError({
        status: 409,
        data: { detail },
      }),
    ).toEqual(detail);
  });

  it('parses flat detail payloads', () => {
    const detail = {
      code: 'module_version_conflict',
      message: 'conflict',
      expected_version: 3,
      current_version: 4,
      latest_module_id: 'mod-4',
    };
    expect(
      parseModuleVersionConflictError({
        status: 409,
        data: detail,
      }),
    ).toEqual(detail);
  });

  it('returns null for non-conflict errors', () => {
    expect(
      parseModuleVersionConflictError({
        status: 409,
        data: { detail: { code: 'duplicate_content', message: 'dup' } },
      }),
    ).toBeNull();
    expect(
      parseModuleVersionConflictError({
        status: 400,
        data: {
          detail: {
            code: 'module_version_conflict',
            message: 'x',
            expected_version: 1,
            current_version: 2,
            latest_module_id: 'm',
          },
        },
      }),
    ).toBeNull();
  });
});
