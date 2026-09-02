import { useEffect, useMemo, useState } from 'react';
import { ChevronIcon, EyeIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  QuotedDisplayLabel,
  Tooltip,
  TruncatedText,
} from '@/components/ui';
import {
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
} from '@/constants/fieldLimits';
import { IngestMatchedModulePreviewModal } from '@/features/ingest/components/IngestMatchedModulePreviewModal';
import { formatEstimatedMinutesDisplay } from '@/features/ingest/utils/formatEstimatedMinutesDisplay';
import {
  useGetModuleDetailQuery,
  type AdminModuleDetailResponse,
  type AdminModulesListItem,
} from '@/features/modules/api/adminModulesApi';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
import {
  actorNameFromMetadata,
  formatHierarchyActorName,
} from '@/features/modules/types/hierarchyActor';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { truncateDisplayText } from '@/utils/truncateDisplayText';

interface NeedsReviewTabProps {
  modules: AdminModulesListItem[];
  isLoading?: boolean;
  error?: unknown;
  onMerge: (moduleId: string) => Promise<void>;
  onDiscardNew: (moduleId: string) => Promise<void>;
  /** Wired when the keep-new API is available. */
  onKeepNew?: (moduleId: string) => Promise<void>;
  onView?: (moduleId: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (sortKey: string, sortDir: 'asc' | 'desc') => void;
  initialExpandedId?: string | null;
  emptyMessage?: string;
}

type NeedsReviewTableRow = {
  id: string;
  expand: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  createdBy: string;
  actions: string;
  raw: AdminModulesListItem;
  existingModule: AdminModulesListItem | AdminModuleDetailResponse | null;
  existingModuleId: string | null | undefined;
  mergeSecondaryModuleId: string | null;
};

export const NEEDS_REVIEW_TOOLTIP_CONTENT = (
  <div className="max-w-sm space-y-3.5 p-3.5 text-xs">
    <div className="border-b border-spice-border/60 pb-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-semantic-infoBg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-semantic-info">
          Keep New
        </span>
      </div>
      <p className="pl-3 text-[11px] leading-relaxed text-spice-text-medium">
        Moves the new module to{' '}
        <strong className="text-spice-text-primary">Drafts</strong> with no
        impact on the existing module. The merge preview is discarded.
      </p>
    </div>
    <div className="border-b border-spice-border/60 pb-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-text-muted ring-1 ring-spice-border/50">
          Discard New
        </span>
      </div>
      <p className="pl-3 text-[11px] leading-relaxed text-spice-text-medium">
        Discards the new module and merge preview. The existing module remains
        unchanged.
      </p>
    </div>
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-semantic-warningBg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-semantic-warning">
          Merge
        </span>
      </div>
      <p className="pl-3 text-[11px] leading-relaxed text-spice-text-medium">
        Moves the merged module to{' '}
        <strong className="text-spice-text-primary">Drafts</strong> and discards
        the existing and new modules. All assignments, learner progress, quiz
        attempts, telemetry, and analytics linked to the existing module are
        permanently removed.
      </p>
    </div>
  </div>
);

function formatModuleTitle(
  item: AdminModulesListItem | AdminModuleDetailResponse | null | undefined,
): string {
  if (!item) return '—';
  if (typeof item.title === 'string') return item.title;
  return item.title?.bn || item.title?.en || 'Untitled Module';
}

function getSearchMetadata(
  item: AdminModulesListItem | AdminModuleDetailResponse,
): Record<string, unknown> | null | undefined {
  return 'search_metadata' in item ? item.search_metadata : null;
}

function getCreatedBy(
  item: AdminModulesListItem | AdminModuleDetailResponse | null | undefined,
): string {
  if (!item) return '—';
  const metadata = getSearchMetadata(item);
  return formatHierarchyActorName(
    item.created_by?.name ??
      actorNameFromMetadata(metadata, 'created_by') ??
      actorNameFromMetadata(metadata, 'author'),
  );
}

function getPublishedBy(
  item: AdminModulesListItem | AdminModuleDetailResponse | null | undefined,
): string {
  if (!item) return '—';
  const publishedName =
    item.published_by?.name ??
    actorNameFromMetadata(getSearchMetadata(item), 'published_by');
  if (publishedName?.trim()) {
    return formatHierarchyActorName(publishedName);
  }
  return getCreatedBy(item);
}

function resolveExistingModule(primary: AdminModulesListItem): {
  existingModule: AdminModulesListItem | AdminModuleDetailResponse | null;
  existingModuleId: string | null | undefined;
} {
  const existingModule =
    primary.merge_source_module &&
    typeof primary.merge_source_module === 'object'
      ? (primary.merge_source_module as
          | AdminModulesListItem
          | AdminModuleDetailResponse)
      : null;

  const metadata = primary.search_metadata;
  const metadataModuleId =
    metadata && typeof metadata === 'object'
      ? (
          [
            'matched_module_id',
            'existing_module_id',
            'merge_source_module_id',
          ] as const
        )
          .map((key) => metadata[key])
          .find(
            (value): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
      : undefined;

  const existingModuleId =
    primary.merge_source_module_id ||
    (typeof primary.merge_source_module === 'string'
      ? primary.merge_source_module
      : null) ||
    metadataModuleId ||
    existingModule?.id;

  return { existingModule, existingModuleId };
}

function resolveMergeSecondaryModuleId(
  primary: AdminModulesListItem,
  existingModuleId: string | null | undefined,
): string | null {
  const metadataId = getSearchMetadata(primary)?.merge_secondary_module_id;
  const fromMetadata =
    typeof metadataId === 'string' && metadataId.trim()
      ? metadataId.trim()
      : null;
  const candidate = primary.merge_secondary_module_id?.trim() || fromMetadata;
  if (!candidate) return null;
  if (candidate === primary.id) return null;
  if (existingModuleId && candidate === existingModuleId) return null;
  return candidate;
}

function getQuizCount(
  target: AdminModulesListItem | AdminModuleDetailResponse,
): number {
  if ('quiz_count' in target && typeof target.quiz_count === 'number') {
    return target.quiz_count;
  }
  if ('quiz' in target && Array.isArray(target.quiz)) {
    return target.quiz.length;
  }
  return 0;
}

type ComparisonBadgeVariant = 'warning' | 'info' | 'success';

function comparisonPanelTone(variant: ComparisonBadgeVariant): {
  borderLeftColor: string;
  badgeStyle: string;
} {
  switch (variant) {
    case 'warning':
      return {
        borderLeftColor: 'border-l-spice-semantic-warning',
        badgeStyle:
          'bg-spice-semantic-warningBg text-spice-semantic-warning border-spice-semantic-warning/20',
      };
    case 'info':
      return {
        borderLeftColor: 'border-l-spice-semantic-info',
        badgeStyle:
          'bg-spice-semantic-infoBg text-spice-semantic-info border-spice-semantic-info/20',
      };
    case 'success':
      return {
        borderLeftColor: 'border-l-spice-semantic-success',
        badgeStyle:
          'bg-spice-semantic-successBg text-spice-semantic-success border-spice-semantic-success/20',
      };
    default: {
      const exhaustiveCheck: never = variant;
      return exhaustiveCheck;
    }
  }
}

function ModuleCardPanel({
  headerLabel,
  headerInfo,
  badgeText,
  badgeVariant = 'warning',
  children,
}: {
  headerLabel: string;
  headerInfo: { label: string; content: string };
  badgeText?: string;
  badgeVariant?: ComparisonBadgeVariant;
  children: React.ReactNode;
}) {
  const { borderLeftColor, badgeStyle } = comparisonPanelTone(badgeVariant);

  return (
    <div
      className={`min-w-0 max-w-full rounded-xl border border-spice-border border-l-4 ${borderLeftColor} bg-spice-bg-surface overflow-hidden shadow-sm`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-spice-border bg-spice-bg-tint/40 px-3 py-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-spice-text-muted">
          <span className="truncate">{headerLabel}</span>
          <Tooltip
            label={headerInfo.label}
            content={headerInfo.content}
            placement="bottom"
          />
        </span>
        {badgeText ? (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${badgeStyle}`}
          >
            {badgeText}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 px-3 py-3">{children}</div>
    </div>
  );
}

function ComparisonModulePanel({
  headerLabel,
  headerInfo,
  badgeVariant,
  module,
  moduleId,
  onView,
  isOpen,
  emptyMessage,
  loadingMessage,
  fallbackStatus,
}: {
  headerLabel: string;
  headerInfo: { label: string; content: string };
  badgeVariant: ComparisonBadgeVariant;
  module?: AdminModulesListItem | AdminModuleDetailResponse | null;
  moduleId?: string | null;
  onView: (moduleId: string) => void;
  isOpen: boolean;
  emptyMessage: string;
  loadingMessage: string;
  fallbackStatus?: string;
}) {
  const { data: fetchedModule, isLoading } = useGetModuleDetailQuery(
    moduleId ?? '',
    { skip: !isOpen || Boolean(module) || !moduleId },
  );

  const target = module ?? fetchedModule;

  if (isLoading && !target) {
    return (
      <ModuleCardPanel
        headerLabel={headerLabel}
        headerInfo={headerInfo}
        badgeVariant={badgeVariant}
      >
        <div className="flex h-32 items-center justify-center text-xs text-spice-text-muted animate-pulse">
          {loadingMessage}
        </div>
      </ModuleCardPanel>
    );
  }

  if (!target) {
    return (
      <ModuleCardPanel
        headerLabel={headerLabel}
        headerInfo={headerInfo}
        badgeVariant={badgeVariant}
      >
        <div className="flex h-32 items-center justify-center text-center text-xs text-spice-text-muted">
          {emptyMessage}
        </div>
      </ModuleCardPanel>
    );
  }

  const targetStatus = target.lifecycle_status || fallbackStatus;
  const isPublished = targetStatus?.toLowerCase() === 'published';

  return (
    <ModuleCardPanel
      headerLabel={headerLabel}
      headerInfo={headerInfo}
      badgeVariant={badgeVariant}
    >
      <div className="mb-1 flex items-start justify-between gap-2 border-b border-spice-border/30 pb-2">
        <div className="min-w-0 flex-1 py-0.5">
          <h4 className="truncate text-sm font-semibold leading-snug text-spice-text-primary">
            {formatModuleTitle(target)}
          </h4>
          {target.category ? (
            <span className="mt-1 inline-block max-w-full truncate rounded bg-spice-bg-tint/60 px-2 py-0.5 text-[11px] font-medium text-spice-text-muted">
              {target.category}
            </span>
          ) : null}
        </div>
        <Button
          variant="secondary"
          className="h-7 shrink-0 gap-1 px-2 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
          onClick={() => onView(target.id)}
        >
          <EyeIcon className="h-3.5 w-3.5" />
          View
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg border border-spice-border/50 bg-spice-bg-tint/20 p-2.5 text-xs sm:grid-cols-2">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
            Status
          </span>
          <div className="mt-1">
            {targetStatus ? <ModuleStatusBadge status={targetStatus} /> : '—'}
          </div>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
            Lessons / Quizzes
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.card_count} lessons • {getQuizCount(target)} quizzes
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
            Duration
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.estimated_minutes} min
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
            Created On
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.created_at ? formatDisplayDateTime(target.created_at) : '—'}
          </span>
        </div>
        <div className="border-t border-spice-border/40 pt-2 sm:col-span-2">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
            {isPublished ? 'Published By' : 'Created By'}
          </span>
          <span className="mt-0.5 block truncate font-medium text-spice-text-medium">
            {isPublished ? getPublishedBy(target) : getCreatedBy(target)}
          </span>
        </div>
      </div>
    </ModuleCardPanel>
  );
}

export const NeedsReviewTab = ({
  modules,
  isLoading,
  error,
  onMerge,
  onDiscardNew,
  onKeepNew,
  onView,
  sortBy,
  sortDir,
  onSort,
  initialExpandedId,
  emptyMessage,
}: NeedsReviewTabProps) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<
    'keep_new' | 'discard_new' | 'merge' | null
  >(null);
  const [actionError, setActionError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialExpandedId) {
      initial.add(initialExpandedId);
    }
    return initial;
  });
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (initialExpandedId) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(initialExpandedId);
        return next;
      });
      const timer = setTimeout(() => {
        const element = document.getElementById(
          `needs-review-row-${initialExpandedId}`,
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialExpandedId]);

  const handleViewClick = (moduleId: string) => {
    setPreviewModuleId(moduleId);
    onView?.(moduleId);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMergeClick = async (moduleId: string) => {
    try {
      setActionError('');
      setSubmittingId(moduleId);
      setActionType('merge');
      await onMerge(moduleId);
    } finally {
      setSubmittingId(null);
      setActionType(null);
    }
  };

  const handleKeepNewClick = async (moduleId: string) => {
    if (!onKeepNew) return;
    try {
      setActionError('');
      setSubmittingId(moduleId);
      setActionType('keep_new');
      await onKeepNew(moduleId);
    } finally {
      setSubmittingId(null);
      setActionType(null);
    }
  };

  const handleDiscardNewClick = (moduleId: string) => {
    setActionError('');
    setDiscardTargetId(moduleId);
  };

  const handleConfirmDiscardNew = async () => {
    if (!discardTargetId) return;
    const moduleId = discardTargetId;
    try {
      setSubmittingId(moduleId);
      setActionType('discard_new');
      await onDiscardNew(moduleId);
      setDiscardTargetId(null);
    } finally {
      setSubmittingId(null);
      setActionType(null);
    }
  };

  const rows = useMemo<NeedsReviewTableRow[]>(() => {
    return (modules ?? []).map((primary) => {
      const { existingModule, existingModuleId } =
        resolveExistingModule(primary);
      const mergeSecondaryModuleId = resolveMergeSecondaryModuleId(
        primary,
        existingModuleId,
      );
      const createdBy = getCreatedBy(primary);

      return {
        id: primary.id,
        expand: '',
        title: formatModuleTitle(primary),
        content: '',
        status: 'review_pending',
        createdAt: primary.created_at
          ? formatDisplayDateTime(primary.created_at)
          : '—',
        createdBy,
        actions: '',
        raw: primary,
        existingModule,
        existingModuleId,
        mergeSecondaryModuleId,
      };
    });
  }, [modules]);

  const columns: Array<ColumnDef<NeedsReviewTableRow>> = [
    {
      key: 'expand',
      header: '',
      headerClassName: 'w-12 px-3 py-2 text-center sm:px-3',
      className: 'px-3 py-3.5 text-center sm:px-3 sm:py-3.5',
      render: (row) => {
        const isExpanded = expandedIds.has(row.id);
        return (
          <button
            type="button"
            id={`needs-review-row-${row.id}`}
            onClick={() => toggleExpand(row.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-spice-bg-tint text-spice-text-medium transition-colors focus:outline-none"
            aria-label={
              isExpanded ? 'Collapse comparison' : 'Expand comparison'
            }
            aria-expanded={isExpanded}
          >
            <ChevronIcon
              className="h-4 w-4 text-spice-text-muted"
              expanded={isExpanded}
            />
          </button>
        );
      },
    },
    {
      key: 'title',
      header: 'Module',
      sortable: true,
      sortKey: 'title',
      headerClassName: TABLE_TITLE_COLUMN_CLASS,
      className: TABLE_TITLE_COLUMN_CLASS,
      render: (row) => {
        const displayTitle = truncateDisplayText(
          row.title,
          TABLE_CELL_LABEL_MAX_LENGTH,
        );
        return (
          <div className="w-full min-w-0">
            <TruncatedText
              text={row.title}
              maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
            >
              <button
                type="button"
                onClick={() => toggleExpand(row.id)}
                className="block w-full truncate break-all text-left font-semibold text-spice-brand-primary hover:underline focus:outline-none"
              >
                {displayTitle}
              </button>
            </TruncatedText>
          </div>
        );
      },
    },
    {
      key: 'content',
      header: 'Content',
      headerClassName: 'px-4 py-2 sm:px-4',
      className:
        'px-4 py-3.5 text-xs text-spice-text-medium whitespace-nowrap sm:px-4 sm:py-3.5',
      render: (row) => {
        const primary = row.raw;
        return (
          <div className="inline-flex items-center gap-x-1 whitespace-nowrap text-xs text-spice-text-medium">
            <span>
              {primary.card_count === 1
                ? '1 lesson'
                : `${primary.card_count} lessons`}
            </span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            {primary.quiz_count > 0 ? (
              <span>
                {primary.quiz_count === 1
                  ? '1 question'
                  : `${primary.quiz_count} questions`}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold text-spice-text-muted ring-1 ring-spice-border">
                No quiz
              </span>
            )}
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            <span>
              ~{formatEstimatedMinutesDisplay(primary.estimated_minutes)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'px-4 py-2 sm:px-4',
      className: 'px-4 py-3.5 whitespace-nowrap sm:px-4 sm:py-3.5',
      render: () => <ModuleStatusBadge status="review_pending" />,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      sortKey: 'created_at',
      headerClassName: 'px-4 py-2 sm:px-4',
      className:
        'px-4 py-3.5 text-xs text-spice-text-medium whitespace-nowrap sm:px-4 sm:py-3.5',
      render: (row) => (
        <>
          <div className="font-medium text-spice-text-primary">
            {row.createdAt}
          </div>
          {row.createdBy !== '—' ? (
            <div className="text-[11px] text-spice-text-muted mt-0.5">
              By {row.createdBy}
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'px-4 py-2 text-left sm:px-4',
      className: 'px-4 py-3.5 text-left whitespace-nowrap sm:px-4 sm:py-3.5',
      render: (row) => {
        const isSubmittingThis = submittingId === row.id;
        return (
          <div className="flex flex-wrap items-center justify-start gap-2">
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
              disabled={isSubmittingThis}
              onClick={() => void handleKeepNewClick(row.id)}
            >
              {isSubmittingThis && actionType === 'keep_new'
                ? 'Keeping…'
                : 'Keep New'}
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
              disabled={isSubmittingThis}
              onClick={() => handleDiscardNewClick(row.id)}
            >
              {isSubmittingThis && actionType === 'discard_new'
                ? 'Discarding…'
                : 'Discard New'}
            </Button>
            <Button
              className="h-8 px-3 text-xs font-semibold bg-spice-brand-primary hover:bg-spice-brand-primary/90 text-white shadow-xs"
              disabled={isSubmittingThis}
              onClick={() => void handleMergeClick(row.id)}
            >
              {isSubmittingThis && actionType === 'merge'
                ? 'Merging…'
                : 'Merge'}
            </Button>
          </div>
        );
      },
    },
  ];

  if (error) {
    return <ErrorState title="Failed to load review pending modules." />;
  }

  if (isLoading) {
    return (
      <Card
        variant="bordered"
        className="p-12 text-center text-sm text-spice-text-muted rounded-xl border border-spice-border bg-spice-bg-surface shadow-sm"
      >
        Loading review modules…
      </Card>
    );
  }

  return (
    <>
      {actionError ? (
        <div className="mb-3">
          <ErrorState title={actionError} />
        </div>
      ) : null}
      <Table
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage={emptyMessage ?? 'No modules requiring review.'}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
        containerClassName="rounded-xl border border-spice-border bg-spice-bg-surface shadow-sm"
        getRowClassName={(row) =>
          expandedIds.has(row.id)
            ? 'bg-spice-bg-tint/30 duration-150 hover:bg-spice-bg-tint/30'
            : 'hover:bg-spice-bg-tint/20 duration-150'
        }
        renderExpandedRow={(row) => {
          if (!expandedIds.has(row.id)) return null;
          const primary = row.raw;

          return (
            <div className="w-0 min-w-full overflow-hidden">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ComparisonModulePanel
                  headerLabel="New Module"
                  headerInfo={{
                    label: 'About new module',
                    content: 'Newly generated module from the document',
                  }}
                  badgeVariant="warning"
                  module={primary}
                  moduleId={primary.id}
                  onView={handleViewClick}
                  isOpen
                  emptyMessage="New module details are unavailable."
                  loadingMessage="Loading new module details…"
                  fallbackStatus="review_pending"
                />
                <ComparisonModulePanel
                  headerLabel="Existing Module"
                  headerInfo={{
                    label: 'About existing module',
                    content: 'Already published/existing module',
                  }}
                  badgeVariant="info"
                  module={row.existingModule}
                  moduleId={row.existingModuleId}
                  onView={handleViewClick}
                  isOpen
                  emptyMessage="No matching existing module linkage found."
                  loadingMessage="Loading existing module details…"
                />
                <ComparisonModulePanel
                  headerLabel="Merge Preview"
                  headerInfo={{
                    label: 'About merge preview',
                    content: 'Shows what the module will look like if merged',
                  }}
                  badgeVariant="success"
                  moduleId={row.mergeSecondaryModuleId}
                  onView={handleViewClick}
                  isOpen
                  emptyMessage="No merge preview is available yet."
                  loadingMessage="Loading merge preview…"
                />
              </div>
            </div>
          );
        }}
      />

      <IngestMatchedModulePreviewModal
        open={Boolean(previewModuleId)}
        moduleId={previewModuleId}
        onClose={() => setPreviewModuleId(null)}
      />

      <ConfirmDialog
        open={Boolean(discardTargetId)}
        labelledBy="discard-new-module-title"
        describedBy="discard-new-module-description"
        title="Discard new module?"
        description={
          <>
            Are you sure you want to discard{' '}
            {discardTargetId ? (
              <QuotedDisplayLabel
                text={
                  rows.find((row) => row.id === discardTargetId)?.title ??
                  'this module'
                }
              />
            ) : (
              'this module'
            )}
            ? The existing module will remain unchanged.
          </>
        }
        confirmLabel="Discard New"
        confirmingLabel="Discarding…"
        isConfirming={
          submittingId === discardTargetId && actionType === 'discard_new'
        }
        disabled={
          submittingId === discardTargetId && actionType === 'discard_new'
        }
        onClose={() => setDiscardTargetId(null)}
        onConfirm={() => void handleConfirmDiscardNew()}
      />
    </>
  );
};
