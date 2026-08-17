import { vi } from 'vitest';
import {
  testModuleLibrary,
  testSourceDocuments,
} from '@/test-utils/fixtures/moduleFixtures';

const deactivatedAt = new Map<string, string>();

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asOptionalBooleanParam(
  params: URLSearchParams,
  key: string,
): boolean | null {
  const raw = params.get(key);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
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
        const q = (asString(params.get('q')) ?? '').trim().toLowerCase();
        const domains = [
          ...new Set(
            testModuleLibrary.modules
              .filter((m) => (status ? m.status === status : true))
              .map((m) => m.category)
              .filter(Boolean),
          ),
        ]
          .filter(
            (domain) =>
              !q ||
              domain.toLowerCase().includes(q) ||
              domain.replace(/\s+/g, '_').toLowerCase().includes(q),
          )
          .sort((a, b) => a.localeCompare(b));
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
        const chatbotFaqsOnlyFilter = asOptionalBooleanParam(
          params,
          'chatbot_faqs_only',
        );
        const dateFrom = asString(params.get('date_from'));
        const dateTo = asString(params.get('date_to'));

        const items = testModuleLibrary.modules
          .filter((m) =>
            status ? m.status === status : m.status !== 'retired',
          )
          .filter((m) =>
            chatbotFaqsOnlyFilter === null
              ? true
              : Boolean(m.chatbot_faqs_only) === chatbotFaqsOnlyFilter,
          )
          .map((m, idx) => {
            const createdAt = new Date(
              Date.now() - idx * 86400000,
            ).toISOString();
            const publishedAt =
              m.status === 'published' || m.status === 'deactivated'
                ? createdAt
                : null;
            const deactivated =
              m.status === 'deactivated'
                ? (deactivatedAt.get(m.id) ?? createdAt)
                : null;
            return {
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
              quiz_count: m.questions,
              estimated_minutes: Math.max(
                1,
                Math.round(
                  Number.parseInt(m.durationLabel.replace(/\D/g, ''), 10) || 10,
                ),
              ),
              published_at: publishedAt,
              created_at: createdAt,
              updated_at: createdAt,
              activated_at: publishedAt,
              deactivated_at: deactivated,
              first_activated_at: publishedAt,
              last_deactivated_at: deactivated,
              last_reactivated_at: null,
              created_by: { id: 101, name: 'Mock Content Admin' },
              published_by:
                m.status === 'published' || m.status === 'deactivated'
                  ? { id: 102, name: 'Mock Publisher' }
                  : null,
              activated_by:
                m.status === 'published' || m.status === 'deactivated'
                  ? { id: 102, name: 'Mock Publisher' }
                  : null,
              deactivated_by:
                m.status === 'deactivated'
                  ? { id: 103, name: 'Mock Deactivator' }
                  : null,
              retired_at: m.status === 'retired' ? createdAt : null,
              retired_by:
                m.status === 'retired'
                  ? { id: 104, name: 'Mock Retirer' }
                  : null,
              quality_flags: { flags: [] },
              chatbot_faqs_only: Boolean(m.chatbot_faqs_only),
            };
          })
          .filter((item) => (domain ? item.domain === domain : true))
          .filter((item) => {
            const listingDate =
              status === 'published'
                ? item.published_at
                : status === 'draft'
                  ? item.created_at
                  : status === 'deactivated'
                    ? item.deactivated_at
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

      if (path.includes('/publish') && method === 'POST') {
        const moduleId = decodeURIComponent(
          path.slice(
            path.indexOf('admin/modules/') + 'admin/modules/'.length,
            -'/publish'.length,
          ),
        );
        const module = testModuleLibrary.modules.find((m) => m.id === moduleId);
        if (module && module.status === 'draft') {
          module.status = 'published';
        }
        return jsonResponse({
          id: moduleId,
          module_family_id: `family_${moduleId}`,
          lifecycle_status: 'published',
          activated_at: new Date().toISOString(),
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
