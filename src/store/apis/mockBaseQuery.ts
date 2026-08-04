import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import {
  mockCourseDraft,
  mockModuleLibrary,
  mockSourceDocuments,
} from '@/store/apis/mockData';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';

const mockModuleDeactivatedAt = new Map<string, string>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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

interface MockVideoAssignment {
  id: string;
  source_document_id: string;
  video_title: string | null;
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

let mockConfigsState: MockConfigThreshold[] = [
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

const mockVideoAssignmentsState: MockVideoAssignment[] = [];

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
    const name = file instanceof File ? file.name : 'upload.bin';
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    const objectName = `media/mock-${Date.now()}${ext}`;
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

  if (url === 'admin/modules/domains') {
    const status = asString(
      typeof params === 'object' && params && 'status' in params
        ? (params as { status?: unknown }).status
        : undefined,
    );
    const domains = [
      ...new Set(
        mockModuleLibrary.modules
          .filter((m) => (status ? m.status === status : true))
          .map((m) => m.category)
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
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
            ? (mockModuleDeactivatedAt.get(m.id) ?? null)
            : null,
        last_reactivated_at: null,
        quality_flags: { flags: [] },
      }))
      .filter((item) => (domain ? item.domain === domain : true))
      .filter((item) => {
        const activatedAt =
          item.last_reactivated_at ??
          item.first_activated_at ??
          item.published_at;
        return (
          inRange(item.created_at, createdFrom, createdTo) &&
          inRange(item.published_at, publishedFrom, publishedTo) &&
          inRange(activatedAt, activatedFrom, activatedTo) &&
          inRange(item.last_deactivated_at, deactivatedFrom, deactivatedTo)
        );
      });

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
            limit?: unknown;
            offset?: unknown;
          })
        : {};
    // Backend defaults to "ingested" when the status param is omitted.
    const rawStatuses = Array.isArray(query.status)
      ? query.status
      : [query.status];
    const statuses = rawStatuses
      .flatMap((value) => (asString(value) ?? '').split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const effectiveStatuses = statuses.length ? statuses : ['ingested'];
    const rawSourceTypes = Array.isArray(query.source_type)
      ? query.source_type
      : [query.source_type];
    const sourceTypes = rawSourceTypes
      .flatMap((value) => (asString(value) ?? '').split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const filenameQuery = (asString(query.q) ?? '').trim().toLowerCase();
    const limit = 'limit' in query ? Number(query.limit) : 50;
    const offset = 'offset' in query ? Number(query.offset) : 0;

    const items = mockSourceDocuments
      .filter((doc) => effectiveStatuses.includes(doc.status.toLowerCase()))
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

  if (url === 'admin/video-assignments') {
    if (method === 'GET') {
      const sourceDocumentId =
        typeof params === 'object' && params && 'source_document_id' in params
          ? asString(
              (params as { source_document_id?: unknown }).source_document_id,
            )
          : undefined;
      const assignmentType = asString(
        typeof params === 'object' && params && 'assignment_type' in params
          ? (params as { assignment_type?: unknown }).assignment_type
          : undefined,
      );
      let results = mockVideoAssignmentsState;
      if (sourceDocumentId) {
        results = results.filter(
          (assignment) => assignment.source_document_id === sourceDocumentId,
        );
      }
      if (
        assignmentType === 'individual' ||
        assignmentType === 'po_sk' ||
        assignmentType === 'geographical' ||
        assignmentType === 'group'
      ) {
        results = results.filter(
          (assignment) => assignment.assignment_type === assignmentType,
        );
      }
      return { data: results };
    }
    if (method === 'POST') {
      const payload = body as {
        source_document_id: string;
        assignment_type: 'individual' | 'po_sk' | 'geographical' | 'group';
        user_ids?: number[];
        tenant_ids?: number[];
        upazilas?: string[];
      };
      const sourceDoc = mockSourceDocuments.find(
        (doc) => doc.id === payload.source_document_id,
      );
      if (!sourceDoc || sourceDoc.source_type !== 'video') {
        return {
          error: {
            status: 404,
            data: { detail: 'Video source document not found' },
          },
        };
      }
      const newIds: string[] = [];
      const now = new Date().toISOString();
      const title = sourceDoc.title;
      if (payload.assignment_type === 'geographical' && payload.upazilas) {
        for (const upazila of payload.upazilas) {
          const existing = mockVideoAssignmentsState.find(
            (assignment) =>
              assignment.source_document_id === payload.source_document_id &&
              assignment.assignment_type === 'geographical' &&
              assignment.upazila === upazila,
          );
          if (existing) {
            newIds.push(existing.id);
            continue;
          }
          const id = `video-assign-${mockVideoAssignmentsState.length + 1}`;
          mockVideoAssignmentsState.push({
            id,
            source_document_id: payload.source_document_id,
            video_title: title,
            assignment_type: 'geographical',
            tenant_id: null,
            user_id: null,
            user: null,
            upazila,
            assigned_by: 1,
            assigned_at: now,
            created_at: now,
            updated_at: now,
          });
          newIds.push(id);
        }
      } else if (payload.user_ids?.length) {
        for (const userId of payload.user_ids) {
          const existing = mockVideoAssignmentsState.find(
            (assignment) =>
              assignment.source_document_id === payload.source_document_id &&
              assignment.user_id === userId,
          );
          if (existing) {
            existing.assignment_type = payload.assignment_type;
            existing.updated_at = now;
            newIds.push(existing.id);
            continue;
          }
          const id = `video-assign-${mockVideoAssignmentsState.length + 1}`;
          mockVideoAssignmentsState.push({
            id,
            source_document_id: payload.source_document_id,
            video_title: title,
            assignment_type: payload.assignment_type,
            tenant_id: null,
            user_id: userId,
            user: null,
            upazila: null,
            assigned_by: 1,
            assigned_at: now,
            created_at: now,
            updated_at: now,
          });
          newIds.push(id);
        }
      }
      return {
        data: {
          assigned_count: newIds.length,
          assignment_ids: newIds,
        },
      };
    }
  }

  if (url.startsWith('admin/video-assignments/') && method === 'DELETE') {
    const assignId = decodeURIComponent(
      url.slice('admin/video-assignments/'.length),
    );
    const index = mockVideoAssignmentsState.findIndex(
      (assignment) => assignment.id === assignId,
    );
    if (index < 0) {
      return { error: { status: 404, data: { detail: 'Not found' } } };
    }
    mockVideoAssignmentsState.splice(index, 1);
    return { data: { id: assignId, status: 'revoked' } };
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
    const configKey = decodeURIComponent(url.slice('admin/configs/'.length));
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
    const updated: MockConfigThreshold = {
      ...existing,
      title:
        typeof payload.title === 'string'
          ? payload.title
          : payload.title === null
            ? null
            : existing.title,
      value_json:
        'value_json' in payload ? payload.value_json : existing.value_json,
      description:
        typeof payload.description === 'string'
          ? payload.description
          : payload.description === null
            ? null
            : existing.description,
      version: existing.version + 1,
      updated_at: new Date().toISOString(),
    };
    mockConfigsState = mockConfigsState.map((config, index) =>
      index === existingIndex ? updated : config,
    );
    return { data: updated };
  }

  if (url === 'admin/users' && method === 'GET') {
    return {
      data: [
        {
          id: 1708515793,
          name: 'Md Abdus Salam',
          role: 'PO',
          district: 'Lalmonirhat',
          upazila: 'Lalmonirhat Sadar',
          parent_id: 1723477249,
        },
        {
          id: 1708515794,
          name: 'Mst. Rabeya Khatun',
          role: 'PO',
          district: 'Lalmonirhat',
          upazila: 'Hatibandha',
          parent_id: 1723477249,
        },
        {
          id: 1313053891,
          name: 'Mst. Hosneyara Begum',
          role: 'SK',
          district: 'Lalmonirhat',
          upazila: 'Lalmonirhat Sadar',
          parent_id: 1708515793,
        },
      ],
    };
  }

  if (url === 'admin/assignments') {
    if (method === 'GET') {
      const moduleId =
        typeof params === 'object' && params && 'module_id' in params
          ? asString((params as { module_id?: unknown }).module_id)
          : undefined;
      const assignmentType = asString(
        typeof params === 'object' && params && 'assignment_type' in params
          ? (params as { assignment_type?: unknown }).assignment_type
          : undefined,
      );

      let results = mockAssignmentsState;
      if (moduleId) {
        results = results.filter(
          (assignment) => assignment.module_id === moduleId,
        );
      }
      if (
        assignmentType === 'individual' ||
        assignmentType === 'po_sk' ||
        assignmentType === 'geographical' ||
        assignmentType === 'group'
      ) {
        results = results.filter(
          (assignment) => assignment.assignment_type === assignmentType,
        );
      }

      return { data: results };
    }
    if (method === 'POST') {
      const payload = body as {
        module_id: string;
        assignment_type: 'individual' | 'po_sk' | 'geographical' | 'group';
        user_ids?: number[];
        tenant_ids?: number[];
        upazilas?: string[];
      };
      const newIds: string[] = [];
      const now = new Date().toISOString();
      const moduleItem = mockModuleLibrary.modules.find(
        (m) => m.id === payload.module_id,
      );
      const title = moduleItem ? moduleItem.title : 'Unknown Module';
      const mockUsers = [
        {
          id: 1708515793,
          name: 'Md Abdus Salam',
          role: 'PO' as const,
          district: 'Lalmonirhat',
          upazila: 'Lalmonirhat Sadar',
          parent_id: 1723477249,
        },
        {
          id: 1708515794,
          name: 'Mst. Rabeya Khatun',
          role: 'PO' as const,
          district: 'Lalmonirhat',
          upazila: 'Hatibandha',
          parent_id: 1723477249,
        },
        {
          id: 1313053891,
          name: 'Mst. Hosneyara Begum',
          role: 'SK' as const,
          district: 'Lalmonirhat',
          upazila: 'Lalmonirhat Sadar',
          parent_id: 1708515793,
        },
      ];

      if (
        (payload.assignment_type === 'individual' ||
          payload.assignment_type === 'po_sk') &&
        payload.user_ids
      ) {
        for (const uid of payload.user_ids) {
          const exists = mockAssignmentsState.some(
            (a) =>
              a.module_id === payload.module_id &&
              a.assignment_type === payload.assignment_type &&
              a.user_id === uid,
          );
          if (!exists) {
            const id = `mock-assign-${Math.random().toString(36).substring(7)}`;
            newIds.push(id);
            mockAssignmentsState.push({
              id,
              module_id: payload.module_id,
              module_title: { bn: title, en: title },
              assignment_type: payload.assignment_type,
              tenant_id: null,
              user_id: uid,
              user: mockUsers.find((user) => user.id === uid) ?? null,
              assigned_by: 99,
              assigned_at: now,
              created_at: now,
              updated_at: now,
            });
          }
        }
      } else if (
        payload.assignment_type === 'geographical' &&
        payload.upazilas
      ) {
        for (const upazila of payload.upazilas) {
          const exists = mockAssignmentsState.some(
            (a) =>
              a.module_id === payload.module_id &&
              a.assignment_type === 'geographical' &&
              a.upazila === upazila,
          );
          if (!exists) {
            const id = `mock-assign-${Math.random().toString(36).substring(7)}`;
            newIds.push(id);
            mockAssignmentsState.push({
              id,
              module_id: payload.module_id,
              module_title: { bn: title, en: title },
              assignment_type: 'geographical',
              tenant_id: null,
              user_id: null,
              upazila,
              assigned_by: 99,
              assigned_at: now,
              created_at: now,
              updated_at: now,
            });
          }
        }
      } else if (payload.assignment_type === 'group' && payload.tenant_ids) {
        for (const tid of payload.tenant_ids) {
          const exists = mockAssignmentsState.some(
            (a) =>
              a.module_id === payload.module_id &&
              a.assignment_type === 'group' &&
              a.tenant_id === tid,
          );
          if (!exists) {
            const id = `mock-assign-${Math.random().toString(36).substring(7)}`;
            newIds.push(id);
            mockAssignmentsState.push({
              id,
              module_id: payload.module_id,
              module_title: { bn: title, en: title },
              assignment_type: 'group',
              tenant_id: tid,
              user_id: null,
              assigned_by: 99,
              assigned_at: now,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
      return {
        data: {
          assigned_count: newIds.length,
          assignment_ids: newIds,
        },
      };
    }
  }

  if (url.startsWith('admin/assignments/') && method === 'DELETE') {
    const assignId = decodeURIComponent(url.slice('admin/assignments/'.length));
    mockAssignmentsState = mockAssignmentsState.filter(
      (a) => a.id !== assignId,
    );
    return { data: { status: 'revoked' } };
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
