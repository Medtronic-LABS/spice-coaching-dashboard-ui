function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Extract list payload from SPICE SuccessMessage (`entityList`, `entity`, or raw array). */
export function extractSpiceEntityList(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  if (Array.isArray(response.entityList)) return response.entityList;
  if (Array.isArray(response.entity)) return response.entity;

  const direct =
    response.data ??
    response.result ??
    response.content ??
    response.items ??
    response.records;
  if (Array.isArray(direct)) return direct;
  if (isRecord(direct)) {
    if (Array.isArray(direct.entityList)) return direct.entityList;
    if (Array.isArray(direct.entity)) return direct.entity;
    const nested =
      direct.content ?? direct.list ?? direct.items ?? direct.records;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

export function pickNumericField(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string' && val.trim() && !Number.isNaN(Number(val))) {
      return Number(val);
    }
  }
  return null;
}
