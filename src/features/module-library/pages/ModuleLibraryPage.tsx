import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, SearchInput, Tabs } from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths } from '@/constants/routes';
import { useGetModuleLibraryQuery } from '@/features/module-library/api/moduleLibraryApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
      Draft
    </span>
  );
};

export const ModuleLibraryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'published' | 'drafts'>('all');

  const { data } = useGetModuleLibraryQuery(DEFAULT_DASHBOARD_PARAMS, {
    selectFromResult: ({ data }) => ({ data }),
  });
  const rows = data?.modules ?? [];

  const filtered = useMemo(() => {
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
  }, [query, rows, tab]);

  const published = filtered.filter((r) => r.status === 'published');
  const drafts = filtered.filter((r) => r.status === 'draft');

  const columns: Array<ColumnDef<ModuleLibraryItem>> = useMemo(
    () => [
      {
        key: 'title',
        header: 'Module',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">
              {row.title}
            </div>
            <div className="text-xs text-slate-500">{row.category}</div>
          </div>
        ),
      },
      {
        key: 'lessons',
        header: 'Content',
        render: (row) => (
          <div className="text-xs text-slate-600">
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
      {
        key: 'lastUpdated',
        header: 'Last updated',
        render: (row) => (
          <span
            className={
              row.lastUpdated.toLowerCase().includes('overdue')
                ? 'text-xs font-semibold text-red-600'
                : 'text-xs text-slate-600'
            }
          >
            {row.lastUpdated}
          </span>
        ),
      },
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
                onClick={() => undefined}
              >
                Edit
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
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => undefined}
              >
                Delete
              </Button>
              <Button className="h-8 px-3 text-xs" onClick={() => undefined}>
                Continue
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
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('moduleLibrary.title')}
          </h1>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search modules..."
          />
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
            <Badge className="bg-slate-50 text-slate-600 ring-1 ring-slate-200">
              {published.length} published
            </Badge>
            <Badge className="bg-slate-50 text-slate-600 ring-1 ring-slate-200">
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
              <div className="text-xs font-semibold tracking-wider text-slate-400">
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
