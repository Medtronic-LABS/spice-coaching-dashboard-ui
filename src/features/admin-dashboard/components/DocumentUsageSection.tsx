import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookIcon, ChevronIcon } from '@/assets/icon';
import { type ColumnDef } from '@/components/common/Table';
import { Button, EmptyState, TruncatedText } from '@/components/ui';
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
import { buildDocumentUsageDateGeoArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
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
import { DOC_TABLE_CELL } from '@/features/admin-dashboard/utils/documentUsageTableLayout';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

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
    geography.division,
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
      ...buildDocumentUsageDateGeoArgs(fromDate, toDate, geography),
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
        colClassName: 'w-[9.5rem]',
        headerClassName: `max-w-[9.5rem] ${DOC_TABLE_CELL.compact}`,
        className: `max-w-[9.5rem] ${DOC_TABLE_CELL.truncate} ${DOC_TABLE_CELL.compact}`,
        render: (row) => {
          const title = row.document_title ?? row.document_id;
          return (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-spice-bg-tint text-spice-text-muted">
                <BookIcon className="h-3 w-3" />
              </span>
              <TruncatedText
                text={title}
                className="min-w-0 font-medium text-spice-text-primary"
              />
            </span>
          );
        },
      },
      {
        key: 'total_views',
        header: t('adminDashboard.documentUsage.columns.views'),
        colClassName: 'w-14',
        headerClassName: `w-14 text-right ${DOC_TABLE_CELL.compact}`,
        className: `w-14 text-right tabular-nums ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
      },
      {
        key: 'unique_users',
        header: t('adminDashboard.documentUsage.columns.users'),
        colClassName: 'w-14',
        headerClassName: `w-14 text-right ${DOC_TABLE_CELL.compact}`,
        className: `w-14 text-right tabular-nums ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
      },
      {
        key: 'last_viewed_at',
        header: t('adminDashboard.documentUsage.columns.lastViewed'),
        colClassName: 'w-[7.25rem]',
        headerClassName: `w-[7.25rem] ${DOC_TABLE_CELL.compact}`,
        className: `w-[7.25rem] ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
        render: (row) => formatDisplayDateTime(row.last_viewed_at),
      },
      {
        key: 'last_viewed_by_user_name',
        header: t('adminDashboard.documentUsage.columns.lastViewedBy'),
        colClassName: 'w-[6.5rem]',
        headerClassName: `max-w-[6.5rem] ${DOC_TABLE_CELL.compact}`,
        className: `max-w-[6.5rem] ${DOC_TABLE_CELL.truncate} ${DOC_TABLE_CELL.compact}`,
        render: (row) => {
          const name = row.last_viewed_by_user_name;
          if (!name) return '—';
          return <TruncatedText text={name} className="min-w-0" />;
        },
      },
      {
        key: 'actions',
        header: '',
        colClassName: 'w-10',
        headerClassName: `w-10 ${DOC_TABLE_CELL.compact}`,
        className: `w-10 ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
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
    <>
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
    </>
  );

  return (
    <DashboardWidgetShell
      title={shellTitle}
      description={shellDescription}
      size="xl"
      flush
      actions={headerActions}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
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
