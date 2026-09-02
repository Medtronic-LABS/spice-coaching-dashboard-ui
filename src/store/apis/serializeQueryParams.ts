/**
 * Serializes query params so array values become repeated keys
 * (`module_id=a&module_id=b`) instead of a comma-joined string.
 * FastAPI UUID list Query params reject the comma form.
 */
export function serializeRepeatedQueryParams(
  params: Record<string, unknown>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        search.append(key, String(item));
      }
      continue;
    }
    search.append(key, String(value));
  }
  return search.toString();
}
