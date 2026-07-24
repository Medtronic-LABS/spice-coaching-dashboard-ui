/**
 * Normalize domain labels to lowercase snake_case.
 * Mirrors coaching-platform `normalize_module_domain_label`.
 */
export function normalizeModuleTaxonomyLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
