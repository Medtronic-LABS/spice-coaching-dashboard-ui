import { useTranslation } from 'react-i18next';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import { SearchInput } from '@/components/ui';
import type { DocumentUsageDocumentRow } from '@/features/admin-dashboard/types/dashboard.types';
import { PAGE_SIZE_OPTIONS } from '@/features/admin-dashboard/utils/documentUsage';
import { DOCUMENT_USAGE_TABLE_PROPS } from '@/features/admin-dashboard/utils/documentUsageTableLayout';

type DocumentTableRow = DocumentUsageDocumentRow & { actions: '' };

interface DocumentUsageDocumentsAllViewProps {
  documentSearch: string;
  onDocumentSearchChange: (value: string) => void;
  documentRows: DocumentTableRow[];
  documentColumns: Array<ColumnDef<DocumentTableRow>>;
  page: number;
  pageSize: number;
  pageInput: string;
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  onPageSizeChange: (next: number) => void;
  onPageInputChange: (raw: string) => void;
  onCommitPageInput: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const DocumentUsageDocumentsAllView = ({
  documentSearch,
  onDocumentSearchChange,
  documentRows,
  documentColumns,
  page,
  pageSize,
  pageInput,
  totalItems,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageSizeChange,
  onPageInputChange,
  onCommitPageInput,
  onPrevPage,
  onNextPage,
}: DocumentUsageDocumentsAllViewProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="w-full max-w-sm">
          <SearchInput
            value={documentSearch}
            onChange={onDocumentSearchChange}
            placeholder={t('adminDashboard.documentUsage.searchPlaceholder')}
          />
        </div>
      </div>
      <Table<DocumentTableRow>
        data={documentRows}
        columns={documentColumns}
        {...DOCUMENT_USAGE_TABLE_PROPS}
        keyExtractor={(row) => row.document_id}
        caption={t('adminDashboard.documentUsage.tableTitle')}
        emptyMessage={t('common.noData')}
        getRowClassName={() => 'hover:bg-spice-brand-primary/5'}
      />
      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalItems={totalItems}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageInput={pageInput}
        hasPrevPage={page > 0}
        hasNextPage={page + 1 < totalPages}
        onPageSizeChange={onPageSizeChange}
        onPageInputChange={onPageInputChange}
        onCommitPageInput={onCommitPageInput}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        rowsPerPageAriaLabel={t('adminDashboard.documentUsage.rowsPerPage')}
        pageNumberAriaLabel={t('adminDashboard.documentUsage.pageNumber')}
        className="border-t border-spice-border px-0 pt-3"
      />
      <p className="text-xs text-spice-text-muted">
        {t('adminDashboard.documentUsage.documentsAllFooter')}
      </p>
    </div>
  );
};
