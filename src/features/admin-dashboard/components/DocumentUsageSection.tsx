import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookIcon, ChevronIcon, RefreshIcon } from '@/assets/icon';
import { type ColumnDef } from '@/components/common/Table';
import { Button, EmptyState } from '@/components/ui';
import { useFetchDocumentUsageQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { DocumentUsageDetailView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageDetailView';
import { DocumentUsageDocumentsAllView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageDocumentsAllView';
import { DocumentUsageOverview } from '@/features/admin-dashboard/components/document-usage/DocumentUsageOverview';
import { DocumentUsageTopAllView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageTopAllView';
import { useTablePageInput } from '@/features/admin-dashboard/hooks/useTablePageInput';
import type {
  DashboardGeographyFilters,
  DocumentUsageDocumentRow,
} from '@/features/admin-dashboard/types/dashboard.types';
import {
  DEFAULT_PAGE_SIZE,
  buildDocumentUsageQueryArgs,
  filterDocumentsBySearch,
  mapEventRows,
  mapTopDocuments,
  paginationRange,
  uniqueUsersByDocumentId,
  type DocumentUsageListView,
  type DocumentUsageView,
} from '@/features/admin-dashboard/utils/documentUsage';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

interface DocumentUsageSectionProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  userId?: number;
  focusUserName?: string | null;
  onClearFocus?: () => void;
}

type DocumentTableRow = DocumentUsageDocumentRow & { actions: '' };

type DetailSelection = {
  documentId: string;
  documentTitle: string;
};

export const DocumentUsageSection = ({
  fromDate,
  toDate,
  geography,
  userId,
  focusUserName,
  onClearFocus,
}: DocumentUsageSectionProps) => {
  const { t } = useTranslation();
  const [view, setView] = useState<DocumentUsageView>('overview');
  const [detailReturnView, setDetailReturnView] =
    useState<DocumentUsageListView>('overview');
  const [detailDocument, setDetailDocument] = useState<DetailSelection | null>(
    null,
  );
  const [documentsPageSize, setDocumentsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [eventsPageSize, setEventsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [documentSearch, setDocumentSearch] = useState('');
  /** Live totals for page-input validation; updated when query data arrives. */
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);

  const {
    page: documentsPage,
    setPage: setDocumentsPage,
    pageInput: documentsPageInput,
    resetPage: resetDocumentsPage,
    commitPageInput: commitDocumentsPageInput,
    handlePageInputChange: handleDocumentsPageInputChange,
  } = useTablePageInput(documentsTotalPages);

  const {
    page: eventsPage,
    setPage: setEventsPage,
    pageInput: eventsPageInput,
    resetPage: resetEventsPage,
    commitPageInput: commitEventsPageInput,
    handlePageInputChange: handleEventsPageInputChange,
  } = useTablePageInput(eventsTotalPages);

  useEffect(() => {
    resetDocumentsPage();
    resetEventsPage();
    setDocumentSearch('');
    setDetailDocument(null);
    setView('overview');
  }, [
    fromDate,
    toDate,
    geography.district,
    geography.upazila,
    userId,
    resetDocumentsPage,
    resetEventsPage,
  ]);

  useEffect(() => {
    if (view === 'documentsAll') {
      resetDocumentsPage();
    }
    if (view === 'documentDetail') {
      resetEventsPage();
    }
  }, [
    documentSearch,
    view,
    documentsPageSize,
    eventsPageSize,
    resetDocumentsPage,
    resetEventsPage,
  ]);

  const queryArgs = useMemo(
    () =>
      buildDocumentUsageQueryArgs({
        view,
        detailDocumentId: detailDocument?.documentId,
        documentsPage,
        documentsPageSize,
        eventsPage,
        eventsPageSize,
      }),
    [
      view,
      detailDocument?.documentId,
      documentsPage,
      documentsPageSize,
      eventsPage,
      eventsPageSize,
    ],
  );

  const query = useFetchDocumentUsageQuery(
    {
      from: fromDate,
      to: toDate,
      district: geography.district || undefined,
      upazila_id: geography.upazila || undefined,
      user_id: userId,
      ...queryArgs,
    },
    { skip: view === 'documentDetail' && !detailDocument },
  );
  const { data, refetch, isFetching } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const totalDocumentRows = data?.total_document_rows ?? 0;
  const totalDocumentPages = Math.max(
    1,
    Math.ceil(totalDocumentRows / documentsPageSize),
  );
  const totalEvents = data?.total_events ?? 0;
  const totalEventPages = Math.max(1, Math.ceil(totalEvents / eventsPageSize));

  useEffect(() => {
    setDocumentsTotalPages(totalDocumentPages);
  }, [totalDocumentPages]);

  useEffect(() => {
    setEventsTotalPages(totalEventPages);
  }, [totalEventPages]);

  const topDocuments = useMemo(() => {
    const uniqueUsers = uniqueUsersByDocumentId(data?.documents ?? []);
    return mapTopDocuments(data?.top_documents ?? [], uniqueUsers);
  }, [data?.documents, data?.top_documents]);

  const documentRows: DocumentTableRow[] = useMemo(() => {
    const rows = data?.documents ?? [];
    const filtered =
      view === 'documentsAll'
        ? filterDocumentsBySearch(rows, documentSearch)
        : rows;
    return filtered.map((row) => ({ ...row, actions: '' as const }));
  }, [data?.documents, documentSearch, view]);

  const eventRows = useMemo(
    () => mapEventRows(data?.events ?? []),
    [data?.events],
  );

  const detailSummary = data?.documents?.[0] ?? null;

  const documentsRange = paginationRange(
    documentsPage,
    documentsPageSize,
    documentRows.length,
  );
  const eventsRange = paginationRange(
    eventsPage,
    eventsPageSize,
    eventRows.length,
  );

  const openDocumentDetail = useCallback(
    (row: DocumentUsageDocumentRow, returnView: DocumentUsageListView) => {
      setDetailReturnView(returnView);
      setDetailDocument({
        documentId: row.document_id,
        documentTitle: row.document_title ?? row.document_id,
      });
      resetEventsPage();
      setView('documentDetail');
    },
    [resetEventsPage],
  );

  const leaveDetail = useCallback(() => {
    setDetailDocument(null);
    setView(detailReturnView);
  }, [detailReturnView]);

  const documentColumns: Array<ColumnDef<DocumentTableRow>> = useMemo(
    () => [
      {
        key: 'document_title',
        header: t('adminDashboard.documentUsage.columns.title'),
        render: (row) => (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-spice-bg-tint text-spice-text-muted">
              <BookIcon className="h-3.5 w-3.5" />
            </span>
            <span className="max-w-[16rem] truncate font-medium text-spice-text-primary">
              {row.document_title ?? row.document_id}
            </span>
          </span>
        ),
      },
      {
        key: 'total_views',
        header: t('adminDashboard.documentUsage.columns.views'),
        className: 'tabular-nums',
      },
      {
        key: 'unique_users',
        header: t('adminDashboard.documentUsage.columns.users'),
        className: 'tabular-nums',
      },
      {
        key: 'last_viewed_at',
        header: t('adminDashboard.documentUsage.columns.lastViewed'),
        render: (row) => formatDisplayDateTime(row.last_viewed_at),
      },
      {
        key: 'last_viewed_by_user_name',
        header: t('adminDashboard.documentUsage.columns.lastViewedBy'),
        render: (row) => row.last_viewed_by_user_name ?? '—',
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'w-10',
        className: 'w-10',
        render: (row) => (
          <Button
            variant="secondary"
            className="h-8 w-8 px-0"
            aria-label={t('adminDashboard.documentUsage.openDetail', {
              title: row.document_title ?? row.document_id,
            })}
            onClick={() =>
              openDocumentDetail(
                row,
                view === 'documentsAll' ? 'documentsAll' : 'overview',
              )
            }
          >
            <ChevronIcon className="h-4 w-4 -rotate-90" />
          </Button>
        ),
      },
    ],
    [openDocumentDetail, t, view],
  );

  const shellTitle =
    view === 'topAll'
      ? t('adminDashboard.documentUsage.topAllTitle')
      : view === 'documentsAll'
        ? t('adminDashboard.documentUsage.tableTitle')
        : view === 'documentDetail'
          ? (detailDocument?.documentTitle ??
            t('adminDashboard.documentUsage.detailTitle'))
          : t('adminDashboard.documentUsage.title');

  const shellDescription =
    view === 'topAll'
      ? t('adminDashboard.documentUsage.topAllDescription')
      : view === 'documentsAll'
        ? t('adminDashboard.documentUsage.documentsAllDescription')
        : view === 'documentDetail'
          ? t('adminDashboard.documentUsage.detailDescription')
          : t('adminDashboard.documentUsage.description');

  const backLabel =
    view === 'documentDetail'
      ? detailReturnView === 'documentsAll'
        ? t('adminDashboard.documentUsage.backToDocuments')
        : t('adminDashboard.documentUsage.backToOverview')
      : t('adminDashboard.documentUsage.backToOverview');

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {view !== 'overview' ? (
        <Button
          variant="secondary"
          className="h-9 text-xs"
          onClick={() => {
            if (view === 'documentDetail') {
              leaveDetail();
              return;
            }
            setView('overview');
          }}
        >
          {backLabel}
        </Button>
      ) : null}
      {focusUserName && onClearFocus ? (
        <Button
          variant="secondary"
          className="h-9 text-xs"
          onClick={onClearFocus}
        >
          {t('adminDashboard.documentUsage.clearFocus', {
            name: focusUserName,
          })}
        </Button>
      ) : null}
      <Button
        variant="secondary"
        className="h-9 w-9 shrink-0 px-0"
        onClick={() => void refetch()}
        aria-label={t('common.refresh')}
        title={t('common.refresh')}
        disabled={isFetching}
      >
        <RefreshIcon className={cn('h-4 w-4', isFetching && 'animate-spin')} />
      </Button>
    </div>
  );

  return (
    <DashboardWidgetShell
      title={shellTitle}
      description={shellDescription}
      size="xl"
      flush
      actions={headerActions}
    >
      <div className="space-y-4 px-4 pb-4">
        {showLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-md bg-spice-bg-tint"
                  aria-hidden
                />
              ))}
            </div>
            <DashboardListSkeleton rows={8} />
          </div>
        ) : showError ? (
          <DashboardWidgetErrorState onRetry={() => void refetch()} />
        ) : !data ? (
          <EmptyState
            title={t('adminDashboard.documentUsage.emptyTitle')}
            description={t('adminDashboard.documentUsage.emptyDescription')}
          />
        ) : view === 'overview' ? (
          <DocumentUsageOverview
            totalViews={data.total_views}
            uniqueDocuments={data.unique_documents}
            uniqueUsers={data.unique_users}
            totalDocumentRows={totalDocumentRows}
            topDocuments={topDocuments}
            documentRows={documentRows}
            documentColumns={documentColumns}
            onViewAllTop={() => setView('topAll')}
            onViewAllDocuments={() => setView('documentsAll')}
          />
        ) : view === 'topAll' ? (
          <DocumentUsageTopAllView topDocuments={topDocuments} />
        ) : view === 'documentsAll' ? (
          <DocumentUsageDocumentsAllView
            documentSearch={documentSearch}
            onDocumentSearchChange={setDocumentSearch}
            documentRows={documentRows}
            documentColumns={documentColumns}
            page={documentsPage}
            pageSize={documentsPageSize}
            pageInput={documentsPageInput}
            totalItems={totalDocumentRows}
            totalPages={totalDocumentPages}
            rangeStart={documentsRange.start}
            rangeEnd={documentsRange.end}
            onPageSizeChange={(next) => {
              setDocumentsPageSize(next);
              resetDocumentsPage();
            }}
            onPageInputChange={handleDocumentsPageInputChange}
            onCommitPageInput={commitDocumentsPageInput}
            onPrevPage={() =>
              setDocumentsPage((current) => Math.max(0, current - 1))
            }
            onNextPage={() => setDocumentsPage((current) => current + 1)}
          />
        ) : (
          <DocumentUsageDetailView
            totalViews={detailSummary?.total_views ?? data.total_views}
            uniqueUsers={detailSummary?.unique_users ?? data.unique_users}
            lastViewedAt={detailSummary?.last_viewed_at ?? null}
            eventRows={eventRows}
            page={eventsPage}
            pageSize={eventsPageSize}
            pageInput={eventsPageInput}
            totalItems={totalEvents}
            totalPages={totalEventPages}
            rangeStart={eventsRange.start}
            rangeEnd={eventsRange.end}
            onPageSizeChange={(next) => {
              setEventsPageSize(next);
              resetEventsPage();
            }}
            onPageInputChange={handleEventsPageInputChange}
            onCommitPageInput={commitEventsPageInput}
            onPrevPage={() =>
              setEventsPage((current) => Math.max(0, current - 1))
            }
            onNextPage={() => setEventsPage((current) => current + 1)}
          />
        )}
      </div>
    </DashboardWidgetShell>
  );
};
