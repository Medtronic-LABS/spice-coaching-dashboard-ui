import { skipToken } from '@reduxjs/toolkit/query/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookIcon, ChevronIcon } from '@/assets/icon';
import { type ColumnDef } from '@/components/common/Table';
import {
  Button,
  Card,
  EmptyState,
  Modal,
  TruncatedText,
} from '@/components/ui';
import { useFetchDocumentUsageQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { DocumentUsageDetailView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageDetailView';
import { DocumentUsageDocumentsAllView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageDocumentsAllView';
import { DocumentUsageOverview } from '@/features/admin-dashboard/components/document-usage/DocumentUsageOverview';
import { useTablePageInput } from '@/hooks/useTablePageInput';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type {
  DashboardGeographyFilters,
  DocumentUsageDocumentRow,
} from '@/features/admin-dashboard/types/dashboard.types';
import { buildDocumentUsageDateGeoArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import {
  DEFAULT_PAGE_SIZE,
  buildDocumentUsageQueryArgs,
  mapEventRows,
  paginationRange,
  type DocumentUsageListView,
} from '@/features/admin-dashboard/utils/documentUsage';
import { DOC_TABLE_CELL } from '@/features/admin-dashboard/utils/documentUsageTableLayout';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import {
  formatDisplayDateTime,
  DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
} from '@/utils/formatDisplayDateTime';

interface DocumentUsageSectionProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
}

type DocumentTableRow = DocumentUsageDocumentRow & { actions: '' };

type DetailSelection = {
  documentId: string;
  documentTitle: string;
};

const DOCUMENT_DETAIL_TITLE_ID = 'document-usage-detail-title';
const DOCUMENT_USAGE_SEARCH_DEBOUNCE_MS = 300;

export const DocumentUsageSection = ({
  fromDate,
  toDate,
  geography,
}: DocumentUsageSectionProps) => {
  const { t } = useTranslation();
  const [view, setView] = useState<DocumentUsageListView>('overview');
  const [detailDocument, setDetailDocument] = useState<DetailSelection | null>(
    null,
  );
  const [documentsPageSize, setDocumentsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [eventsPageSize, setEventsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [documentSearch, setDocumentSearch] = useState('');
  const debouncedDocumentSearch = useDebouncedValue(
    documentSearch,
    DOCUMENT_USAGE_SEARCH_DEBOUNCE_MS,
  );
  const documentTitleQuery = debouncedDocumentSearch.trim();
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
    geography.divisionId,
    geography.districtId,
    geography.upazilaId,
    resetDocumentsPage,
    resetEventsPage,
  ]);

  useEffect(() => {
    if (view === 'documentsAll') {
      resetDocumentsPage();
    }
  }, [documentTitleQuery, view, documentsPageSize, resetDocumentsPage]);

  const detailDocumentId = detailDocument?.documentId ?? null;

  useEffect(() => {
    if (detailDocumentId) {
      resetEventsPage();
    }
  }, [detailDocumentId, eventsPageSize, resetEventsPage]);

  const dateGeoArgs = useMemo(
    () => buildDocumentUsageDateGeoArgs(fromDate, toDate, geography),
    [fromDate, toDate, geography],
  );

  const listQueryArgs = useMemo(
    () =>
      buildDocumentUsageQueryArgs({
        view,
        documentsPage,
        documentsPageSize,
        eventsPage: 0,
        eventsPageSize: 1,
        q: view === 'documentsAll' ? documentTitleQuery : undefined,
      }),
    [view, documentsPage, documentsPageSize, documentTitleQuery],
  );

  const query = useFetchDocumentUsageQuery({
    ...dateGeoArgs,
    ...listQueryArgs,
  });
  const { refetch } = query;
  const data = query.currentData;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const detailQueryArgs = useMemo(
    () =>
      detailDocument
        ? buildDocumentUsageQueryArgs({
            view: 'documentDetail',
            detailDocumentId: detailDocument.documentId,
            documentsPage: 0,
            documentsPageSize: 1,
            eventsPage,
            eventsPageSize,
          })
        : null,
    [detailDocument, eventsPage, eventsPageSize],
  );

  const detailQuery = useFetchDocumentUsageQuery(
    detailDocument && detailQueryArgs
      ? { ...dateGeoArgs, ...detailQueryArgs }
      : skipToken,
  );
  // Prefer currentData so switching rows does not flash the previous document
  // (hook `data` can fall back to the last args while the new request loads).
  const detailData = detailQuery.currentData;
  const detailMatchesSelection =
    detailData != null &&
    detailDocument != null &&
    (detailData.documents[0]?.document_id === detailDocument.documentId ||
      (detailData.documents.length === 0 &&
        detailData.events.length > 0 &&
        detailData.events.every(
          (event) => event.document_id === detailDocument.documentId,
        )) ||
      (detailData.documents.length === 0 &&
        detailData.events.length === 0 &&
        !detailQuery.isFetching));
  const showDetailLoading =
    detailDocument != null &&
    !detailMatchesSelection &&
    (detailQuery.isLoading || detailQuery.isFetching || !detailQuery.isError);
  const showDetailError =
    detailDocument != null &&
    !detailMatchesSelection &&
    detailQuery.isError &&
    !detailQuery.isFetching;

  const totalDocumentRows = data?.total_document_rows ?? 0;
  const totalDocumentPages = Math.max(
    1,
    Math.ceil(totalDocumentRows / documentsPageSize),
  );
  const totalEvents = detailData?.total_events ?? 0;
  const totalEventPages = Math.max(1, Math.ceil(totalEvents / eventsPageSize));

  useEffect(() => {
    setDocumentsTotalPages(totalDocumentPages);
  }, [totalDocumentPages]);

  useEffect(() => {
    setEventsTotalPages(totalEventPages);
  }, [totalEventPages]);

  const documentRows: DocumentTableRow[] = useMemo(() => {
    const rows = data?.documents ?? [];
    return rows.map((row) => ({ ...row, actions: '' as const }));
  }, [data?.documents]);

  const eventRows = useMemo(
    () => mapEventRows(detailData?.events ?? []),
    [detailData?.events],
  );

  const detailSummary = detailData?.documents?.[0] ?? null;

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

  const openDocumentDetail = useCallback((row: DocumentUsageDocumentRow) => {
    setView('overview');
    setDetailDocument({
      documentId: row.document_id,
      documentTitle: row.document_title ?? row.document_id,
    });
  }, []);

  const leaveDetail = useCallback(() => {
    setDetailDocument(null);
    setView('overview');
  }, []);

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
        colClassName: 'w-[13.5rem]',
        headerClassName: `${DISPLAY_DATETIME_TABLE_COLUMN_CLASS} ${DOC_TABLE_CELL.compact}`,
        className: `${DISPLAY_DATETIME_TABLE_COLUMN_CLASS} ${DOC_TABLE_CELL.compact}`,
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
            onClick={() => openDocumentDetail(row)}
          >
            <ChevronIcon className="h-4 w-4 -rotate-90" />
          </Button>
        ),
      },
    ],
    [openDocumentDetail, t],
  );

  const shellTitle =
    view === 'documentsAll'
      ? t('adminDashboard.documentUsage.tableTitle')
      : t('adminDashboard.documentUsage.title');

  const shellDescription =
    view === 'documentsAll'
      ? t('adminDashboard.documentUsage.documentsAllDescription')
      : t('adminDashboard.documentUsage.description');

  const headerActions =
    view !== 'overview' ? (
      <Button
        variant="secondary"
        className="h-9 text-xs"
        onClick={() => setView('overview')}
      >
        {t('adminDashboard.documentUsage.backToOverview')}
      </Button>
    ) : null;

  return (
    <>
      <DashboardWidgetShell
        title={shellTitle}
        description={shellDescription}
        size="xxl"
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
              documentRows={documentRows}
              documentColumns={documentColumns}
              onViewAllDocuments={() => setView('documentsAll')}
            />
          ) : (
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
          )}
        </div>
      </DashboardWidgetShell>

      <Modal
        open={detailDocument != null}
        onClose={leaveDetail}
        labelledBy={DOCUMENT_DETAIL_TITLE_ID}
        contentClassName="max-w-4xl"
      >
        <Card
          variant="elevated"
          className="flex max-h-[min(85dvh,calc(100vh-3rem))] w-full flex-col overflow-hidden border-spice-border p-4 shadow-lg sm:p-6"
        >
          <h2
            id={DOCUMENT_DETAIL_TITLE_ID}
            className="min-w-0 shrink-0 pr-10 text-lg font-semibold text-spice-text-primary"
          >
            {detailDocument?.documentTitle ??
              t('adminDashboard.documentUsage.detailTitle')}
          </h2>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {showDetailLoading ? (
              <DashboardListSkeleton rows={6} />
            ) : showDetailError ? (
              <DashboardWidgetErrorState
                onRetry={() => void detailQuery.refetch()}
              />
            ) : (
              <DocumentUsageDetailView
                totalViews={
                  detailSummary?.total_views ?? detailData?.total_views ?? 0
                }
                uniqueUsers={
                  detailSummary?.unique_users ?? detailData?.unique_users ?? 0
                }
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
        </Card>
      </Modal>
    </>
  );
};
