import { vi } from 'vitest';
import {
  testModuleLibrary,
  testSourceDocuments,
} from '@/test-utils/fixtures/moduleFixtures';

const deactivatedAt = new Map<string, string>();

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function pathFromInput(input: RequestInfo | URL): string {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  try {
    return new URL(raw).pathname.replace(/^\//, '');
  } catch {
    return raw.replace(/^\//, '');
  }
}

function searchParamsFromInput(input: RequestInfo | URL): URLSearchParams {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  try {
    return new URL(raw).searchParams;
  } catch {
    const queryIndex = raw.indexOf('?');
    return new URLSearchParams(
      queryIndex >= 0 ? raw.slice(queryIndex + 1) : '',
    );
  }
}

function methodFromInit(init?: RequestInit, input?: RequestInfo | URL): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input === 'object' && input !== null && 'method' in input) {
    return String((input as Request).method || 'GET').toUpperCase();
  }
  return 'GET';
}

/** Installs a fetch stub covering Module Library admin endpoints used in page tests. */
export function installModuleLibraryFetchMock(): void {
  deactivatedAt.clear();
  for (const module of testModuleLibrary.modules) {
    if (module.status === 'deactivated') {
      deactivatedAt.set(module.id, new Date().toISOString());
    }
  }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = pathFromInput(input);
      const method = methodFromInit(init, input);
      const params = searchParamsFromInput(input);

      if (
        path.endsWith('admin/modules/domains') ||
        path === 'admin/modules/domains'
      ) {
        const status = asString(params.get('status'));
        const domains = [
          ...new Set(
            testModuleLibrary.modules
              .filter((m) => (status ? m.status === status : true))
              .map((m) => m.category)
              .filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b));
        return jsonResponse(domains);
      }

      if (
        (path.endsWith('admin/modules') || path === 'admin/modules') &&
        method === 'POST'
      ) {
        return jsonResponse({ id: `test-module-${Date.now()}` });
      }

      if (path.endsWith('admin/modules') || path === 'admin/modules') {
        const limit = Number(
          params.get('limit') ?? testModuleLibrary.modules.length,
        );
        const offset = Number(params.get('offset') ?? 0);
        const status = asString(params.get('status'));
        const domain = asString(params.get('domain'));
        const dateFrom = asString(params.get('date_from'));
        const dateTo = asString(params.get('date_to'));

        const items = testModuleLibrary.modules
          .filter((m) => (status ? m.status === status : true))
          .map((m, idx) => ({
            id: m.id,
            module_family_id: `family_${m.id}`,
            version: 1,
            title: { bn: m.title },
            description: m.category ? { bn: m.category } : null,
            domain: m.category,
            module_type: 'initial_training',
            lifecycle_status: m.status,
            clinically_reviewed: false,
            has_visibility_window: false,
            card_count: m.lessons,
            estimated_minutes: Math.max(
              1,
              Math.round(
                Number.parseInt(m.durationLabel.replace(/\D/g, ''), 10) || 10,
              ),
            ),
            published_at:
              m.status === 'published' || m.status === 'deactivated'
                ? new Date(Date.now() - idx * 86400000).toISOString()
                : null,
            created_at: new Date(Date.now() - idx * 86400000).toISOString(),
            first_activated_at:
              m.status === 'published' || m.status === 'deactivated'
                ? new Date(Date.now() - idx * 86400000).toISOString()
                : null,
            last_deactivated_at:
              m.status === 'deactivated'
                ? (deactivatedAt.get(m.id) ?? null)
                : null,
            last_reactivated_at: null,
            quality_flags: { flags: [] },
          }))
          .filter((item) => (domain ? item.domain === domain : true))
          .filter((item) => {
            const listingDate =
              status === 'published'
                ? item.published_at
                : status === 'draft'
                  ? item.created_at
                  : status === 'deactivated'
                    ? item.last_deactivated_at
                    : (item.published_at ?? item.created_at);
            if (!listingDate) return true;
            const listingTime = new Date(listingDate).getTime();
            if (dateFrom && listingTime < new Date(dateFrom).getTime()) {
              return false;
            }
            if (dateTo && listingTime > new Date(dateTo).getTime()) {
              return false;
            }
            return true;
          });

        return jsonResponse({
          modules: items.slice(offset, offset + limit),
          total_modules: items.length,
          total_pages: limit > 0 ? Math.ceil(items.length / limit) : 0,
          limit,
          offset,
        });
      }

      if (path.includes('admin/source-documents') && method === 'GET') {
        const status = asString(params.get('status')) ?? 'ingested';
        const sourceTypes = params
          .getAll('source_type')
          .flatMap((value) => value.split(','))
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const filenameQuery = (asString(params.get('q')) ?? '')
          .trim()
          .toLowerCase();
        const limit = Number(params.get('limit') ?? 50);
        const offset = Number(params.get('offset') ?? 0);

        const items = testSourceDocuments
          .filter((doc) => (status ? doc.status === status : true))
          .filter((doc) =>
            sourceTypes.length
              ? sourceTypes.includes(doc.source_type.toLowerCase())
              : true,
          )
          .filter((doc) =>
            filenameQuery
              ? (doc.original_filename ?? '')
                  .toLowerCase()
                  .includes(filenameQuery) ||
                doc.title.toLowerCase().includes(filenameQuery)
              : true,
          );

        return jsonResponse({
          source_documents: items.slice(offset, offset + limit),
          total_source_documents: items.length,
          total_pages: limit > 0 ? Math.ceil(items.length / limit) : 0,
          limit,
          offset,
        });
      }

      if (path.includes('/deactivate') && method === 'POST') {
        const moduleId = decodeURIComponent(
          path.slice(
            path.indexOf('admin/modules/') + 'admin/modules/'.length,
            -'/deactivate'.length,
          ),
        );
        const module = testModuleLibrary.modules.find((m) => m.id === moduleId);
        if (module) {
          module.status = 'deactivated';
          deactivatedAt.set(moduleId, new Date().toISOString());
        }
        return jsonResponse({
          module_id: moduleId,
          lifecycle_status: 'deactivated',
          last_deactivated_at: new Date().toISOString(),
        });
      }

      if (path.includes('/reactivate') && method === 'POST') {
        const moduleId = decodeURIComponent(
          path.slice(
            path.indexOf('admin/modules/') + 'admin/modules/'.length,
            -'/reactivate'.length,
          ),
        );
        const module = testModuleLibrary.modules.find((m) => m.id === moduleId);
        if (module) {
          module.status = 'published';
          deactivatedAt.delete(moduleId);
        }
        return jsonResponse({
          module_id: moduleId,
          lifecycle_status: 'published',
        });
      }

      return jsonResponse(
        { message: `Unhandled test fetch: ${method} ${path}` },
        404,
      );
    }),
  );
}

export function resetModuleLibraryFixtures(): void {
  const initialStatuses: Record<
    string,
    (typeof testModuleLibrary.modules)[number]['status']
  > = {
    'spice-visit': 'published',
    'htn-referral': 'published',
    'community-clinic': 'published',
    'fbs-rbs': 'published',
    'med-adherence': 'published',
    'danger-signs': 'published',
    'bp-technique': 'draft',
    'insulin-guidance': 'draft',
    'postnatal-checklist': 'draft',
  };
  for (const module of testModuleLibrary.modules) {
    const status = initialStatuses[module.id];
    if (status) module.status = status;
  }
  deactivatedAt.clear();
}
