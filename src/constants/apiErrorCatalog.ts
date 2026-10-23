import catalog from '@/constants/apiErrorCatalog.json';

export type ApiErrorCatalogEntry = {
  title: string;
  description: string;
  typical_status: number;
  domain: string;
  retryable: boolean;
  audience: string;
};

export type ApiErrorCatalog = {
  version: number;
  errors: Record<string, ApiErrorCatalogEntry>;
};

export const API_ERROR_CATALOG = catalog as ApiErrorCatalog;

/** Maps HTTP status to a cross-cutting catalog code when the body has no `code`. */
export const HTTP_STATUS_CATALOG_CODE: Partial<Record<number, string>> = {
  400: 'bad_request',
  401: 'not_authenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  422: 'validation_error',
  429: 'rate_limit_exceeded',
  500: 'internal_error',
  501: 'not_implemented',
  502: 'bad_gateway',
  503: 'service_unavailable',
};

export function getApiErrorCatalogEntry(
  code: string,
): ApiErrorCatalogEntry | undefined {
  return API_ERROR_CATALOG.errors[code];
}
