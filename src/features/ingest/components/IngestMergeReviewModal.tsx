import { Table, type ColumnDef } from '@/components/common/Table';
import { Badge, Button, Card, Modal, Tooltip } from '@/components/ui';
import type {
  AdminV3IngestMergeDecision,
  IngestMergeDecisionChoice,
} from '@/features/ingest/api/adminIngestApi';
import { MERGE_DECISION_MERGE_TOOLTIP } from '@/features/ingest/constants/ingestConfigurationTooltips';
import {
  mergeDecisionKey,
  resolveMatchedModuleId,
  resolveMergeDecisionTitle,
} from '@/features/ingest/utils/ingestMergeDecisions';

export type MergeDecisionOutcome = IngestMergeDecisionChoice;

export interface IngestMergeReviewModalProps {
  open: boolean;
  decisions: AdminV3IngestMergeDecision[];
  outcomes: Record<string, MergeDecisionOutcome>;
  submittingKeys: ReadonlySet<string>;
  mergeUnavailableKeys: ReadonlySet<string>;
  notification: {
    tone: 'success' | 'error' | 'warning';
    message: string;
  } | null;
  onClose: () => void;
  onDecide: (
    decision: AdminV3IngestMergeDecision,
    choice: IngestMergeDecisionChoice,
  ) => void;
  onViewModule: (decision: AdminV3IngestMergeDecision) => void;
}

type DecisionRow = AdminV3IngestMergeDecision & { _key: string };

export const IngestMergeReviewModal = ({
  open,
  decisions,
  outcomes,
  submittingKeys,
  mergeUnavailableKeys,
  notification,
  onClose,
  onDecide,
  onViewModule,
}: IngestMergeReviewModalProps) => {
  const pendingCount = decisions.filter(
    (decision) => !outcomes[mergeDecisionKey(decision)],
  ).length;
  const canClose = pendingCount === 0;

  const tableData: DecisionRow[] = decisions.map((decision) => ({
    ...decision,
    _key: mergeDecisionKey(decision),
  }));

  const columns: ColumnDef<DecisionRow>[] = [
    {
      key: 'candidate_id',
      header: 'Module Title',
      className: 'max-w-[16rem] align-middle',
      render: (row) => {
        const mergeUnavailable = mergeUnavailableKeys.has(row._key);
        return (
          <div>
            <div className="font-medium text-spice-text-primary">
              {resolveMergeDecisionTitle(row)}
            </div>
            {mergeUnavailable ? (
              <div className="mt-1 text-[11px] text-spice-semantic-warning">
                Matched module unavailable. You can Skip Merge to create a new
                module.
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'decision',
      header: (
        <span className="inline-flex items-center gap-1.5">
          Action
          <Tooltip
            label="About Merge action"
            content={MERGE_DECISION_MERGE_TOOLTIP}
          />
        </span>
      ),
      className: 'align-middle',
      render: (row) => {
        const outcome = outcomes[row._key];
        const isSubmitting = submittingKeys.has(row._key);
        const mergeUnavailable = mergeUnavailableKeys.has(row._key);

        if (outcome === 'accept_merge') {
          return (
            <Badge className="bg-spice-semantic-successBg text-spice-semantic-success">
              Merged
            </Badge>
          );
        }
        if (outcome === 'force_create') {
          return (
            <Badge className="bg-spice-bg-tint text-spice-text-medium">
              Skipped
            </Badge>
          );
        }
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-8 text-xs"
              disabled={isSubmitting || mergeUnavailable}
              onClick={() => onDecide(row, 'accept_merge')}
            >
              {isSubmitting ? 'Saving…' : 'Merge'}
            </Button>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              disabled={isSubmitting}
              onClick={() => onDecide(row, 'force_create')}
            >
              {isSubmitting ? 'Saving…' : 'Skip Merge'}
            </Button>
          </div>
        );
      },
    },
    {
      key: 'matched_module_id',
      header: 'View Module',
      className: 'align-middle',
      render: (row) => {
        const isSubmitting = submittingKeys.has(row._key);
        const matchedModuleId = resolveMatchedModuleId(row);
        return (
          <div>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              disabled={isSubmitting}
              onClick={() => onViewModule(row)}
            >
              View Module
            </Button>
            {!matchedModuleId ? (
              <div className="mt-1 text-[11px] text-spice-text-muted">
                Module id unavailable
              </div>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      labelledBy="ingest-merge-review-title"
      describedBy="ingest-merge-review-description"
      onClose={canClose ? onClose : undefined}
      zIndexClassName="z-[310]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-4xl space-y-4 border-spice-border p-5 shadow-lg sm:p-6"
      >
        <div className="space-y-2">
          <h2
            id="ingest-merge-review-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Review module merge decisions
          </h2>
          <p
            id="ingest-merge-review-description"
            className="text-sm text-spice-text-muted"
          >
            {canClose
              ? 'All modules have been reviewed. You can close this dialog and ingestion will continue.'
              : 'Every matching module must be reviewed before ingestion can continue. Choose Merge or Skip Merge for each row.'}
          </p>
        </div>

        {notification ? (
          <div
            className={
              notification.tone === 'success'
                ? 'rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success'
                : notification.tone === 'warning'
                  ? 'rounded-lg bg-spice-semantic-warningBg px-3 py-2 text-xs text-spice-semantic-warning'
                  : 'rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error'
            }
            role="status"
          >
            {notification.message}
          </div>
        ) : null}

        <Table
          data={tableData}
          columns={columns}
          keyExtractor={(row) => row._key}
          emptyMessage="No pending merge decisions."
        />

        <div className="flex justify-end">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={!canClose}
            onClick={onClose}
          >
            {canClose ? 'Close' : `${pendingCount} pending…`}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
