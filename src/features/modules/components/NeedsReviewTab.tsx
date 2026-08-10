import { useEffect, useMemo, useState } from 'react';
import { Table, type ColumnDef } from '@/components/common/Table';
import { Button, Card, ErrorState } from '@/components/ui';
import {
  useGetModuleDetailQuery,
  type AdminModuleDetailResponse,
  type AdminModulesListItem,
} from '@/features/modules/api/adminModulesApi';
import { IngestMatchedModulePreviewModal } from '@/features/ingest/components/IngestMatchedModulePreviewModal';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { formatEstimatedMinutesDisplay } from '@/features/ingest/utils/formatEstimatedMinutesDisplay';

interface NeedsReviewTabProps {
  modules: AdminModulesListItem[];
  isLoading?: boolean;
  error?: unknown;
  onMerge: (moduleId: string) => Promise<void>;
  onSkip: (moduleId: string) => Promise<void>;
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
};

export const NEEDS_REVIEW_TOOLTIP_CONTENT = (
  <div className="space-y-3.5 p-3.5 text-xs max-w-sm">
    <div className="border-b border-spice-border/60 pb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-semantic-warningBg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-semantic-warning">
          Merge
        </span>
      </div>
      <p className="pl-3 text-spice-text-medium leading-relaxed text-[11px]">
        Moves the new module to{' '}
        <strong className="text-spice-text-primary">Drafts</strong>. The
        existing similar module is{' '}
        <strong className="text-spice-text-primary">discarded</strong> and moved
        to the Discarded tab. All assignments, learner progress, quiz attempts,
        telemetry, and analytics associated with the existing module are
        permanently removed.
      </p>
    </div>
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-text-muted ring-1 ring-spice-border/50">
          Skip
        </span>
      </div>
      <p className="pl-3 text-spice-text-medium leading-relaxed text-[11px]">
        Deletes the new module. The existing module remains unchanged.
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

function getCreatedBy(
  item: AdminModulesListItem | AdminModuleDetailResponse | null | undefined,
): string {
  if (!item) return '—';
  const metadata = (item as AdminModulesListItem).search_metadata as Record<
    string,
    unknown
  > | null;
  if (
    metadata &&
    typeof metadata.created_by === 'string' &&
    metadata.created_by.trim()
  ) {
    return metadata.created_by.trim();
  }
  if (
    metadata &&
    typeof metadata.author === 'string' &&
    metadata.author.trim()
  ) {
    return metadata.author.trim();
  }
  return '—';
}

function getPublishedBy(
  item: AdminModulesListItem | AdminModuleDetailResponse | null | undefined,
): string {
  if (!item) return '—';
  const metadata = (item as AdminModulesListItem).search_metadata as Record<
    string,
    unknown
  > | null;
  if (
    metadata &&
    typeof metadata.published_by === 'string' &&
    metadata.published_by.trim()
  ) {
    return metadata.published_by.trim();
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

  const existingModuleId =
    primary.merge_source_module_id ||
    (typeof primary.merge_source_module === 'string'
      ? primary.merge_source_module
      : null) ||
    existingModule?.id;

  return { existingModule, existingModuleId };
}

function EyeIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 mr-1 inline"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 text-spice-text-muted ${
        expanded ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ModuleCardPanel({
  headerLabel,
  badgeText,
  badgeVariant = 'warning',
  children,
}: {
  headerLabel: string;
  badgeText?: string;
  badgeVariant?: 'warning' | 'info';
  children: React.ReactNode;
}) {
  const borderLeftColor =
    badgeVariant === 'warning' ? 'border-l-amber-500' : 'border-l-indigo-500';
  const badgeStyle =
    badgeVariant === 'warning'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
      : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20';

  return (
    <div
      className={`rounded-xl border border-spice-border border-l-4 ${borderLeftColor} bg-spice-bg-surface overflow-hidden shadow-sm transition-all hover:shadow-md`}
    >
      <div className="px-4 py-2.5 bg-spice-bg-tint/40 border-b border-spice-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-spice-text-muted">
          {headerLabel}
        </span>
        {badgeText ? (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${badgeStyle}`}
          >
            {badgeText}
          </span>
        ) : null}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function ExistingModulePanel({
  existingModule,
  existingModuleId,
  onView,
  isOpen,
}: {
  existingModule?: AdminModulesListItem | AdminModuleDetailResponse | null;
  existingModuleId?: string | null;
  onView: (moduleId: string) => void;
  isOpen: boolean;
}) {
  const { data: fetchedModule, isLoading } = useGetModuleDetailQuery(
    existingModuleId ?? '',
    { skip: !isOpen || Boolean(existingModule) || !existingModuleId },
  );

  const target = existingModule ?? fetchedModule;

  if (isLoading && !target) {
    return (
      <ModuleCardPanel headerLabel="Existing Module" badgeVariant="info">
        <div className="flex h-36 items-center justify-center text-xs text-spice-text-muted animate-pulse">
          Loading existing module details…
        </div>
      </ModuleCardPanel>
    );
  }

  if (!target) {
    return (
      <ModuleCardPanel headerLabel="Existing Module" badgeVariant="info">
        <div className="flex h-36 items-center justify-center text-xs text-spice-text-muted">
          No matching existing module linkage found.
        </div>
      </ModuleCardPanel>
    );
  }

  const quizCount =
    (target as AdminModulesListItem).quiz_count ??
    ('quiz' in target && Array.isArray(target.quiz) ? target.quiz.length : 0);

  const targetStatus =
    target.lifecycle_status || (target as { status?: string }).status;
  const isPublished = targetStatus?.toLowerCase() === 'published';

  return (
    <ModuleCardPanel headerLabel="Existing Module" badgeVariant="info">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-spice-border/30 mb-1">
        <div className="min-w-0 flex-1 py-1">
          <h4 className="text-sm font-semibold leading-snug text-spice-text-primary">
            {formatModuleTitle(target)}
          </h4>
          {target.category ? (
            <span className="mt-1.5 inline-block rounded bg-spice-bg-tint/60 px-2 py-0.5 text-[11px] text-spice-text-muted font-medium">
              {target.category}
            </span>
          ) : null}
        </div>
        <Button
          variant="secondary"
          className="h-8 shrink-0 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
          onClick={() => onView(target.id)}
        >
          <EyeIcon />
          View
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-spice-border/50 bg-spice-bg-tint/20 p-3 text-xs">
        <div>
          <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
            Status
          </span>
          <div className="mt-1">
            {targetStatus ? <ModuleStatusBadge status={targetStatus} /> : '—'}
          </div>
        </div>
        <div>
          <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
            Lessons / Quizzes
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.card_count} lessons • {quizCount} quizzes
          </span>
        </div>
        <div>
          <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
            Duration
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.estimated_minutes} min
          </span>
        </div>
        <div>
          <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
            Created On
          </span>
          <span className="mt-1 block font-medium text-spice-text-primary">
            {target.created_at ? formatDisplayDateTime(target.created_at) : '—'}
          </span>
        </div>
        <div className="col-span-2 border-t border-spice-border/40 pt-2">
          <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
            {isPublished ? 'Published By' : 'Created By'}
          </span>
          <span className="mt-0.5 block font-medium text-spice-text-medium">
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
  onSkip,
  onView,
  sortBy,
  sortDir,
  onSort,
  initialExpandedId,
  emptyMessage,
}: NeedsReviewTabProps) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'merge' | 'skip' | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialExpandedId) {
      initial.add(initialExpandedId);
    }
    return initial;
  });
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);

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
      setSubmittingId(moduleId);
      setActionType('merge');
      await onMerge(moduleId);
    } finally {
      setSubmittingId(null);
      setActionType(null);
    }
  };

  const handleSkipClick = async (moduleId: string) => {
    try {
      setSubmittingId(moduleId);
      setActionType('skip');
      await onSkip(moduleId);
    } finally {
      setSubmittingId(null);
      setActionType(null);
    }
  };

  const rows = useMemo<NeedsReviewTableRow[]>(() => {
    return (modules ?? []).map((primary) => {
      const { existingModule, existingModuleId } =
        resolveExistingModule(primary);
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
            <ChevronIcon expanded={isExpanded} />
          </button>
        );
      },
    },
    {
      key: 'title',
      header: 'Module',
      sortable: true,
      sortKey: 'title',
      headerClassName: 'px-4 py-2 sm:px-4',
      className:
        'px-4 py-3.5 font-medium text-spice-text-primary sm:px-4 sm:py-3.5',
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleExpand(row.id)}
          className="text-left font-semibold text-spice-brand-primary hover:underline focus:outline-none"
        >
          {row.title}
        </button>
      ),
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
          <div className="inline-grid w-max grid-cols-[4.75rem_auto_5.5rem_auto_3.25rem] items-center gap-x-1 whitespace-nowrap text-xs text-spice-text-medium">
            <span>
              {primary.card_count === 1
                ? '1 lesson'
                : `${primary.card_count} lessons`}
            </span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            {primary.quiz_count > 0 ? (
              <span className="text-center">
                {primary.quiz_count === 1
                  ? '1 question'
                  : `${primary.quiz_count} questions`}
              </span>
            ) : (
              <span className="inline-flex w-full items-center justify-center">
                <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold text-spice-text-muted ring-1 ring-spice-border">
                  No quiz
                </span>
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
          <div className="flex items-center justify-start gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
              disabled={isSubmittingThis}
              onClick={() => void handleSkipClick(row.id)}
            >
              {isSubmittingThis && actionType === 'skip' ? 'Skipping…' : 'Skip'}
            </Button>
            <Button
              className="h-8 px-3.5 text-xs font-semibold bg-spice-brand-primary hover:bg-spice-brand-primary/90 text-white shadow-xs"
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
            <div className="grid gap-4 md:grid-cols-2">
              <ModuleCardPanel headerLabel="New Module" badgeVariant="warning">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-spice-border/30 mb-1">
                  <div className="min-w-0 flex-1 py-1">
                    <h4 className="text-sm font-semibold leading-snug text-spice-text-primary">
                      {formatModuleTitle(primary)}
                    </h4>
                    {primary.category ? (
                      <span className="mt-1.5 inline-block rounded bg-spice-bg-tint/60 px-2 py-0.5 text-[11px] text-spice-text-muted font-medium">
                        {primary.category}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    variant="secondary"
                    className="h-8 shrink-0 text-xs font-medium border border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint"
                    onClick={() => handleViewClick(primary.id)}
                  >
                    <EyeIcon />
                    View
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-spice-border/50 bg-spice-bg-tint/20 p-3 text-xs">
                  <div>
                    <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
                      Status
                    </span>
                    <div className="mt-1">
                      <ModuleStatusBadge status="review_pending" />
                    </div>
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
                      Lessons / Quizzes
                    </span>
                    <span className="mt-1 block font-medium text-spice-text-primary">
                      {primary.card_count} lessons • {primary.quiz_count}{' '}
                      quizzes
                    </span>
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
                      Duration
                    </span>
                    <span className="mt-1 block font-medium text-spice-text-primary">
                      {primary.estimated_minutes} min
                    </span>
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
                      Created On
                    </span>
                    <span className="mt-1 block font-medium text-spice-text-primary">
                      {primary.created_at
                        ? formatDisplayDateTime(primary.created_at)
                        : '—'}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-spice-border/40 pt-2">
                    <span className="text-spice-text-muted block text-[10px] uppercase font-bold tracking-wider">
                      Created By
                    </span>
                    <span className="mt-0.5 block font-medium text-spice-text-medium">
                      {getCreatedBy(primary)}
                    </span>
                  </div>
                </div>
              </ModuleCardPanel>

              <ExistingModulePanel
                existingModule={row.existingModule}
                existingModuleId={row.existingModuleId}
                onView={handleViewClick}
                isOpen
              />
            </div>
          );
        }}
      />

      <IngestMatchedModulePreviewModal
        open={Boolean(previewModuleId)}
        moduleId={previewModuleId}
        onClose={() => setPreviewModuleId(null)}
      />
    </>
  );
};
