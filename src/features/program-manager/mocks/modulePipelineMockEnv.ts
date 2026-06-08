/**
 * Admin module + ingest traffic uses the real API when dashboard mocks are on.
 * See `hybridBaseQuery` in `src/store/apis/base.ts` and `shouldUseRealFetchForRequest`.
 */
export function isMockModulePipelineEnabled(): boolean {
  if (import.meta.env.MODE === 'test') {
    return true;
  }
  if (import.meta.env.VITE_USE_MOCK_API === 'false') {
    return false;
  }
  return import.meta.env.VITE_USE_MOCK_MODULE_PIPELINE === 'true';
}
