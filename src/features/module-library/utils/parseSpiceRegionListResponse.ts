import {
  extractSpiceEntityList,
  pickNumericField,
} from '@/features/module-library/utils/parseSpiceSuccessResponse';

export interface SpiceRegionItem {
  id: number;
  name: string;
  tenantId?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickName(record: Record<string, unknown>): string {
  const candidates = [
    'name',
    'districtName',
    'chiefdomName',
    'villageName',
    'countryName',
    'title',
    'label',
  ];
  for (const key of candidates) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return '';
}

function normalizeItem(item: unknown): SpiceRegionItem | null {
  if (!isRecord(item)) return null;
  const id = pickNumericField(item, [
    'id',
    'districtId',
    'chiefdomId',
    'villageId',
    'countryId',
    'regionId',
  ]);
  const name = pickName(item);
  if (id === null || !name) return null;
  const tenantId = pickNumericField(item, [
    'tenantId',
    'tenant_id',
    'districtTenantId',
    'district_tenant_id',
    'chiefdomTenantId',
    'chiefdom_tenant_id',
  ]);
  return tenantId !== null ? { id, name, tenantId } : { id, name };
}

/** Normalize admin-service region list payloads into `{ id, name, tenantId? }` rows. */
export function parseSpiceRegionListResponse(
  response: unknown,
): SpiceRegionItem[] {
  return extractSpiceEntityList(response)
    .map(normalizeItem)
    .filter((item): item is SpiceRegionItem => item !== null);
}
