import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, SearchInput, Tabs } from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths } from '@/constants/routes';
import { getCurrentRole } from '@/constants/role';
import { useFetchModulesQuery } from '@/features/module-library/api/adminModulesApi';
import type {
  ModuleLibraryItem,
  ModuleStatus,
} from '@/features/module-library/types/moduleLibrary.types';

type LocationState = {
  chwId?: string;
};

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
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'published' | 'drafts'>('all');

  const lifecycleStatus =
    tab === 'published' ? 'published' : tab === 'drafts' ? 'draft' : undefined;
  const { data: adminModules } = useFetchModulesQuery(
    { limit: 50, offset: 0, status: lifecycleStatus },
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
    const byTab =
      tab === 'all'
        ? rows
        : rows.filter((r) =>
            tab === 'published'
              ? r.status === 'published'
              : r.status === 'draft',
          );
    if (!q) return byTab;
    return byTab.filter((r) =>
      `${r.title} ${r.category}`.toLowerCase().includes(q),
    );
  }, [adminModules, query, tab]);

  const published = filtered.filter((r) => r.status === 'published');
  const drafts = filtered.filter((r) => r.status === 'draft');

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
        render: (row) =>
          row.status === 'published' ? (
            <div className="flex justify-end gap-2">
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
              <Button
                className="h-8 px-3 text-xs"
                onClick={() =>
                  navigate(paths.moduleAssigned, {
                    state: {
                      moduleName: row.title,
                      deadlineLabel: 'Mon, 28 Apr 2026',
                      assignedCount: state.chwId ? 1 : 8,
                      assignedNames: state.chwId ? ['Selected CHW'] : undefined,
                    },
                  })
                }
              >
                Assign
              </Button>
            </div>
          ) : (
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
          ),
      },
    ],
    [navigate, state.chwId],
  );

  return (
    <section className="space-y-5">
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
              onChange={setQuery}
              placeholder="Search modules..."
            />
          </div>
          {isProgramManager ? (
            <>
              <Button
                onClick={async () => {
                  navigate(paths.moduleCreate);
                }}
              >
                Create Module
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Tabs
            items={[
              { label: 'All', value: 'all' },
              { label: 'Published', value: 'published' },
              { label: 'Drafts', value: 'drafts' },
            ]}
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
            className="max-w-[520px]"
          />
          <div className="hidden items-center gap-2 sm:flex">
            <Badge className="bg-spice-bg-tint text-spice-text-medium ring-1 ring-spice-border">
              {published.length} published
            </Badge>
            <Badge className="bg-spice-bg-tint text-spice-text-medium ring-1 ring-spice-border">
              {drafts.length} drafts
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {tab !== 'drafts' ? (
            <Table<ModuleLibraryItem>
              data={published}
              columns={columns}
              keyExtractor={(r) => r.id}
              caption="Published modules"
              emptyMessage="No modules found."
            />
          ) : null}

          {tab !== 'published' ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                Drafts
              </div>
              <Table<ModuleLibraryItem>
                data={drafts}
                columns={columns}
                keyExtractor={(r) => r.id}
                caption="Draft modules"
                emptyMessage="No drafts found."
              />
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
};
