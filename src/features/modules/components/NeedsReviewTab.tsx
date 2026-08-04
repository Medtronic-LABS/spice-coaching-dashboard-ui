import { useState } from 'react';
import { Button, Card, Tooltip } from '@/components/ui';
import {
  useGetModuleDetailQuery,
  type AdminModuleDetailResponse,
  type AdminModulesListItem,
} from '@/features/modules/api/adminModulesApi';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

interface NeedsReviewTabProps {
  modules: AdminModulesListItem[];
  isLoading?: boolean;
  error?: unknown;
  onMerge: (moduleId: string) => Promise<void>;
  onSkip: (moduleId: string) => Promise<void>;
  onView: (moduleId: string) => void;
}

const TOOLTIP_CONTENT = (
  <div className="space-y-3 p-3.5 text-xs max-w-sm">
    <div className="border-b border-spice-border pb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-flex items-center rounded-md bg-spice-semantic-warningBg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-semantic-warning">
          Merge
        </span>
      </div>
      <p className="text-spice-text-medium leading-relaxed text-[11px]">
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
        <span className="inline-flex items-center rounded-md bg-spice-bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-spice-text-muted">
          Skip
        </span>
      </div>
      <p className="text-spice-text-medium leading-relaxed text-[11px]">
        Deletes the new candidate module. The existing module remains unchanged.
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

function ModuleCardPanel({
  headerLabel,
  children,
}: {
  headerLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-spice-border bg-spice-bg-surface overflow-hidden">
      <div className="px-4 py-2 bg-spice-bg-tint/50 border-b border-spice-border">
        <span className="text-xs font-bold uppercase tracking-wider text-spice-text-muted">
          {headerLabel}
        </span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function ExistingModulePanel({
  existingModule,
  existingModuleId,
  onView,
}: {
  existingModule?: AdminModulesListItem | AdminModuleDetailResponse | null;
  existingModuleId?: string | null;
  onView: (moduleId: string) => void;
}) {
  const { data: fetchedModule, isLoading } = useGetModuleDetailQuery(
    existingModuleId ?? '',
    { skip: Boolean(existingModule) || !existingModuleId },
  );

  const target = existingModule ?? fetchedModule;

  if (isLoading && !target) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-spice-text-muted">
        Loading existing module details…
      </div>
    );
  }

  if (!target) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-spice-text-muted">
        No matching existing module linkage found.
      </div>
    );
  }

  const quizCount =
    (target as AdminModulesListItem).quiz_count ??
    ('quiz' in target && Array.isArray(target.quiz) ? target.quiz.length : 0);

  const targetStatus =
    target.lifecycle_status || (target as { status?: string }).status;
  const isPublished = targetStatus?.toLowerCase() === 'published';

  return (
    <ModuleCardPanel headerLabel="Existing Module">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-spice-text-primary">
            {formatModuleTitle(target)}
          </span>
        </div>
        <Button
          variant="ghost"
          className="h-7 text-xs text-spice-brand-accent hover:bg-spice-bg-tint"
          onClick={() => onView(target.id)}
        >
          View
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-spice-text-medium">
        <div>
          <span className="text-spice-text-muted block text-[11px]">
            Status
          </span>
          {targetStatus ? <ModuleStatusBadge status={targetStatus} /> : '—'}
        </div>
        <div>
          <span className="text-spice-text-muted block text-[11px]">
            Lessons
          </span>
          {target.card_count}
        </div>
        <div>
          <span className="text-spice-text-muted block text-[11px]">
            Quizzes
          </span>
          {quizCount}
        </div>
        <div>
          <span className="text-spice-text-muted block text-[11px]">
            Duration
          </span>
          {target.estimated_minutes} min
        </div>
        <div>
          <span className="text-spice-text-muted block text-[11px]">
            Created On
          </span>
          {target.created_at ? formatDisplayDateTime(target.created_at) : '—'}
        </div>
        {isPublished ? (
          <div>
            <span className="text-spice-text-muted block text-[11px]">
              Published By
            </span>
            <span className="text-spice-text-muted">
              {getPublishedBy(target)}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-spice-text-muted block text-[11px]">
              Created By
            </span>
            <span className="text-spice-text-muted">
              {getCreatedBy(target)}
            </span>
          </div>
        )}
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
}: NeedsReviewTabProps) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'merge' | 'skip' | null>(null);

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

  if (error) {
    return (
      <Card
        variant="bordered"
        className="p-4 text-xs text-spice-semantic-error"
      >
        Failed to load review pending modules.
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card
        variant="bordered"
        className="p-8 text-center text-sm text-spice-text-muted"
      >
        Loading review items…
      </Card>
    );
  }

  if (!modules.length) {
    return (
      <Card
        variant="bordered"
        className="p-8 text-center text-sm text-spice-text-muted"
      >
        No modules requiring review.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-spice-border bg-spice-bg-tint px-4 py-3 text-xs text-spice-text-medium flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-spice-text-primary">
            Review Pending Modules
          </span>
          <span className="text-spice-text-muted">•</span>
          <span>
            Review candidate modules generated from re-ingestion against
            existing modules before deciding to <strong>Merge</strong> or{' '}
            <strong>Skip</strong>.
          </span>
        </div>
        <Tooltip
          label="Merge and Skip actions explanation"
          content={TOOLTIP_CONTENT}
        />
      </div>

      {modules.map((primary) => {
        const existingModule = (
          primary.merge_source_module &&
          typeof primary.merge_source_module === 'object'
            ? primary.merge_source_module
            : null
        ) as AdminModulesListItem | AdminModuleDetailResponse | null;

        const existingModuleId =
          primary.merge_source_module_id ||
          (typeof primary.merge_source_module === 'string'
            ? primary.merge_source_module
            : null) ||
          existingModule?.id;

        const isSubmittingThis = submittingId === primary.id;

        return (
          <Card
            key={primary.id ?? Math.random().toString()}
            variant="elevated"
            className="space-y-4 p-4 sm:p-5"
          >
            {/* Header with Title, Status & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-spice-border pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-spice-text-primary">
                  {formatModuleTitle(primary)}
                </h3>
                <ModuleStatusBadge status="review_pending" />
                <Tooltip
                  label="Merge and Skip actions explanation"
                  content={TOOLTIP_CONTENT}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="h-8 text-xs"
                  disabled={isSubmittingThis}
                  onClick={() => void handleSkipClick(primary.id)}
                >
                  {isSubmittingThis && actionType === 'skip'
                    ? 'Skipping…'
                    : 'Skip'}
                </Button>
                <Button
                  className="h-8 text-xs"
                  disabled={isSubmittingThis}
                  onClick={() => void handleMergeClick(primary.id)}
                >
                  {isSubmittingThis && actionType === 'merge'
                    ? 'Merging…'
                    : 'Merge'}
                </Button>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left Side: New Module */}
              <ModuleCardPanel headerLabel="New Module (Candidate)">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-spice-text-primary">
                    {formatModuleTitle(primary)}
                  </div>
                  <Button
                    variant="ghost"
                    className="h-7 text-xs text-spice-brand-accent hover:bg-spice-bg-tint"
                    onClick={() => onView(primary.id)}
                  >
                    View
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-spice-text-medium">
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Status
                    </span>
                    <ModuleStatusBadge status="review_pending" />
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Lessons
                    </span>
                    {primary.card_count}
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Quizzes
                    </span>
                    {primary.quiz_count}
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Duration
                    </span>
                    {primary.estimated_minutes} min
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Created On
                    </span>
                    {primary.created_at
                      ? formatDisplayDateTime(primary.created_at)
                      : '—'}
                  </div>
                  <div>
                    <span className="text-spice-text-muted block text-[11px]">
                      Created By
                    </span>
                    <span className="text-spice-text-muted">
                      {getCreatedBy(primary)}
                    </span>
                  </div>
                </div>
              </ModuleCardPanel>

              {/* Right Side: Existing Module */}
              <ExistingModulePanel
                existingModule={existingModule}
                existingModuleId={existingModuleId}
                onView={onView}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
