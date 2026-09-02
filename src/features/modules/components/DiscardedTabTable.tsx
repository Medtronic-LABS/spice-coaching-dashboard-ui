import { useMemo } from 'react';
import { EyeIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { Button, TruncatedText } from '@/components/ui';
import {
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
} from '@/constants/fieldLimits';
import type { AdminModulesListItem } from '@/features/modules/api/adminModulesApi';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
import {
  actorNameFromMetadata,
  formatHierarchyActorName,
} from '@/features/modules/types/hierarchyActor';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

interface DiscardedTabTableProps {
  modules: AdminModulesListItem[];
  isLoading?: boolean;
  onView: (moduleId: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (sortKey: string, sortDir: 'asc' | 'desc') => void;
  queryError?: unknown;
  queryErrorTitle?: string;
  onRetryQuery?: () => void;
}

interface DiscardedTableRow {
  id: string;
  title: string;
  status: string;
  previousStatus: string;
  discardedBy: string;
  discardedAt: string;
  raw: AdminModulesListItem;
}

function formatModuleTitle(item: AdminModulesListItem): string {
  if (!item) return '—';
  if (typeof item.title === 'string') return item.title;
  return item.title?.bn || item.title?.en || 'Untitled Module';
}

function getPreviousStatus(item: AdminModulesListItem): string {
  if (!item) return 'draft';
  const previousStatus = item.search_metadata?.previous_status;
  if (typeof previousStatus === 'string' && previousStatus.trim()) {
    return previousStatus.trim().toLowerCase();
  }
  if (item.published_at) return 'published';
  return 'draft';
}

function getDiscardedBy(item: AdminModulesListItem): string {
  if (!item) return '—';
  return formatHierarchyActorName(
    item.retired_by?.name ??
      actorNameFromMetadata(item.search_metadata, 'discarded_by'),
  );
}

function getDiscardedAt(item: AdminModulesListItem): string {
  if (!item) return '—';
  const dateStr = item.retired_at ?? item.created_at;
  return dateStr ? formatDisplayDateTime(dateStr) : '—';
}

export const DiscardedTabTable = ({
  modules,
  onView,
  sortBy,
  sortDir,
  onSort,
  queryError,
  queryErrorTitle,
  onRetryQuery,
}: DiscardedTabTableProps) => {
  const data = useMemo<DiscardedTableRow[]>(() => {
    return (modules ?? []).map((m) => ({
      id: m.id,
      title: formatModuleTitle(m),
      status: m.lifecycle_status ?? 'retired',
      previousStatus: getPreviousStatus(m),
      discardedBy: getDiscardedBy(m),
      discardedAt: getDiscardedAt(m),
      raw: m,
    }));
  }, [modules]);

  const columns = useMemo<Array<ColumnDef<DiscardedTableRow>>>(
    () => [
      {
        key: 'title',
        header: 'Module',
        sortable: true,
        sortKey: 'title',
        headerClassName: TABLE_TITLE_COLUMN_CLASS,
        className: TABLE_TITLE_COLUMN_CLASS,
        render: (row) => (
          <div className="w-full min-w-0">
            <TruncatedText
              text={row.title}
              maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
              focusable
              className="font-medium text-spice-text-primary"
            />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: false,
        render: (row) => <ModuleStatusBadge status={row.status} />,
      },
      {
        key: 'previousStatus',
        header: 'Previous Status',
        sortable: false,
        render: (row) => <ModuleStatusBadge status={row.previousStatus} />,
      },
      {
        key: 'discardedBy',
        header: 'Discarded By',
        sortable: false,
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.discardedBy}
          </span>
        ),
      },
      {
        key: 'discardedAt',
        header: 'Discarded At',
        sortable: true,
        sortKey: 'updated_at',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.discardedAt}
          </span>
        ),
      },
      {
        key: 'id',
        header: 'Actions',
        sortable: false,
        className: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <Button
            variant="secondary"
            className="h-8 gap-1.5 px-3 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
            onClick={() => onView(row.id)}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            View
          </Button>
        ),
      },
    ],
    [onView],
  );

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(r) => r.id}
      emptyMessage="No discarded modules found."
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      queryError={queryError}
      queryErrorTitle={queryErrorTitle}
      onRetryQuery={onRetryQuery}
    />
  );
};
