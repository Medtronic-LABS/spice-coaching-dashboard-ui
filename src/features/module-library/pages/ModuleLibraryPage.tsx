import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Loader,
  Modal,
  SearchInput,
  Tabs,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths } from '@/constants/routes';
import { getCurrentRole } from '@/constants/role';
import {
  useCreateModuleMutation,
  useFetchModulesQuery,
} from '@/features/module-library/api/adminModulesApi';
import type {
  ModuleLibraryItem,
  ModuleStatus,
} from '@/features/module-library/types/moduleLibrary.types';

const moduleBadge = (status: ModuleStatus) => {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-spice-semantic-successBg px-2 py-0.5 text-[10px] font-semibold text-spice-semantic-success ring-1 ring-spice-semantic-success/25">
        <span className="h-1.5 w-1.5 rounded-full bg-spice-semantic-success" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold text-spice-text-medium ring-1 ring-spice-border">
      Draft
    </span>
  );
};

export const ModuleLibraryPage = () => {
  const role = getCurrentRole();
  const isProgramManager = role === 'programManager';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'published' | 'drafts'>(
    isProgramManager ? 'all' : 'published',
  );
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    title_bn: '',
    title_en: '',
    description_bn: '',
    description_en: '',
    domain: 'clinical',
    sub_domain: 'immunization',
    module_type: 'refresher',
    estimated_minutes: 10,
    difficulty_level: 'moderate',
  });
  const [createModule, { isLoading: isCreating }] = useCreateModuleMutation();

  const lifecycleStatus = isProgramManager
    ? tab === 'published'
      ? 'published'
      : tab === 'drafts'
        ? 'draft'
        : undefined
    : 'published';
  const { data: adminModules } = useFetchModulesQuery(
    { limit: pageSize, offset: page * pageSize, status: lifecycleStatus },
    {},
  );

  const filtered = useMemo(() => {
    const rows: ModuleLibraryItem[] = (adminModules ?? [])
      .filter((m) => m.lifecycle_status !== 'retired')
      .map((m) => ({
        id: m.id,
        title: m.title_en ?? m.title_bn ?? 'Untitled module',
        category: m.domain,
        lessons: m.card_count,
        questions: m.quiz_count,
        durationLabel: `~${m.estimated_minutes} min`,
        status: m.lifecycle_status === 'published' ? 'published' : 'draft',
        lastUpdated: (m.published_at ?? m.created_at)
          .slice(0, 10)
          .replaceAll('-', ' '),
      }));
    const q = query.trim().toLowerCase();
    const publishedOnly = isProgramManager
      ? rows
      : rows.filter((r) => r.status === 'published');
    const byTab = isProgramManager
      ? tab === 'all'
        ? publishedOnly
        : publishedOnly.filter((r) =>
            tab === 'published'
              ? r.status === 'published'
              : r.status === 'draft',
          )
      : publishedOnly;
    if (!q) return byTab;
    return byTab.filter((r) =>
      `${r.title} ${r.category}`.toLowerCase().includes(q),
    );
  }, [adminModules, isProgramManager, query, tab]);

  const tableCaption = isProgramManager
    ? tab === 'published'
      ? 'Published modules'
      : tab === 'drafts'
        ? 'Draft modules'
        : 'All modules'
    : 'Published modules';

  const emptyMessage = isProgramManager
    ? tab === 'drafts'
      ? 'No drafts found.'
      : 'No modules found.'
    : 'No published modules found.';

  const columns: Array<ColumnDef<ModuleLibraryItem>> = useMemo(
    () => [
      {
        key: 'title',
        header: 'Module',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-spice-text-primary">
              {row.title}
            </div>
            <div className="text-xs text-spice-text-muted">{row.category}</div>
          </div>
        ),
      },
      {
        key: 'lessons',
        header: 'Content',
        render: (row) => (
          <div className="text-xs text-spice-text-medium">
            <span className="inline-flex items-center gap-4">
              <span>{row.lessons} lessons</span>
              <span>
                {row.questions > 0 ? `${row.questions} questions` : 'No quiz'}
              </span>
              <span>{row.durationLabel}</span>
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => moduleBadge(row.status),
      },
      // {
      //   key: 'lastUpdated',
      //   header: 'Updated by',
      //   render: (row) => (
      //     <span
      //       className={
      //         row.lastUpdated.toLowerCase().includes('overdue')
      //           ? 'text-xs font-semibold text-spice-semantic-error'
      //           : 'text-xs text-spice-text-medium'
      //       }
      //     >
      //       {row.lastUpdated}
      //     </span>
      //   ),
      // },
      {
        key: 'id',
        header: '',
        className: 'text-right',
        render: (row) => {
          if (row.status === 'published') {
            return (
              <div className="flex justify-end gap-2">
                {isProgramManager ? (
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() =>
                      navigate(
                        paths.adminModuleReviewDetails.replace(
                          ':moduleId',
                          encodeURIComponent(row.id),
                        ),
                      )
                    }
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() =>
                      navigate(
                        paths.adminModuleReviewDetails.replace(
                          ':moduleId',
                          encodeURIComponent(row.id),
                        ),
                      )
                    }
                  >
                    Review
                  </Button>
                )}
                <Button
                  className="h-8 px-3 text-xs"
                  onClick={() =>
                    navigate(paths.moduleAssigned, {
                      state: {
                        moduleName: row.title,
                        deadlineLabel: 'Mon, 28 Apr 2026',
                        assignedCount: chwId ? 1 : 8,
                        assignedNames: chwId ? ['Selected CHW'] : undefined,
                      },
                    })
                  }
                >
                  Assign
                </Button>
              </div>
            );
          }
          if (!isProgramManager) {
            return null;
          }
          return (
            <div className="flex justify-end gap-2">
              <Button
                className="h-8 px-3 text-xs"
                onClick={() =>
                  navigate(
                    paths.adminModuleReviewDetails.replace(
                      ':moduleId',
                      encodeURIComponent(row.id),
                    ),
                  )
                }
              >
                Review
              </Button>
            </div>
          );
        },
      },
    ],
    [chwId, isProgramManager, navigate],
  );

  return (
    <section className="space-y-5">
      <Loader open={isCreating} label="Creating module…" />
      {createOpen ? (
        <Modal
          open={createOpen}
          labelledBy="create-module-title"
          onClose={() => {
            if (isCreating) return;
            setCreateError('');
            setCreateOpen(false);
          }}
        >
          <Card
            variant="elevated"
            className="w-full max-w-2xl space-y-4 border-spice-border p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="create-module-title"
                  className="text-xl font-semibold text-spice-text-primary"
                >
                  Create module
                </h2>
                <p className="mt-1 text-xs text-spice-text-muted">
                  Creates a draft module in the admin module library.
                </p>
              </div>
              <Button
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={isCreating}
                onClick={() => {
                  setCreateError('');
                  setCreateOpen(false);
                }}
              >
                Close
              </Button>
            </div>

            {createError ? (
              <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {createError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Title (BN)
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.title_bn}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title_bn: e.target.value,
                    }))
                  }
                  placeholder="বাংলা শিরোনাম…"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Title (EN)
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.title_en}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title_en: e.target.value,
                    }))
                  }
                  placeholder="English title…"
                />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Description (BN)
                </span>
                <textarea
                  className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
                  value={createForm.description_bn}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description_bn: e.target.value,
                    }))
                  }
                  placeholder="মডিউল বিবরণ…"
                />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Description (EN)
                </span>
                <textarea
                  className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
                  value={createForm.description_en}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description_en: e.target.value,
                    }))
                  }
                  placeholder="Module description…"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Domain
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.domain}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      domain: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Sub-domain
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.sub_domain}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      sub_domain: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Module type
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.module_type}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      module_type: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Estimated minutes
                </span>
                <input
                  type="number"
                  min={0}
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.estimated_minutes}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      estimated_minutes: Number(e.target.value || 0),
                    }))
                  }
                />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Difficulty level
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                  value={createForm.difficulty_level}
                  disabled={isCreating}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      difficulty_level: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={isCreating}
                onClick={() => {
                  setCreateError('');
                  setCreateOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-9 text-xs"
                disabled={isCreating}
                onClick={async () => {
                  setCreateError('');
                  try {
                    const created = await createModule({
                      title_bn: createForm.title_bn.trim() || null,
                      title_en: createForm.title_en.trim() || null,
                      description_bn: createForm.description_bn.trim() || null,
                      description_en: createForm.description_en.trim() || null,
                      domain: createForm.domain.trim(),
                      sub_domain: createForm.sub_domain.trim() || null,
                      module_type: createForm.module_type.trim(),
                      estimated_minutes: Math.max(
                        0,
                        Number.isFinite(createForm.estimated_minutes)
                          ? createForm.estimated_minutes
                          : 0,
                      ),
                      difficulty_level:
                        createForm.difficulty_level.trim() || null,
                      module_json: {
                        cards: [
                          {
                            id: 'card-0',
                            title_bn: null,
                            body_bn: [
                              {
                                type: 'paragraph',
                                content: [{ type: 'text', text: '' }],
                              },
                            ],
                          },
                        ],
                      },
                    }).unwrap();
                    setCreateOpen(false);
                    navigate(
                      paths.adminModuleReviewDetails.replace(
                        ':moduleId',
                        encodeURIComponent(created.id),
                      ),
                    );
                  } catch {
                    setCreateError(
                      'Failed to create module. Please try again.',
                    );
                  }
                }}
              >
                {isCreating ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </Card>
        </Modal>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            {isProgramManager ? 'Modules' : t('moduleLibrary.title')}
          </h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-72">
            <SearchInput
              value={query}
              onChange={(next) => {
                setQuery(next);
                setPage(0);
              }}
              placeholder="Search modules..."
            />
          </div>
          {isProgramManager ? (
            <>
              <Button
                onClick={async () => {
                  setCreateError('');
                  setCreateOpen(true);
                }}
              >
                Create Module
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card variant="elevated" className="space-y-4">
        {isProgramManager ? (
          <Tabs
            items={[
              { label: 'All', value: 'all' },
              { label: 'Published', value: 'published' },
              { label: 'Drafts', value: 'drafts' },
            ]}
            value={tab}
            onChange={(value) => {
              setTab(value as typeof tab);
              setPage(0);
            }}
            className="max-w-[520px]"
          />
        ) : null}

        <Table<ModuleLibraryItem>
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          caption={tableCaption}
          emptyMessage={emptyMessage}
        />

        <div className="flex flex-col gap-2 border-t border-spice-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-spice-text-muted">
            Page{' '}
            <span className="font-semibold text-spice-text-medium">
              {page + 1}
            </span>
            {filtered.length ? (
              <>
                {' '}
                · Showing{' '}
                <span className="font-semibold text-spice-text-medium">
                  {page * pageSize + 1}
                </span>
                –
                <span className="font-semibold text-spice-text-medium">
                  {page * pageSize + filtered.length}
                </span>
              </>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={(adminModules?.length ?? 0) < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
};
