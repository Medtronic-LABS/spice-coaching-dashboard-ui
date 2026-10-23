import type { ColumnDef } from '@/components/common/Table/Table.types';
import type { ModuleLibraryItem } from '@/features/modules/types/moduleLibrary.types';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
import {
  moduleListingActorColumnHeader,
  moduleListingDateColumnHeader,
  type ModuleListingActorColumn,
  type ModuleListingDateColumn,
} from '@/features/modules/utils/moduleListFilters';
import { DISPLAY_DATETIME_TABLE_COLUMN_CLASS } from '@/utils/formatDisplayDateTime';

export function listingDateColumnDef(
  column: ModuleListingDateColumn,
): ColumnDef<ModuleLibraryItem> {
  const key =
    column === 'published'
      ? 'publishedAt'
      : column === 'updated'
        ? 'lastUpdatedAt'
        : column === 'activated'
          ? 'activatedAt'
          : column === 'deactivated'
            ? 'deactivatedAt'
            : 'createdAt';
  const sortKey =
    column === 'published'
      ? 'published_at'
      : column === 'updated'
        ? 'updated_at'
        : column === 'activated'
          ? 'activated_at'
          : column === 'deactivated'
            ? 'deactivated_at'
            : 'created_at';
  return {
    key,
    header: moduleListingDateColumnHeader(column),
    sortable: true,
    sortKey,
    className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
    headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
    render: (row) =>
      column === 'published'
        ? (row.publishedAt ?? '—')
        : column === 'updated'
          ? (row.lastUpdatedAt ?? '—')
          : column === 'activated'
            ? (row.activatedAt ?? '—')
            : column === 'deactivated'
              ? (row.deactivatedAt ?? '—')
              : row.createdAt,
  };
}

export function listingActorColumnDef(
  column: ModuleListingActorColumn,
): ColumnDef<ModuleLibraryItem> {
  return {
    key: column,
    header: moduleListingActorColumnHeader(column),
    sortable: false,
    className: 'whitespace-nowrap',
    headerClassName: 'whitespace-nowrap',
    render: (row) => {
      const value =
        column === 'publishedBy'
          ? row.publishedBy
          : column === 'activatedBy'
            ? row.activatedBy
            : column === 'deactivatedBy'
              ? row.deactivatedBy
              : row.generatedBy;
      return formatHierarchyActorName(value);
    },
  };
}
