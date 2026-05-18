/**
 * When unset or `true`, admin module APIs are satisfied with local mock promises.
 * Set `VITE_USE_MOCK_MODULE_PIPELINE=false` to use the real admin server.
 */
export function isMockModulePipelineEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK_MODULE_PIPELINE !== 'false';
}
