import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import {
  getMockChwDetail,
  mockDashboardSummary,
  mockFlags,
  mockLeaderboard,
  mockModuleLibrary,
  mockModules,
  mockProgramChwRoster,
  mockProgramEscalations,
  mockProgramOverview,
  mockProgramRankings,
  mockProgramSupervisorDetails,
  mockProgramSupervisors,
  mockCourseDraft,
  mockPerformanceMatrix,
  mockQuizPerformance,
  mockReports,
} from '@/store/apis/mockData';
import type { CourseDraftData } from '@/features/program-manager/types/programManager.types';
import type { CHWPerformanceResponse } from '@/types/supervisor.types';

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

function pageSlice<T>(items: T[], page: number, limit: number): T[] {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : items.length;
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
}

let courseDraftState: CourseDraftData = JSON.parse(
  JSON.stringify(mockCourseDraft),
) as CourseDraftData;

export const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  // Simulate real network latency.
  await sleep(500);

  const rawUrl = withoutLeadingSlash(getUrl(args));
  const url = rawUrl.replace(/^api\/v1\//, '').replace(/^\/?api\/v1\//, '');
  const params = getParams(args);
  const method = getMethod(args).toUpperCase();
  const body = getBody(args);
  const cloneDraft = () =>
    JSON.parse(JSON.stringify(courseDraftState)) as CourseDraftData;
  const persistDraft = (nextDraft: CourseDraftData) => {
    courseDraftState = nextDraft;
  };

  // Dashboard endpoints
  if (url === 'dashboard/summary') {
    return { data: mockDashboardSummary };
  }
  if (url === 'dashboard/flags') {
    return { data: mockFlags };
  }
  if (url === 'dashboard/modules') {
    return { data: mockModules };
  }
  if (url === 'dashboard/leaderboard') {
    return { data: mockLeaderboard };
  }
  if (url === 'dashboard/performance-matrix') {
    const page =
      typeof params === 'object' && params && 'page' in params
        ? Number((params as { page?: unknown }).page)
        : 1;
    const limit =
      typeof params === 'object' && params && 'limit' in params
        ? Number((params as { limit?: unknown }).limit)
        : 30;

    const sliced: CHWPerformanceResponse = {
      ...mockPerformanceMatrix,
      data: pageSlice(mockPerformanceMatrix.data, page, limit),
      pagination: { page, total: mockPerformanceMatrix.data.length },
    };
    return { data: sliced };
  }

  // Module library endpoints
  if (url === 'module-library') {
    return { data: mockModuleLibrary };
  }

  // Admin endpoints (mocked when VITE_USE_MOCK_API or in tests)
  if (url === 'admin/v3/files/presigned-url' && method === 'GET') {
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

  if (url === 'admin/v3/files' && method === 'POST') {
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

    const items = mockModuleLibrary.modules
      .filter((m) => (status ? m.status === status : true))
      .map((m, idx) => ({
        id: m.id,
        module_family_id: `family_${m.id}`,
        version: 1,
        title_bn: m.title,
        title_en: null,
        description_bn: m.category,
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
          m.status === 'published' ? new Date().toISOString() : null,
        created_at: new Date(Date.now() - idx * 86400000).toISOString(),
        quality_flags: { flags: [] },
      }));

    return { data: items.slice(offset, offset + limit) };
  }

  // Quiz performance endpoints
  if (url === 'quiz-performance') {
    return { data: mockQuizPerformance };
  }

  // Reports endpoints
  if (url === 'reports') {
    return { data: mockReports };
  }

  // Program manager endpoints
  if (url === 'program-manager/overview') {
    return { data: mockProgramOverview };
  }
  if (url === 'program-manager/supervisors') {
    return { data: mockProgramSupervisors };
  }
  if (url.startsWith('program-manager/supervisors/')) {
    const supervisorId = decodeURIComponent(
      url.slice('program-manager/supervisors/'.length),
    );
    return {
      data: mockProgramSupervisorDetails[supervisorId] ?? {
        ...mockProgramSupervisorDetails.SUP004,
        id: supervisorId,
      },
    };
  }
  if (url === 'program-manager/chw-roster') {
    return { data: mockProgramChwRoster };
  }
  if (url === 'program-manager/escalations') {
    return { data: mockProgramEscalations };
  }
  if (url === 'program-manager/rankings') {
    return { data: mockProgramRankings };
  }
  if (url === 'program-manager/courses/draft') {
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/draft/reset' && method === 'POST') {
    persistDraft(
      JSON.parse(JSON.stringify(mockCourseDraft)) as CourseDraftData,
    );
    return { data: cloneDraft() };
  }
  if (url === 'program-manager/courses/draft/seed' && method === 'POST') {
    if (typeof body === 'object' && body) {
      const nextDraft = JSON.parse(JSON.stringify(body)) as CourseDraftData;
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
    const nextDraft: CourseDraftData = {
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
      const payload = body as Partial<CourseDraftData>;
      const nextDraft: CourseDraftData = {
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
      const payload = body as { quiz?: CourseDraftData['quiz'] };
      const nextDraft: CourseDraftData = {
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
    const nextDraft: CourseDraftData = {
      ...cloneDraft(),
      status: 'published',
    };
    persistDraft(nextDraft);
    return { data: { status: 'published', draft: cloneDraft() } };
  }

  // CHW detail endpoint: chw/{chw_id}
  if (url.startsWith('chw/')) {
    const chwId = decodeURIComponent(url.slice('chw/'.length));
    return { data: getMockChwDetail(chwId) };
  }

  return {
    error: {
      status: 404,
      data: { message: `No mock handler for ${url}` },
    },
  };
};
