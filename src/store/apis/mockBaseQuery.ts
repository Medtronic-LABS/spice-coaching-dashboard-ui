import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import {
  mockBadges,
  mockCourseDraft,
  mockModuleLibrary,
  mockSourceDocuments,
} from '@/store/apis/mockData';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import type { AdminBadge } from '@/features/badges/types/badge.types';

const mockModuleDeactivatedAt = new Map<string, string>();
let mockBadgesState: AdminBadge[] = JSON.parse(
  JSON.stringify(mockBadges),
) as AdminBadge[];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Parse true/false query or body values; null when absent/invalid. */
function asOptionalBoolean(value: unknown): boolean | null {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

function normalizeDomainLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseBadgeSequence(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 1 ? value : null;
}

function resolveMockBadgeModules(moduleIds: string[]): AdminBadge['modules'] {
  return moduleIds.map((id) => {
    const module = mockModuleLibrary.modules.find((item) => item.id === id);
    const text = module?.title?.trim() ?? '';
    const title: AdminBadge['modules'][number]['title'] = text
      ? { bn: text, en: text }
      : {};
    return { id, title };
  });
}

function getUrl(args: string | FetchArgs): string {
  if (typeof args === 'string') return args;
  return args.url;
}

function getParams(args: string | FetchArgs): unknown {
  if (typeof args === 'string') return undefined;
  return args.params;
}

function getMethod(args: string | FetchArgs): string {
  if (typeof args === 'string') return 'GET';
  return args.method ?? 'GET';
}

function getBody(args: string | FetchArgs): unknown {
  if (typeof args === 'string') return undefined;
  return args.body;
}

function withoutLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

let courseDraftState: ModuleDraftData = JSON.parse(
  JSON.stringify(mockCourseDraft),
) as ModuleDraftData;

interface MockAssignment {
  id: string;
  module_id: string;
  module_title: { bn: string; en?: string } | null;
  assignment_type: 'individual' | 'po_sk' | 'geographical' | 'group';
  tenant_id: number | null;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
    role: 'SK' | 'PO' | 'AM';
    district: string;
    upazila: string | null;
    parent_id: number | null;
  } | null;
  upazila?: string | null;
  assigned_by: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

interface MockDocumentAssignment {
  id: string;
  source_document_id: string;
  document_title: string | null;
  assignment_type: 'individual' | 'po_sk' | 'geographical' | 'group';
  tenant_id: number | null;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
    role: 'SK' | 'PO' | 'AM';
    district: string;
    upazila: string | null;
    parent_id: number | null;
  } | null;
  upazila?: string | null;
  assigned_by: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

interface MockConfigThreshold {
  id: number;
  version: number;
  key: string;
  title: string | null;
  value_json: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MockConfigChange {
  previous_value_json: unknown | null;
  current_value_json: unknown;
  updated_by: string;
  updated_at: string;
}

const INITIAL_MOCK_CONFIGS: MockConfigThreshold[] = [
  {
    id: 1,
    version: 1,
    key: 'quiz_reattempt_validity_days',
    title: 'Quiz Reattempt Validity',
    value_json: 30,
    description:
      'Number of days from the assignment date during which a quiz can be reattempted',
    created_at: '2026-07-02T12:00:00Z',
    updated_at: '2026-07-02T12:00:00Z',
  },
];

const INITIAL_MOCK_CONFIG_CHANGES: Record<string, MockConfigChange[]> = {
  quiz_reattempt_validity_days: [
    {
      previous_value_json: null,
      current_value_json: 30,
      updated_by: 'admin',
      updated_at: '2026-07-02T12:00:00Z',
    },
  ],
};

let mockConfigsState: MockConfigThreshold[] =
  structuredClone(INITIAL_MOCK_CONFIGS);

let mockConfigChangesState: Record<string, MockConfigChange[]> =
  structuredClone(INITIAL_MOCK_CONFIG_CHANGES);

/** Test helper: restore config + history mocks between cases. */
export function resetMockConfigsState() {
  mockConfigsState = structuredClone(INITIAL_MOCK_CONFIGS);
  mockConfigChangesState = structuredClone(INITIAL_MOCK_CONFIG_CHANGES);
}

/** Test helper: replace history rows for a config key (newest-first). */
export function seedMockConfigChanges(
  configKey: string,
  changes: MockConfigChange[],
) {
  mockConfigChangesState = {
    ...mockConfigChangesState,
    [configKey]: structuredClone(changes),
  };
}

let mockAssignmentsState: MockAssignment[] = [
  {
    id: 'assign-1',
    module_id: 'spice-visit',
    module_title: {
      bn: 'SPICE App — Visit Submission',
      en: 'SPICE App — Visit Submission',
    },
    assignment_type: 'individual',
    tenant_id: null,
    user_id: 101,
    user: {
      id: 101,
      name: 'Mst. Hosneyara Begum',
      role: 'SK',
      district: 'Lalmonirhat',
      upazila: 'Lalmonirhat Sadar',
      parent_id: 1708515793,
    },
    assigned_by: 99,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'assign-2',
    module_id: 'htn-referral',
    module_title: {
      bn: 'HTN Referral Thresholds',
      en: 'HTN Referral Thresholds',
    },
    assignment_type: 'po_sk',
    tenant_id: null,
    user_id: 1708515793,
    user: {
      id: 1708515793,
      name: 'Md Abdus Salam',
      role: 'PO',
      district: 'Lalmonirhat',
      upazila: 'Lalmonirhat Sadar',
      parent_id: 1723477249,
    },
    assigned_by: 99,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'assign-3',
    module_id: 'htn-referral',
    module_title: {
      bn: 'HTN Referral Thresholds',
      en: 'HTN Referral Thresholds',
    },
    assignment_type: 'geographical',
    tenant_id: null,
    user_id: null,
    upazila: 'Hatibandha',
    assigned_by: 99,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'assign-4',
    module_id: 'htn-referral',
    module_title: {
      bn: 'HTN Referral Thresholds',
      en: 'HTN Referral Thresholds',
    },
    assignment_type: 'group',
    tenant_id: 4000,
    user_id: null,
    assigned_by: 99,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockDocumentAssignmentsState: MockDocumentAssignment[] = [
  {
    id: 'assign-knowledge-1',
    source_document_id: 'knowledge-asset-1',
    document_title: 'HTN Referral Guidelines',
    assignment_type: 'individual',
    tenant_id: null,
    user_id: 101,
    user: {
      id: 101,
      name: 'Mst. Hosneyara Begum',
      role: 'SK',
      district: 'Lalmonirhat',
      upazila: 'Lalmonirhat Sadar',
      parent_id: 1708515793,
    },
    assigned_by: 99,
    assigned_at: '2026-07-10T09:10:00Z',
    created_at: '2026-07-10T09:10:00Z',
    updated_at: '2026-07-10T09:10:00Z',
  },
];

const mockBaseQueryImpl = async (args: string | FetchArgs) => {
  // Simulate real network latency.
  await sleep(500);

  const rawUrl = withoutLeadingSlash(getUrl(args));
  const url = rawUrl.replace(/^api\/v1\//, '').replace(/^\/?api\/v1\//, '');
  const params = getParams(args);
  const method = getMethod(args).toUpperCase();
  const body = getBody(args);
  const cloneDraft = () =>
    JSON.parse(JSON.stringify(courseDraftState)) as ModuleDraftData;
  const persistDraft = (nextDraft: ModuleDraftData) => {
    courseDraftState = nextDraft;
  };

  // Module library endpoints
  if (url === 'module-library') {
    return { data: mockModuleLibrary };
  }

  // Admin endpoints (mocked when VITE_USE_MOCK_API or in tests)
  if (url === 'admin/files/presigned-url' && method === 'GET') {
    const object_name = asString(
      typeof params === 'object' && params && 'object_name' in params
        ? (params as { object_name?: unknown }).object_name
        : undefined,
    );
    const encoded = encodeURIComponent(object_name ?? 'unknown');
    return {
      data: {
        presigned_url: `https://mock-storage.example/${encoded}`,
        expires_seconds: 600,
      },
    };
  }

  if (url === 'admin/files' && method === 'POST') {
    const body = getBody(args);
    const file = body instanceof FormData ? body.get('file') : null;
    const prefixRaw = body instanceof FormData ? body.get('prefix') : null;
    const prefix =
      typeof prefixRaw === 'string' && prefixRaw.trim()
        ? prefixRaw.trim().replace(/^\/+|\/+$/g, '')
        : 'media';
    const name = file instanceof File ? file.name : 'upload.bin';
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    const objectName = `${prefix}/mock-${Date.now()}${ext}`;
    return {
      data: {
        bucket_name: 'microcoaching-uploads',
        object_name: objectName,
        storage_path: `microcoaching-uploads/${objectName}`,
        content_type:
          file instanceof File
            ? file.type || 'application/octet-stream'
            : 'application/octet-stream',
        size_bytes: file instanceof File ? file.size : 0,
        original_filename: name,
      },
    };
  }

  if (url === 'admin/badges' && method === 'POST') {
    const payload =
      typeof body === 'object' && body && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const name = asString(payload.name)?.trim() ?? '';
    const domainRaw = asString(payload.domain)?.trim() ?? '';
    const domain = normalizeDomainLabel(domainRaw);
    const image_storage_path =
      asString(payload.image_storage_path)?.trim() ?? '';
    const module_ids = Array.isArray(payload.module_ids)
      ? payload.module_ids.map((id) => String(id))
      : [];
    const sequence = parseBadgeSequence(payload.sequence);
    if (!name || !domain || !image_storage_path) {
      return {
        error: {
          status: domainRaw && !domain ? 400 : 422,
          data: {
            message:
              domainRaw && !domain
                ? 'Domain must be a non-empty snake_case label'
                : 'name, domain, and image_storage_path are required',
            code: domainRaw && !domain ? 'badge_domain_invalid' : undefined,
          },
        },
      };
    }
    if (
      'sequence' in payload &&
      payload.sequence !== null &&
      sequence === null
    ) {
      return {
        error: {
          status: 422,
          data: {
            message: 'Sequence must be a positive integer',
          },
        },
      };
    }
    if (
      mockBadgesState.some(
        (badge) => badge.status === 'active' && badge.name === name,
      )
    ) {
      return {
        error: {
          status: 409,
          data: {
            message: `An active milestone named '${name}' already exists.`,
            code: 'badge_name_conflict',
          },
        },
      };
    }
    if (
      sequence !== null &&
      mockBadgesState.some(
        (badge) => badge.status === 'active' && badge.sequence === sequence,
      )
    ) {
      return {
        error: {
          status: 409,
          data: {
            message: `Sequence ${sequence} is already used by another active milestone.`,
            code: 'badge_sequence_conflict',
          },
        },
      };
    }
    const now = new Date().toISOString();
    const created: AdminBadge = {
      id: `badge-${Date.now()}`,
      name,
      domain,
      image_storage_path,
      module_ids,
      modules: resolveMockBadgeModules(module_ids),
      status: 'active',
      sequence,
      created_at: now,
      updated_at: now,
      created_by: 'mock_admin',
      updated_by: null,
    };
    mockBadgesState = [created, ...mockBadgesState];
    return { data: created };
  }

  if (url === 'admin/badges' && method === 'GET') {
    const paramBag =
      typeof params === 'object' && params
        ? (params as Record<string, unknown>)
        : {};
    const domain = asString(paramBag.domain);
    const q = (asString(paramBag.q) ?? '').trim().toLowerCase();
    const createdByRaw = asString(paramBag.created_by) ?? '';
    const createdBy = createdByRaw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const moduleTitleRaw = asString(paramBag.module_title) ?? '';
    const moduleTitles = moduleTitleRaw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const createdFrom = asString(paramBag.created_from);
    const createdTo = asString(paramBag.created_to);
    const sortBy = asString(paramBag.sort_by) ?? 'created_at';
    const sortDir = asString(paramBag.sort_dir) === 'asc' ? 1 : -1;
    const limit = Number(paramBag.limit ?? 50);
    const offset = Number(paramBag.offset ?? 0);

    const moduleTitleById = new Map(
      mockModuleLibrary.modules.map((m) => [m.id, m.title.toLowerCase()]),
    );

    let filtered = mockBadgesState.filter((badge) => badge.status === 'active');
    if (domain) {
      filtered = filtered.filter((badge) => badge.domain === domain);
    }
    if (q) {
      filtered = filtered.filter((badge) =>
        badge.name.toLowerCase().includes(q),
      );
    }
    if (createdBy.length) {
      filtered = filtered.filter(
        (badge) =>
          badge.created_by != null && createdBy.includes(badge.created_by),
      );
    }
    if (createdFrom) {
      filtered = filtered.filter((badge) => badge.created_at >= createdFrom);
    }
    if (createdTo) {
      filtered = filtered.filter((badge) => badge.created_at <= createdTo);
    }
    if (moduleTitles.length) {
      filtered = filtered.filter((badge) =>
        badge.module_ids.some((id) => {
          const title = moduleTitleById.get(id) ?? '';
          return moduleTitles.some((needle) => title.includes(needle));
        }),
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'sequence') {
        const aSeq = a.sequence;
        const bSeq = b.sequence;
        if (aSeq == null && bSeq == null) return 0;
        if (aSeq == null) return 1;
        if (bSeq == null) return -1;
        return (aSeq - bSeq) * sortDir;
      }
      return a.created_at.localeCompare(b.created_at) * sortDir;
    });

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    return {
      data: {
        badges: page,
        total,
        total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
        limit,
        offset,
      },
    };
  }

  const badgeMatch = url.match(/^admin\/badges\/([^/]+)$/);
  if (badgeMatch) {
    const badgeId = decodeURIComponent(badgeMatch[1]);
    const existing = mockBadgesState.find(
      (badge) => badge.id === badgeId && badge.status === 'active',
    );

    if (method === 'GET') {
      if (!existing) {
        return {
          error: { status: 404, data: { message: 'Milestone not found' } },
        };
      }
      return { data: existing };
    }

    if (method === 'PUT') {
      if (!existing) {
        return {
          error: { status: 404, data: { message: 'Milestone not found' } },
        };
      }
      const payload =
        typeof body === 'object' && body && !Array.isArray(body)
          ? (body as Record<string, unknown>)
          : {};
      const name = asString(payload.name)?.trim() ?? existing.name;
      const domainRaw = asString(payload.domain)?.trim() ?? existing.domain;
      const domain = normalizeDomainLabel(domainRaw);
      if (!domain) {
        return {
          error: {
            status: 400,
            data: {
              message: 'Domain must be a non-empty snake_case label',
              code: 'badge_domain_invalid',
            },
          },
        };
      }
      const image_storage_path =
        asString(payload.image_storage_path)?.trim() ??
        existing.image_storage_path;
      const module_ids = Array.isArray(payload.module_ids)
        ? payload.module_ids.map((id) => String(id))
        : existing.module_ids;
      const sequence =
        'sequence' in payload
          ? parseBadgeSequence(payload.sequence)
          : existing.sequence;
      if (
        'sequence' in payload &&
        payload.sequence !== null &&
        sequence === null
      ) {
        return {
          error: {
            status: 422,
            data: {
              message: 'Sequence must be a positive integer',
            },
          },
        };
      }
      if (
        mockBadgesState.some(
          (badge) =>
            badge.id !== badgeId &&
            badge.status === 'active' &&
            badge.name === name,
        )
      ) {
        return {
          error: {
            status: 409,
            data: {
              message: `An active milestone named '${name}' already exists.`,
              code: 'badge_name_conflict',
            },
          },
        };
      }
      if (
        sequence !== null &&
        mockBadgesState.some(
          (badge) =>
            badge.id !== badgeId &&
            badge.status === 'active' &&
            badge.sequence === sequence,
        )
      ) {
        return {
          error: {
            status: 409,
            data: {
              message: `Sequence ${sequence} is already used by another active milestone.`,
              code: 'badge_sequence_conflict',
            },
          },
        };
      }
      const updated: AdminBadge = {
        ...existing,
        name,
        domain,
        image_storage_path,
        module_ids,
        modules: resolveMockBadgeModules(module_ids),
        sequence,
        updated_at: new Date().toISOString(),
        updated_by: 'mock_admin',
      };
      mockBadgesState = mockBadgesState.map((badge) =>
        badge.id === badgeId ? updated : badge,
      );
      return { data: updated };
    }

    if (method === 'DELETE') {
      if (!existing) {
        return {
          error: { status: 404, data: { message: 'Milestone not found' } },
        };
      }
      mockBadgesState = mockBadgesState.map((badge) =>
        badge.id === badgeId
          ? {
              ...badge,
              status: 'deleted',
              updated_at: new Date().toISOString(),
              updated_by: 'mock_admin',
            }
          : badge,
      );
      return { data: undefined };
    }
  }

  if (url === 'admin/modules/domains') {
    const status = asString(
      typeof params === 'object' && params && 'status' in params
        ? (params as { status?: unknown }).status
        : undefined,
    );
    const q = (
      asString(
        typeof params === 'object' && params && 'q' in params
          ? (params as { q?: unknown }).q
          : undefined,
      ) ?? ''
    )
      .trim()
      .toLowerCase();
    const domains = [
      ...new Set(
        mockModuleLibrary.modules
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
    return { data: domains };
  }

  if (url === 'admin/modules' && method === 'POST') {
    return {
      data: {
        id: `mock-module-${Date.now()}`,
      },
    };
  }

  if (url === 'admin/modules') {
    const limit =
      typeof params === 'object' && params && 'limit' in params
        ? Number((params as { limit?: unknown }).limit)
        : mockModuleLibrary.modules.length;
    const offset =
      typeof params === 'object' && params && 'offset' in params
        ? Number((params as { offset?: unknown }).offset)
        : 0;
    const status = asString(
      typeof params === 'object' && params && 'status' in params
        ? (params as { status?: unknown }).status
        : undefined,
    );
    const domain = asString(
      typeof params === 'object' && params && 'domain' in params
        ? (params as { domain?: unknown }).domain
        : undefined,
    );
    const paramBag =
      typeof params === 'object' && params
        ? (params as Record<string, unknown>)
        : {};
    const chatbotFaqsOnlyFilter = asOptionalBoolean(paramBag.chatbot_faqs_only);
    const createdFrom = asString(paramBag.created_from);
    const createdTo = asString(paramBag.created_to);
    const publishedFrom = asString(paramBag.published_from);
    const publishedTo = asString(paramBag.published_to);
    const activatedFrom = asString(paramBag.activated_from);
    const activatedTo = asString(paramBag.activated_to);
    const deactivatedFrom = asString(paramBag.deactivated_from);
    const deactivatedTo = asString(paramBag.deactivated_to);

    const inRange = (
      value: string | null | undefined,
      from?: string,
      to?: string,
    ): boolean => {
      if (!from && !to) return true;
      if (!value) return false;
      const time = new Date(value).getTime();
      if (from && time < new Date(from).getTime()) return false;
      if (to && time > new Date(to).getTime()) return false;
      return true;
    };

    const items = mockModuleLibrary.modules
      .filter((m) => (status ? m.status === status : m.status !== 'retired'))
      .filter((m) =>
        chatbotFaqsOnlyFilter === null
          ? true
          : Boolean(m.chatbot_faqs_only) === chatbotFaqsOnlyFilter,
      )
      .map((m, idx) => {
        const createdAt = new Date(Date.now() - idx * 86400000).toISOString();
        const publishedAt =
          m.status === 'published' || m.status === 'deactivated'
            ? createdAt
            : null;
        const deactivatedAt =
          m.status === 'deactivated'
            ? (mockModuleDeactivatedAt.get(m.id) ?? createdAt)
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
          deactivated_at: deactivatedAt,
          first_activated_at: publishedAt,
          last_deactivated_at: deactivatedAt,
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
          quality_flags: { flags: [] },
          quiz_count: m.questions,
          chatbot_faqs_only: Boolean(m.chatbot_faqs_only),
        };
      })
      .filter((item) => (domain ? item.domain === domain : true))
      .filter((item) => {
        const activatedAt =
          item.activated_at ??
          item.last_reactivated_at ??
          item.first_activated_at ??
          item.published_at;
        const deactivatedAt = item.deactivated_at ?? item.last_deactivated_at;
        return (
          inRange(item.created_at, createdFrom, createdTo) &&
          inRange(item.published_at, publishedFrom, publishedTo) &&
          inRange(activatedAt, activatedFrom, activatedTo) &&
          inRange(deactivatedAt, deactivatedFrom, deactivatedTo)
        );
      });

    const sortBy = asString(paramBag.sort_by);
    const sortDir = asString(paramBag.sort_dir) === 'desc' ? -1 : 1;

    if (sortBy) {
      items.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';
        if (sortBy === 'title') {
          valA = a.title.bn || '';
          valB = b.title.bn || '';
        } else if (sortBy === 'domain' || sortBy === 'category') {
          valA = a.domain || '';
          valB = b.domain || '';
        } else if (sortBy === 'card_count') {
          valA = a.card_count;
          valB = b.card_count;
        } else if (sortBy === 'estimated_minutes') {
          valA = a.estimated_minutes;
          valB = b.estimated_minutes;
        } else if (sortBy === 'status' || sortBy === 'lifecycle_status') {
          valA = a.lifecycle_status || '';
          valB = b.lifecycle_status || '';
        } else if (sortBy === 'created_at') {
          valA = a.created_at || '';
          valB = b.created_at || '';
        } else if (sortBy === 'updated_at') {
          valA = a.updated_at || a.created_at || '';
          valB = b.updated_at || b.created_at || '';
        } else if (sortBy === 'published_at') {
          valA = a.published_at || '';
          valB = b.published_at || '';
        } else if (
          sortBy === 'first_activated_at' ||
          sortBy === 'activated_at'
        ) {
          valA = a.activated_at || a.first_activated_at || '';
          valB = b.activated_at || b.first_activated_at || '';
        } else if (
          sortBy === 'last_deactivated_at' ||
          sortBy === 'deactivated_at'
        ) {
          valA = a.deactivated_at || a.last_deactivated_at || '';
          valB = b.deactivated_at || b.last_deactivated_at || '';
        } else {
          const rawA = (a as Record<string, unknown>)[sortBy];
          const rawB = (b as Record<string, unknown>)[sortBy];
          valA =
            typeof rawA === 'string' || typeof rawA === 'number' ? rawA : '';
          valB =
            typeof rawB === 'string' || typeof rawB === 'number' ? rawB : '';
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * sortDir;
        }
        return String(valA).localeCompare(String(valB)) * sortDir;
      });
    }

    return {
      data: {
        modules: items.slice(offset, offset + limit),
        total_modules: items.length,
        total_pages: limit > 0 ? Math.ceil(items.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (url === 'admin/source-documents' && method === 'GET') {
    const query =
      typeof params === 'object' && params
        ? (params as {
            status?: unknown;
            source_type?: unknown;
            q?: unknown;
            sync_published_visible?: unknown;
            uploaded_from?: unknown;
            uploaded_to?: unknown;
            uploaded_by?: unknown;
            assigned?: unknown;
            limit?: unknown;
            offset?: unknown;
            sort_by?: unknown;
            sort_dir?: unknown;
          })
        : {};
    const rawStatuses = Array.isArray(query.status)
      ? query.status
      : [query.status];
    const statuses = rawStatuses
      .flatMap((value) => (asString(value) ?? '').split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const rawSourceTypes = Array.isArray(query.source_type)
      ? query.source_type
      : [query.source_type];
    const sourceTypes = rawSourceTypes
      .flatMap((value) => (asString(value) ?? '').split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const filenameQuery = (asString(query.q) ?? '').trim().toLowerCase();
    const syncPublishedVisible =
      query.sync_published_visible === true ||
      query.sync_published_visible === 'true'
        ? true
        : query.sync_published_visible === false ||
            query.sync_published_visible === 'false'
          ? false
          : undefined;
    const uploadedFrom = asString(query.uploaded_from);
    const uploadedTo = asString(query.uploaded_to);
    const rawUploadedBy = Array.isArray(query.uploaded_by)
      ? query.uploaded_by
      : [query.uploaded_by];
    const uploadedByIds = new Set(
      rawUploadedBy
        .flatMap((value) => (asString(value) ?? '').split(','))
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const assignedFilter =
      query.assigned === true || query.assigned === 'true'
        ? true
        : query.assigned === false || query.assigned === 'false'
          ? false
          : undefined;
    const assignedIds = new Set(
      mockDocumentAssignmentsState.map(
        (assignment) => assignment.source_document_id,
      ),
    );
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;
    const docSortBy = asString(query.sort_by);
    const docSortDir = asString(query.sort_dir) === 'desc' ? -1 : 1;

    const items = mockSourceDocuments
      .filter((doc) =>
        statuses.length
          ? statuses.includes(doc.status.toLowerCase())
          : doc.status.toLowerCase() !== 'retired',
      )
      .filter((doc) =>
        sourceTypes.length
          ? sourceTypes.includes(doc.source_type.toLowerCase())
          : true,
      )
      .filter((doc) =>
        syncPublishedVisible === undefined
          ? true
          : Boolean(doc.sync_published_visible) === syncPublishedVisible,
      )
      .filter((doc) => {
        if (!uploadedFrom && !uploadedTo) return true;
        const uploadedAt = doc.uploaded_date || doc.ingested_at;
        if (uploadedFrom && uploadedAt < uploadedFrom) return false;
        if (uploadedTo && uploadedAt > uploadedTo) return false;
        return true;
      })
      .filter((doc) =>
        filenameQuery
          ? (doc.original_filename ?? '')
              .toLowerCase()
              .includes(filenameQuery) ||
            doc.title.toLowerCase().includes(filenameQuery)
          : true,
      )
      .filter((doc) =>
        uploadedByIds.size === 0
          ? true
          : doc.uploaded_by != null &&
            uploadedByIds.has(String(doc.uploaded_by.id)),
      )
      .filter((doc) =>
        assignedFilter === undefined
          ? true
          : assignedIds.has(doc.id) === assignedFilter,
      )
      .map((doc) => ({
        ...doc,
        assigned: assignedIds.has(doc.id),
      }));

    if (docSortBy) {
      items.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';
        if (docSortBy === 'title' || docSortBy === 'name') {
          valA = a.title || a.original_filename || '';
          valB = b.title || b.original_filename || '';
        } else if (
          docSortBy === 'ingested_at' ||
          docSortBy === 'created_at' ||
          docSortBy === 'uploaded_date'
        ) {
          valA =
            docSortBy === 'uploaded_date'
              ? a.uploaded_date || a.ingested_at || ''
              : a.ingested_at || '';
          valB =
            docSortBy === 'uploaded_date'
              ? b.uploaded_date || b.ingested_at || ''
              : b.ingested_at || '';
        } else if (docSortBy === 'status') {
          valA = a.status || '';
          valB = b.status || '';
        } else if (docSortBy === 'source_type') {
          valA = a.source_type || '';
          valB = b.source_type || '';
        } else if (docSortBy === 'content_domain') {
          valA = a.content_domain || '';
          valB = b.content_domain || '';
        } else if (docSortBy === 'original_filename') {
          valA = a.original_filename || '';
          valB = b.original_filename || '';
        } else {
          const rawA = (a as unknown as Record<string, unknown>)[docSortBy];
          const rawB = (b as unknown as Record<string, unknown>)[docSortBy];
          valA =
            typeof rawA === 'string' || typeof rawA === 'number' ? rawA : '';
          valB =
            typeof rawB === 'string' || typeof rawB === 'number' ? rawB : '';
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * docSortDir;
        }
        return String(valA).localeCompare(String(valB)) * docSortDir;
      });
    }

    return {
      data: {
        source_documents: items.slice(offset, offset + limit),
        total_source_documents: items.length,
        total_pages: limit > 0 ? Math.ceil(items.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (
    url.startsWith('admin/source-documents/') &&
    method === 'PATCH' &&
    !url.endsWith('/thumbnail')
  ) {
    const sourceDocumentId = decodeURIComponent(
      url.slice('admin/source-documents/'.length),
    );
    const doc = mockSourceDocuments.find(
      (item) => item.id === sourceDocumentId,
    );
    if (!doc) {
      return { error: { status: 404, data: { detail: 'Not found' } } };
    }
    const payload =
      body && typeof body === 'object'
        ? (body as { title?: unknown; description?: unknown })
        : {};
    if (typeof payload.title === 'string') {
      const trimmed = payload.title.trim();
      if (!trimmed) {
        return {
          error: { status: 422, data: { detail: 'Title must be non-empty' } },
        };
      }
      doc.title = trimmed;
    }
    if ('description' in payload) {
      doc.description =
        typeof payload.description === 'string' ? payload.description : null;
    }
    return { data: { ...doc } };
  }

  if (
    url.startsWith('admin/source-documents/') &&
    url.endsWith('/thumbnail') &&
    method === 'PUT'
  ) {
    const sourceDocumentId = decodeURIComponent(
      url.slice('admin/source-documents/'.length, -'/thumbnail'.length),
    );
    const doc = mockSourceDocuments.find(
      (item) => item.id === sourceDocumentId,
    );
    if (!doc) {
      return { error: { status: 404, data: { detail: 'Not found' } } };
    }
    doc.thumbnail_storage_path = `thumbnails/${sourceDocumentId}.jpg`;
    return { data: { ...doc } };
  }

  const mockHierarchyUsersForAssign = [
    {
      id: 1723477249,
      name: 'Area Manager',
      role: 'AREA_MANAGER',
      parent_id: null,
      district_id: 10,
      district: 'Lalmonirhat',
      upazilas: [],
    },
    {
      id: 1708515793,
      name: 'Md Abdus Salam',
      role: 'PO',
      parent_id: 1723477249,
      district_id: 10,
      district: 'Lalmonirhat',
      upazilas: [{ id: 1, name: 'Lalmonirhat Sadar' }],
    },
    {
      id: 1708515794,
      name: 'Mst. Rabeya Khatun',
      role: 'PO',
      parent_id: 1723477249,
      district_id: 10,
      district: 'Lalmonirhat',
      upazilas: [{ id: 2, name: 'Hatibandha' }],
    },
    {
      id: 1313053891,
      name: 'Mst. Hosneyara Begum',
      role: 'SHASTIYA_KORMI',
      parent_id: 1708515793,
      district_id: 10,
      district: 'Lalmonirhat',
      upazilas: [{ id: 1, name: 'Lalmonirhat Sadar' }],
    },
  ];

  const expandAssigneeIds = (
    userIds: number[],
    expandPoAssignees: boolean,
  ): number[] => {
    if (!expandPoAssignees) {
      return Array.from(new Set(userIds));
    }
    const expanded = new Set(userIds);
    for (const userId of userIds) {
      const user = mockHierarchyUsersForAssign.find(
        (item) => item.id === userId,
      );
      if (user?.role === 'PO') {
        for (const child of mockHierarchyUsersForAssign) {
          if (child.parent_id === userId) expanded.add(child.id);
        }
      }
    }
    return Array.from(expanded);
  };

  const resolveAssigneeIdsFromPayload = (payload: {
    user_ids?: number[];
    upazila_ids?: number[];
    district_ids?: number[];
    division_ids?: number[];
    expand_po_assignees?: boolean;
  }): number[] => {
    if (payload.user_ids !== undefined) {
      return expandAssigneeIds(
        payload.user_ids,
        payload.expand_po_assignees === true,
      );
    }
    const upazilaIds = new Set(payload.upazila_ids ?? []);
    const districtIds = new Set(payload.district_ids ?? []);
    if (upazilaIds.size === 0 && districtIds.size === 0) {
      return [];
    }
    return mockHierarchyUsersForAssign
      .filter((user) => {
        if (upazilaIds.size > 0) {
          if (user.role === 'AREA_MANAGER') return false;
          return user.upazilas.some((upazila) => upazilaIds.has(upazila.id));
        }
        return districtIds.has(user.district_id);
      })
      .map((user) => user.id);
  };

  const usersForIds = (userIds: number[]) =>
    mockHierarchyUsersForAssign.filter((user) => userIds.includes(user.id));

  if (url === 'admin/document-assignments' && method === 'POST') {
    const payload = body as {
      source_document_id: string;
      user_ids?: number[];
      upazila_ids?: number[];
      district_ids?: number[];
      division_ids?: number[];
      expand_po_assignees?: boolean;
    };
    const sourceDoc = mockSourceDocuments.find(
      (doc) => doc.id === payload.source_document_id,
    );
    if (!sourceDoc) {
      return {
        error: {
          status: 404,
          data: { detail: 'Source document not found' },
        },
      };
    }
    const now = new Date().toISOString();
    const nextIds = resolveAssigneeIdsFromPayload(payload);
    const existingUserIds = new Set(
      mockDocumentAssignmentsState
        .filter(
          (assignment) =>
            assignment.source_document_id === payload.source_document_id &&
            assignment.user_id !== null,
        )
        .map((assignment) => assignment.user_id as number),
    );
    const newIds: string[] = [];
    for (const userId of nextIds) {
      if (existingUserIds.has(userId)) continue;
      const user = mockHierarchyUsersForAssign.find(
        (item) => item.id === userId,
      );
      const id = `doc-assign-${mockDocumentAssignmentsState.length + 1}`;
      newIds.push(id);
      mockDocumentAssignmentsState.push({
        id,
        source_document_id: payload.source_document_id,
        document_title: sourceDoc.title,
        assignment_type: 'individual',
        tenant_id: null,
        user_id: userId,
        user: user
          ? {
              id: user.id,
              name: user.name,
              role:
                user.role === 'SHASTIYA_KORMI'
                  ? 'SK'
                  : user.role === 'AREA_MANAGER'
                    ? 'AM'
                    : 'PO',
              district: user.district,
              upazila: user.upazilas[0]?.name ?? null,
              parent_id: user.parent_id,
            }
          : null,
        upazila: null,
        assigned_by: 1,
        assigned_at: now,
        created_at: now,
        updated_at: now,
      });
    }
    return {
      data: {
        assigned_count: newIds.length,
        assignment_ids: newIds,
      },
    };
  }

  if (url.startsWith('admin/document-assignments/') && url.endsWith('/users')) {
    const sourceDocumentId = decodeURIComponent(
      url.slice('admin/document-assignments/'.length, -'/users'.length),
    );
    const sourceDoc = mockSourceDocuments.find(
      (doc) => doc.id === sourceDocumentId,
    );
    if (!sourceDoc) {
      return {
        error: { status: 404, data: { detail: 'Source document not found' } },
      };
    }
    if (method === 'GET') {
      const userIds = Array.from(
        new Set(
          mockDocumentAssignmentsState
            .filter(
              (assignment) =>
                assignment.source_document_id === sourceDocumentId &&
                assignment.user_id !== null,
            )
            .map((assignment) => assignment.user_id as number),
        ),
      );
      return {
        data: {
          source_document_id: sourceDocumentId,
          users: usersForIds(userIds),
        },
      };
    }
    if (method === 'PUT') {
      const payload = (body ?? {}) as {
        user_ids?: number[];
        upazila_ids?: number[];
        district_ids?: number[];
        division_ids?: number[];
        expand_po_assignees?: boolean;
      };
      const nextIds = resolveAssigneeIdsFromPayload(payload);
      const previousIds = new Set(
        mockDocumentAssignmentsState
          .filter(
            (assignment) =>
              assignment.source_document_id === sourceDocumentId &&
              assignment.user_id !== null,
          )
          .map((assignment) => assignment.user_id as number),
      );
      mockDocumentAssignmentsState = mockDocumentAssignmentsState.filter(
        (assignment) => assignment.source_document_id !== sourceDocumentId,
      );
      const now = new Date().toISOString();
      const assignmentIds: string[] = [];
      for (const userId of nextIds) {
        const user = mockHierarchyUsersForAssign.find(
          (item) => item.id === userId,
        );
        const id = `doc-assign-${mockDocumentAssignmentsState.length + 1}`;
        assignmentIds.push(id);
        mockDocumentAssignmentsState.push({
          id,
          source_document_id: sourceDocumentId,
          document_title: sourceDoc.title,
          assignment_type: 'individual',
          tenant_id: null,
          user_id: userId,
          user: user
            ? {
                id: user.id,
                name: user.name,
                role:
                  user.role === 'SHASTIYA_KORMI'
                    ? 'SK'
                    : user.role === 'AREA_MANAGER'
                      ? 'AM'
                      : 'PO',
                district: user.district,
                upazila: user.upazilas[0]?.name ?? null,
                parent_id: user.parent_id,
              }
            : null,
          upazila: null,
          assigned_by: 1,
          assigned_at: now,
          created_at: now,
          updated_at: now,
        });
      }
      const nextSet = new Set(nextIds);
      return {
        data: {
          added_count: nextIds.filter((id) => !previousIds.has(id)).length,
          removed_count: Array.from(previousIds).filter(
            (id) => !nextSet.has(id),
          ).length,
          assignment_ids: assignmentIds,
        },
      };
    }
  }

  if (
    url.startsWith('admin/modules/') &&
    url.endsWith('/publish') &&
    method === 'POST'
  ) {
    const moduleId = decodeURIComponent(
      url.slice('admin/modules/'.length, -'/publish'.length),
    );
    const module = mockModuleLibrary.modules.find((m) => m.id === moduleId);
    if (module && module.status === 'draft') {
      module.status = 'published';
    }
    return {
      data: {
        id: moduleId,
        module_family_id: `family_${moduleId}`,
        lifecycle_status: 'published',
        activated_at: new Date().toISOString(),
      },
    };
  }

  if (
    url.startsWith('admin/modules/') &&
    url.endsWith('/deactivate') &&
    method === 'POST'
  ) {
    const moduleId = decodeURIComponent(
      url.slice('admin/modules/'.length, -'/deactivate'.length),
    );
    const module = mockModuleLibrary.modules.find((m) => m.id === moduleId);
    if (module) {
      module.status = 'deactivated';
      mockModuleDeactivatedAt.set(moduleId, new Date().toISOString());
    }
    return {
      data: {
        module_id: moduleId,
        lifecycle_status: 'deactivated',
        last_deactivated_at: new Date().toISOString(),
      },
    };
  }

  if (
    url.startsWith('admin/modules/') &&
    url.endsWith('/reactivate') &&
    method === 'POST'
  ) {
    const moduleId = decodeURIComponent(
      url.slice('admin/modules/'.length, -'/reactivate'.length),
    );
    const module = mockModuleLibrary.modules.find((m) => m.id === moduleId);
    if (module) {
      module.status = 'published';
      mockModuleDeactivatedAt.delete(moduleId);
    }
    return {
      data: {
        module_id: moduleId,
        lifecycle_status: 'published',
        last_reactivated_at: new Date().toISOString(),
      },
    };
  }

  if (url === 'program-manager/courses/draft') {
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/draft/reset' && method === 'POST') {
    persistDraft(
      JSON.parse(JSON.stringify(mockCourseDraft)) as ModuleDraftData,
    );
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/draft/seed' && method === 'POST') {
    if (typeof body === 'object' && body) {
      const nextDraft = JSON.parse(JSON.stringify(body)) as ModuleDraftData;
      persistDraft(nextDraft);
    }
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/upload' && method === 'POST') {
    const payload =
      typeof body === 'object' && body
        ? (body as {
            fileName?: string;
            title?: string;
            topic?: string;
            description?: string;
          })
        : {};
    const nextDraft: ModuleDraftData = {
      ...cloneDraft(),
      sourceFile: payload.fileName ?? 'uploaded_protocol.pdf',
      title: payload.title ?? 'HTN Referral Thresholds',
      topic: payload.topic ?? 'Hypertension',
      description:
        payload.description ??
        'Auto-generated draft from uploaded protocol. Review lessons and quiz before publishing.',
      status: 'draft',
      generationStatus: 'generated',
      generatedAt: new Date().toISOString(),
      moduleDetails: {
        description: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Learn how to measure blood pressure correctly.',
              },
            ],
          },
        ],
        estimatedTime: 15,
      },
      lessons: [
        {
          id: 'lesson_1',
          title: 'What is Blood Pressure?',
          order: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Blood pressure is the force of blood against artery walls.',
                },
              ],
            },
            {
              type: 'image',
              attrs: {
                url: 'https://cdn/bp-diagram.png',
                caption: 'Blood pressure diagram',
              },
            },
          ],
        },
        {
          id: 'lesson_2',
          title: 'Normal vs High Readings',
          order: 2,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Normal BP is ' },
                {
                  type: 'text',
                  text: 'below 120/80',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
            {
              type: 'audio',
              attrs: {
                url: 'https://cdn/audio1.mp3',
                title: 'Explanation',
                duration: 60,
              },
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'High BP is above 140/90.' }],
            },
          ],
        },
        {
          id: 'lesson_3',
          title: 'When to Refer',
          order: 3,
          content: [
            {
              type: 'video',
              attrs: {
                url: 'https://cdn/video.mp4',
                thumbnail: 'https://cdn/thumb.png',
              },
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Refer patient if BP >=140/90.' },
              ],
            },
          ],
        },
      ],
      moduleContent: {
        fieldMessage:
          'Hypertension is a serious condition that requires regular monitoring and management.',
        objectives: [
          'Understand the definition and implications of hypertension.',
          'Identify normal and abnormal blood pressure readings.',
          'Recognize danger signs associated with hypertension.',
        ],
        dangerSigns: [
          'Severe headache',
          'Shortness of breath',
          'Chest pain',
          'Vision changes',
        ],
        lessonContent:
          'Blood pressure (BP) is the force of blood against artery walls. Normal BP is around 120/80 mmHg. BP >=140/90 mmHg is considered high. If danger signs are present, refer immediately.',
      },
      quiz: {
        instructions: 'Select the correct answer for each question.',
        config: {
          shuffleQuestions: true,
          evaluationBehavior: 'immediate',
          explanationVisibility: 'after_answer',
        },
        questions: [
          {
            id: 1,
            type: 'mcq',
            question: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'What is normal BP?' }],
              },
            ],
            options: [
              {
                id: 'opt1',
                text: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '120/80' }],
                  },
                ],
              },
              {
                id: 'opt2',
                text: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '140/90' }],
                  },
                ],
              },
            ],
            correctAnswers: ['opt1'],
            difficulty: 'easy',
            explanation: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '120/80 is normal BP.' }],
              },
            ],
            answerIndex: 0,
            questionType: 'knowledge',
            multi: false,
          },
          {
            id: 2,
            type: 'mcq',
            question: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'When should you refer?' }],
              },
            ],
            options: [
              {
                id: 'opt1',
                text: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '>=140/90' }],
                  },
                ],
              },
              {
                id: 'opt2',
                text: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '120/80' }],
                  },
                ],
              },
            ],
            correctAnswers: ['opt1'],
            difficulty: 'easy',
            explanation: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'High BP requires referral.' }],
              },
            ],
            answerIndex: 0,
            questionType: 'application',
            multi: false,
          },
        ],
      },
      estimateMinutes: 10,
    };
    persistDraft(nextDraft);
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/content' && method === 'PUT') {
    if (typeof body === 'object' && body) {
      const payload = body as Partial<ModuleDraftData>;
      const nextDraft: ModuleDraftData = {
        ...cloneDraft(),
        id: payload.id ?? courseDraftState.id,
        backendModuleId:
          payload.backendModuleId ?? courseDraftState.backendModuleId,
        documentId: payload.documentId ?? courseDraftState.documentId,
        isReadOnly: payload.isReadOnly ?? courseDraftState.isReadOnly,
        title: payload.title ?? courseDraftState.title,
        topic: payload.topic ?? courseDraftState.topic,
        description: payload.description ?? courseDraftState.description,
        status: payload.status ?? courseDraftState.status,
        generationStatus:
          payload.generationStatus ?? courseDraftState.generationStatus,
        generatedAt: payload.generatedAt ?? courseDraftState.generatedAt,
        sourceFile: payload.sourceFile ?? courseDraftState.sourceFile,
        estimateMinutes:
          payload.estimateMinutes ?? courseDraftState.estimateMinutes,
        moduleDetails: payload.moduleDetails ?? courseDraftState.moduleDetails,
        lessons: payload.lessons ?? courseDraftState.lessons,
        moduleContent: payload.moduleContent ?? courseDraftState.moduleContent,
        quiz: payload.quiz ?? courseDraftState.quiz,
      };
      persistDraft(nextDraft);
    }
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/quiz' && method === 'PUT') {
    if (typeof body === 'object' && body) {
      const payload = body as { quiz?: ModuleDraftData['quiz'] };
      const nextDraft: ModuleDraftData = {
        ...cloneDraft(),
        quiz: payload.quiz ?? courseDraftState.quiz,
      };
      persistDraft(nextDraft);
    }
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/draft/save' && method === 'POST') {
    return { data: { status: 'draft_saved', draft: cloneDraft() } };
  }
  if (url === 'program-manager/courses/publish') {
    const nextDraft: ModuleDraftData = {
      ...cloneDraft(),
      status: 'published',
    };
    persistDraft(nextDraft);
    return { data: { status: 'published', draft: cloneDraft() } };
  }

  if (url === 'admin/configs' && method === 'GET') {
    return { data: mockConfigsState };
  }

  if (url === 'admin/configs' && method === 'POST') {
    const payload = body as {
      key?: unknown;
      title?: unknown;
      value_json?: unknown;
      description?: unknown;
    };
    const key = asString(payload.key)?.trim();
    if (!key) {
      return {
        error: {
          status: 400,
          data: { message: 'Config key is required' },
        },
      };
    }
    if (mockConfigsState.some((config) => config.key === key)) {
      return {
        error: {
          status: 409,
          data: { message: `Config key "${key}" already exists` },
        },
      };
    }
    const now = new Date().toISOString();
    const nextId =
      mockConfigsState.reduce((max, config) => Math.max(max, config.id), 0) + 1;
    const created: MockConfigThreshold = {
      id: nextId,
      version: 1,
      key,
      title: typeof payload.title === 'string' ? payload.title : null,
      value_json: payload.value_json ?? null,
      description:
        typeof payload.description === 'string' ? payload.description : null,
      created_at: now,
      updated_at: now,
    };
    mockConfigsState = [...mockConfigsState, created];
    return { data: created };
  }

  if (url.startsWith('admin/configs/') && method === 'GET') {
    const remainder = url.slice('admin/configs/'.length);
    const changesMatch = remainder.match(/^([^/]+)\/changes$/);
    if (changesMatch) {
      const configKey = decodeURIComponent(changesMatch[1] ?? '');
      const config = mockConfigsState.find((item) => item.key === configKey);
      if (!config) {
        return {
          error: {
            status: 404,
            data: { message: `Config "${configKey}" not found` },
          },
        };
      }
      const query =
        typeof params === 'object' && params
          ? (params as { limit?: unknown; offset?: unknown })
          : {};
      const limit = Number.isFinite(Number(query.limit))
        ? Math.max(1, Number(query.limit))
        : 50;
      const offset = Number.isFinite(Number(query.offset))
        ? Math.max(0, Number(query.offset))
        : 0;
      const allChanges = mockConfigChangesState[configKey] ?? [];
      const total_changes = allChanges.length;
      const total_pages =
        total_changes > 0 ? Math.ceil(total_changes / limit) : 0;
      return {
        data: {
          changes: allChanges.slice(offset, offset + limit),
          total_changes,
          total_pages,
          limit,
          offset,
        },
      };
    }

    const configKey = decodeURIComponent(remainder);
    const config = mockConfigsState.find((item) => item.key === configKey);
    if (!config) {
      return {
        error: {
          status: 404,
          data: { message: `Config "${configKey}" not found` },
        },
      };
    }
    return { data: config };
  }

  if (url.startsWith('admin/configs/') && method === 'PUT') {
    const configKey = decodeURIComponent(url.slice('admin/configs/'.length));
    const existingIndex = mockConfigsState.findIndex(
      (config) => config.key === configKey,
    );
    if (existingIndex < 0) {
      return {
        error: {
          status: 404,
          data: { message: `Config "${configKey}" not found` },
        },
      };
    }
    const payload = body as {
      title?: unknown;
      value_json?: unknown;
      description?: unknown;
    };
    const existing = mockConfigsState[existingIndex];
    const nextValue =
      'value_json' in payload ? payload.value_json : existing.value_json;
    const valueChanged =
      JSON.stringify(nextValue) !== JSON.stringify(existing.value_json);
    const now = new Date().toISOString();
    const updated: MockConfigThreshold = {
      ...existing,
      title:
        typeof payload.title === 'string'
          ? payload.title
          : payload.title === null
            ? null
            : existing.title,
      value_json: nextValue,
      description:
        typeof payload.description === 'string'
          ? payload.description
          : payload.description === null
            ? null
            : existing.description,
      version: valueChanged ? existing.version + 1 : existing.version,
      updated_at: valueChanged ? now : existing.updated_at,
    };
    mockConfigsState = mockConfigsState.map((config, index) =>
      index === existingIndex ? updated : config,
    );
    if (valueChanged) {
      const previous = mockConfigChangesState[configKey] ?? [];
      mockConfigChangesState = {
        ...mockConfigChangesState,
        [configKey]: [
          {
            previous_value_json: existing.value_json,
            current_value_json: nextValue,
            updated_by: 'admin',
            updated_at: now,
          },
          ...previous,
        ],
      };
    }
    return { data: updated };
  }

  if (url === 'admin/divisions' && method === 'GET') {
    const query =
      typeof params === 'object' && params
        ? (params as { limit?: unknown; offset?: unknown; q?: unknown })
        : {};
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;
    const nameQuery =
      typeof query.q === 'string' && query.q.trim()
        ? query.q.trim().toLowerCase()
        : null;
    const divisions = [
      {
        id: 1,
        name: 'Rangpur',
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 2,
        name: 'Rajshahi',
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
    ].filter((division) =>
      nameQuery ? division.name.toLowerCase().includes(nameQuery) : true,
    );
    return {
      data: {
        divisions: divisions.slice(offset, offset + limit),
        total: divisions.length,
        total_pages: limit > 0 ? Math.ceil(divisions.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (url === 'admin/districts' && method === 'GET') {
    const query =
      typeof params === 'object' && params
        ? (params as {
            limit?: unknown;
            offset?: unknown;
            q?: unknown;
            division_id?: unknown;
          })
        : {};
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;
    const divisionIdFilter =
      query.division_id === undefined || query.division_id === null
        ? null
        : Number(query.division_id);
    const nameQuery =
      typeof query.q === 'string' && query.q.trim()
        ? query.q.trim().toLowerCase()
        : null;
    const districts = [
      {
        id: 10,
        name: 'Lalmonirhat',
        division_id: 1,
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 11,
        name: 'Kurigram',
        division_id: 1,
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 20,
        name: 'Naogaon',
        division_id: 2,
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
    ].filter((district) => {
      if (
        divisionIdFilter !== null &&
        Number.isFinite(divisionIdFilter) &&
        district.division_id !== divisionIdFilter
      ) {
        return false;
      }
      return nameQuery ? district.name.toLowerCase().includes(nameQuery) : true;
    });
    return {
      data: {
        districts: districts.slice(offset, offset + limit),
        total: districts.length,
        total_pages: limit > 0 ? Math.ceil(districts.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (url === 'admin/hierarchy/users' && method === 'GET') {
    const query =
      typeof params === 'object' && params
        ? (params as {
            limit?: unknown;
            offset?: unknown;
            district_id?: unknown;
            division_id?: unknown;
            role?: unknown;
            parent_id?: unknown;
            upazila_id?: unknown;
            q?: unknown;
          })
        : {};
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;
    const divisionIdFilter =
      query.division_id === undefined || query.division_id === null
        ? null
        : Number(query.division_id);
    const districtIdFilter =
      query.district_id === undefined || query.district_id === null
        ? null
        : Number(query.district_id);
    const parentIdFilter =
      query.parent_id === undefined || query.parent_id === null
        ? null
        : Number(query.parent_id);
    const upazilaIdFilter =
      query.upazila_id === undefined || query.upazila_id === null
        ? null
        : Number(query.upazila_id);
    const roleFilter =
      typeof query.role === 'string' && query.role.trim()
        ? query.role.trim()
        : null;
    const nameQuery =
      typeof query.q === 'string' && query.q.trim()
        ? query.q.trim().toLowerCase()
        : null;
    const users = [
      {
        id: 1723477249,
        name: 'Area Manager',
        role: 'AREA_MANAGER',
        parent_id: null,
        division_id: 1,
        division: 'Rangpur',
        district_id: 10,
        upazilas: [],
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 1708515793,
        name: 'Md Abdus Salam',
        role: 'PO',
        parent_id: 1723477249,
        division_id: 1,
        division: 'Rangpur',
        district_id: 10,
        upazilas: [{ id: 1, name: 'Lalmonirhat Sadar', district_id: 10 }],
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 1708515794,
        name: 'Mst. Rabeya Khatun',
        role: 'PO',
        parent_id: 1723477249,
        division_id: 1,
        division: 'Rangpur',
        district_id: 10,
        upazilas: [{ id: 2, name: 'Hatibandha', district_id: 10 }],
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 1313053891,
        name: 'Mst. Hosneyara Begum',
        role: 'SHASTIYA_KORMI',
        parent_id: 1708515793,
        division_id: 1,
        division: 'Rangpur',
        district_id: 10,
        upazilas: [{ id: 1, name: 'Lalmonirhat Sadar', district_id: 10 }],
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
    ].filter((user) => {
      if (
        divisionIdFilter !== null &&
        Number.isFinite(divisionIdFilter) &&
        user.division_id !== divisionIdFilter
      ) {
        return false;
      }
      if (
        districtIdFilter !== null &&
        Number.isFinite(districtIdFilter) &&
        user.district_id !== districtIdFilter
      ) {
        return false;
      }
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }
      if (
        parentIdFilter !== null &&
        Number.isFinite(parentIdFilter) &&
        user.parent_id !== parentIdFilter
      ) {
        return false;
      }
      if (
        upazilaIdFilter !== null &&
        Number.isFinite(upazilaIdFilter) &&
        !user.upazilas.some((upazila) => upazila.id === upazilaIdFilter)
      ) {
        return false;
      }
      if (nameQuery && !user.name.toLowerCase().includes(nameQuery)) {
        return false;
      }
      return true;
    });
    return {
      data: {
        users: users.slice(offset, offset + limit),
        total: users.length,
        total_pages: limit > 0 ? Math.ceil(users.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (url === 'admin/assignments' && method === 'POST') {
    const payload = body as {
      module_id: string;
      user_ids?: number[];
      upazila_ids?: number[];
      district_ids?: number[];
      division_ids?: number[];
      expand_po_assignees?: boolean;
    };
    const now = new Date().toISOString();
    const moduleItem = mockModuleLibrary.modules.find(
      (m) => m.id === payload.module_id,
    );
    const titleText = moduleItem?.title?.trim() || 'Unknown';
    const title = { bn: titleText, en: titleText };
    const nextIds = resolveAssigneeIdsFromPayload(payload);
    const existingUserIds = new Set(
      mockAssignmentsState
        .filter(
          (assignment) =>
            assignment.module_id === payload.module_id &&
            assignment.user_id !== null,
        )
        .map((assignment) => assignment.user_id as number),
    );
    const newIds: string[] = [];
    for (const userId of nextIds) {
      if (existingUserIds.has(userId)) continue;
      const user = mockHierarchyUsersForAssign.find(
        (item) => item.id === userId,
      );
      const id = `mock-assign-${Math.random().toString(36).substring(7)}`;
      newIds.push(id);
      mockAssignmentsState.push({
        id,
        module_id: payload.module_id,
        module_title: title,
        assignment_type: 'individual',
        tenant_id: null,
        user_id: userId,
        user: user
          ? {
              id: user.id,
              name: user.name,
              role:
                user.role === 'SHASTIYA_KORMI'
                  ? 'SK'
                  : user.role === 'AREA_MANAGER'
                    ? 'AM'
                    : 'PO',
              district: user.district,
              upazila: user.upazilas[0]?.name ?? null,
              parent_id: user.parent_id,
            }
          : null,
        upazila: null,
        assigned_by: 1,
        assigned_at: now,
        created_at: now,
        updated_at: now,
      });
    }
    return {
      data: {
        assigned_count: newIds.length,
        assignment_ids: newIds,
      },
    };
  }

  if (url.startsWith('admin/assignments/') && url.endsWith('/users')) {
    const moduleId = decodeURIComponent(
      url.slice('admin/assignments/'.length, -'/users'.length),
    );
    if (method === 'GET') {
      const userIds = Array.from(
        new Set(
          mockAssignmentsState
            .filter(
              (assignment) =>
                assignment.module_id === moduleId &&
                assignment.user_id !== null,
            )
            .map((assignment) => assignment.user_id as number),
        ),
      );
      return {
        data: {
          module_id: moduleId,
          users: usersForIds(userIds),
        },
      };
    }
    if (method === 'PUT') {
      const payload = (body ?? {}) as {
        user_ids?: number[];
        upazila_ids?: number[];
        district_ids?: number[];
        division_ids?: number[];
        expand_po_assignees?: boolean;
      };
      const nextIds = resolveAssigneeIdsFromPayload(payload);
      const previousIds = new Set(
        mockAssignmentsState
          .filter(
            (assignment) =>
              assignment.module_id === moduleId && assignment.user_id !== null,
          )
          .map((assignment) => assignment.user_id as number),
      );
      const now = new Date().toISOString();
      const moduleItem = mockModuleLibrary.modules.find(
        (m) => m.id === moduleId,
      );
      const titleText = moduleItem?.title?.trim() || 'Unknown';
      const title = { bn: titleText, en: titleText };
      mockAssignmentsState = mockAssignmentsState.filter(
        (assignment) => assignment.module_id !== moduleId,
      );
      const assignmentIds: string[] = [];
      for (const userId of nextIds) {
        const user = mockHierarchyUsersForAssign.find(
          (item) => item.id === userId,
        );
        const id = `mock-assign-${Math.random().toString(36).substring(7)}`;
        assignmentIds.push(id);
        mockAssignmentsState.push({
          id,
          module_id: moduleId,
          module_title: title,
          assignment_type: 'individual',
          tenant_id: null,
          user_id: userId,
          user: user
            ? {
                id: user.id,
                name: user.name,
                role:
                  user.role === 'SHASTIYA_KORMI'
                    ? 'SK'
                    : user.role === 'AREA_MANAGER'
                      ? 'AM'
                      : 'PO',
                district: user.district,
                upazila: user.upazilas[0]?.name ?? null,
                parent_id: user.parent_id,
              }
            : null,
          upazila: null,
          assigned_by: 1,
          assigned_at: now,
          created_at: now,
          updated_at: now,
        });
      }
      const nextSet = new Set(nextIds);
      return {
        data: {
          added_count: nextIds.filter((id) => !previousIds.has(id)).length,
          removed_count: Array.from(previousIds).filter(
            (id) => !nextSet.has(id),
          ).length,
          assignment_ids: assignmentIds,
        },
      };
    }
  }

  if (url.includes('district-list')) {
    return {
      data: {
        entityList: [
          { id: 10, name: 'Bo District', countryId: 1, tenantId: 4000 },
          { id: 11, name: 'Kenema District', countryId: 1, tenantId: 4001 },
        ],
      },
    };
  }
  if (url.includes('chiefdom-list')) {
    return {
      data: {
        entityList: [
          { id: 100, name: 'Kakua Chiefdom', districtId: 10, tenantId: 5000 },
          { id: 101, name: 'Nongowa Chiefdom', districtId: 11, tenantId: 5001 },
        ],
      },
    };
  }
  if (url.includes('villages-list')) {
    return {
      data: {
        entityList: [
          { id: 1000, name: 'Bo Village', chiefdomId: 100 },
          { id: 1001, name: 'Kenema Village', chiefdomId: 101 },
        ],
      },
    };
  }
  if (url.includes('user/admin-users')) {
    return {
      data: {
        entityList: [
          {
            id: 101,
            firstName: 'Fatema',
            lastName: 'Jannat',
            username: 'chw_fatema',
            tenantId: 5000,
            villages: [{ id: 1000, name: 'Bo Village' }],
          },
          {
            id: 102,
            firstName: 'Momotaj',
            lastName: 'Begum',
            username: 'chw_momotaj',
            tenantId: 5000,
            villages: [{ id: 1000, name: 'Bo Village' }],
          },
          {
            id: 103,
            firstName: 'Nasrin',
            lastName: 'Khatun',
            username: 'chw_nasrin',
            tenantId: 5001,
            villages: [{ id: 1001, name: 'Kenema Village' }],
          },
        ],
        totalCount: 3,
      },
    };
  }

  // Knowledge library — matches coaching-platform ingestion-merge contract.
  if (url === 'admin/knowledge/upload' && method === 'POST') {
    const form = body instanceof FormData ? body : null;
    const file = form?.get('file');
    const title =
      asString(form?.get('title')) ??
      (file instanceof File
        ? file.name.replace(/\.pdf$/i, '')
        : 'Untitled Knowledge');
    const thumbnailStoragePath = asString(form?.get('thumbnail_storage_path'));
    let splits: Array<{
      title: string;
      start_page: number;
      end_page: number;
      thumbnail_storage_path?: string | null;
    }> = [];
    const splitsRaw = form?.get('splits');
    if (typeof splitsRaw === 'string' && splitsRaw.trim()) {
      try {
        const parsed = JSON.parse(splitsRaw) as unknown;
        if (Array.isArray(parsed)) {
          splits = parsed
            .filter(
              (
                row,
              ): row is {
                title: string;
                start_page: number;
                end_page: number;
                thumbnail_storage_path?: string | null;
              } =>
                Boolean(
                  row &&
                  typeof row === 'object' &&
                  typeof (row as { title?: unknown }).title === 'string' &&
                  typeof (row as { start_page?: unknown }).start_page ===
                    'number' &&
                  typeof (row as { end_page?: unknown }).end_page === 'number',
                ),
            )
            .map((row) => ({
              title: row.title,
              start_page: row.start_page,
              end_page: row.end_page,
              thumbnail_storage_path: row.thumbnail_storage_path ?? null,
            }));
        }
      } catch {
        splits = [];
      }
    }

    const now = new Date().toISOString();
    const filename =
      file instanceof File ? file.name : 'knowledge-document.pdf';
    const defs = splits.length
      ? splits
      : [
          {
            title,
            start_page: null as number | null,
            end_page: null as number | null,
            thumbnail_storage_path: thumbnailStoragePath ?? null,
          },
        ];

    const sources = defs.map((def, index) => {
      const id = `knowledge-upload-${Date.now()}-${index + 1}`;
      const originalFilename = splits.length
        ? `${filename.replace(/\.pdf$/i, '')}_p${def.start_page}-${def.end_page}.pdf`
        : filename;
      const storedPath = `medtronics-storage/source-documents/knowledge/${id}.pdf`;
      mockSourceDocuments.unshift({
        id,
        title: def.title,
        source_type: 'pdf',
        status: 'uploaded',
        content_domain: 'clinical',
        authority_label: '',
        stored_path: storedPath,
        original_filename: originalFilename,
        description: null,
        thumbnail_storage_path: def.thumbnail_storage_path ?? null,
        uploaded_date: now,
        ingested_at: now,
        updated_at: now,
        uploaded_by: { id: 99, name: 'admin' },
        updated_by: { id: 99, name: 'admin' },
        ingested_by: { id: 99, name: 'admin' },
        assigned: false,
        sync_published_visible: true,
      });
      return {
        source_document_id: id,
        title: def.title,
        stored_path: storedPath,
        thumbnail_storage_path: def.thumbnail_storage_path ?? null,
        start_page: def.start_page,
        end_page: def.end_page,
      };
    });

    return { data: { sources } };
  }

  if (url === 'admin/knowledge/uploaders' && method === 'GET') {
    const query =
      params && typeof params === 'object' ? (params as { q?: unknown }) : {};
    const term = (asString(query.q) ?? '').trim().toLowerCase();
    const byId = new Map<number, string>();
    for (const doc of mockSourceDocuments) {
      if (!doc.sync_published_visible || !doc.uploaded_by) continue;
      byId.set(doc.uploaded_by.id, doc.uploaded_by.name);
    }
    const actors = Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .filter((actor) =>
        term
          ? actor.name.toLowerCase().includes(term) ||
            String(actor.id).includes(term)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return { data: { uploaders: actors } };
  }

  if (url === 'admin/upazilas' && method === 'GET') {
    const query =
      typeof params === 'object' && params
        ? (params as {
            district_id?: unknown;
            limit?: unknown;
            offset?: unknown;
            q?: unknown;
          })
        : {};
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;
    const districtIdFilter =
      query.district_id === undefined || query.district_id === null
        ? null
        : Number(query.district_id);
    const nameQuery =
      typeof query.q === 'string' && query.q.trim()
        ? query.q.trim().toLowerCase()
        : null;
    const upazilas = [
      {
        id: 1,
        name: 'Lalmonirhat Sadar',
        district_id: 10,
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: 2,
        name: 'Hatibandha',
        district_id: 10,
        tenant_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: 'system',
        updated_by: 'system',
      },
    ].filter((row) => {
      if (
        districtIdFilter !== null &&
        Number.isFinite(districtIdFilter) &&
        row.district_id !== districtIdFilter
      ) {
        return false;
      }
      if (nameQuery && !row.name.toLowerCase().includes(nameQuery)) {
        return false;
      }
      return true;
    });
    return {
      data: {
        upazilas: upazilas.slice(offset, offset + limit),
        total: upazilas.length,
        total_pages: limit > 0 ? Math.ceil(upazilas.length / limit) : 0,
        limit,
        offset,
      },
    };
  }

  if (url.startsWith('admin/knowledge/') && method === 'DELETE') {
    const id = decodeURIComponent(url.slice('admin/knowledge/'.length));
    const doc = mockSourceDocuments.find((row) => row.id === id);
    if (!doc) {
      return {
        error: { status: 404, data: { code: 'source_not_found' } },
      };
    }
    if (doc.sync_published_visible === false) {
      return { error: { status: 403, data: { code: 'forbidden' } } };
    }
    doc.status = 'retired';
    return { data: undefined };
  }

  return {
    error: {
      status: 404,
      data: { message: `No mock handler for ${url}` },
    },
  };
};

export const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = mockBaseQueryImpl;
