import { Table, type ColumnDef } from '@/components/common/Table';
import { Button } from '@/components/ui';
import type { AdminModulesListItem } from '@/features/modules/api/adminModulesApi';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { useMemo } from 'react';

interface DiscardedTabTableProps {
  modules: AdminModulesListItem[];
  isLoading?: boolean;
  onView: (moduleId: string) => void;
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
  if (!item) return 'Draft';
  const metadata = item.search_metadata as Record<string, unknown> | null;
  if (
    metadata &&
    typeof metadata.previous_status === 'string' &&
    metadata.previous_status.trim()
  ) {
    const raw = metadata.previous_status.trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (item.published_at) return 'Published';
  return 'Draft';
}

function getDiscardedBy(item: AdminModulesListItem): string {
  if (!item) return '—';
  const metadata = item.search_metadata as Record<string, unknown> | null;
  if (
    metadata &&
    typeof metadata.discarded_by === 'string' &&
    metadata.discarded_by.trim()
  ) {
    return metadata.discarded_by.trim();
  }
  if (
    metadata &&
    typeof metadata.created_by === 'string' &&
    metadata.created_by.trim()
  ) {
    return metadata.created_by.trim();
  }
  return '—';
}

function getDiscardedAt(item: AdminModulesListItem): string {
  if (!item) return '—';
  const dateStr = item.last_deactivated_at ?? item.created_at;
  return dateStr ? formatDisplayDateTime(dateStr) : '—';
}

export const DiscardedTabTable = ({
  modules,
  // isLoading,
  onView,
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
        render: (row) => (
          <span className="font-medium text-spice-text-primary">
            {row.title}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <ModuleStatusBadge status={row.status} />,
      },
      {
        key: 'previousStatus',
        header: 'Previous Status',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.previousStatus}
          </span>
        ),
      },
      {
        key: 'discardedBy',
        header: 'Discarded By',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.discardedBy}
          </span>
        ),
      },
      {
        key: 'discardedAt',
        header: 'Discarded At',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.discardedAt}
          </span>
        ),
      },
      {
        key: 'id',
        header: 'Actions',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
            onClick={() => onView(row.id)}
          >
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
    />
  );
};
