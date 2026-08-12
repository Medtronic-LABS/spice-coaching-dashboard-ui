import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import type { ModuleDemandQueryRow } from '@/features/admin-dashboard/types/dashboard.types';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

interface EvidenceQueryRowProps {
  row: ModuleDemandQueryRow;
  showMetadata: boolean;
  showTimestamp: boolean;
}

export const EvidenceQueryRow = ({
  row,
  showMetadata,
  showTimestamp,
}: EvidenceQueryRowProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const interactionLabel =
    row.interactionType === 'assignment_requested'
      ? t('adminDashboard.moduleDemand.interaction.assignmentRequested')
      : t('adminDashboard.moduleDemand.interaction.chatbotServed');

  return (
    <div className="rounded-lg border border-spice-border bg-spice-bg-surface">
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-spice-text-primary">
            {row.primaryText}
          </p>
          <p className="mt-1 text-xs text-spice-text-muted">
            {t('adminDashboard.moduleDemand.occurrences', {
              count: row.occurrenceCount,
            })}
          </p>
        </div>
        {showMetadata ? (
          <ChevronIcon
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-spice-text-muted transition-transform',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        ) : null}
      </button>
      {showMetadata && expanded ? (
        <div className="border-t border-spice-border px-4 py-3 text-xs text-spice-text-medium">
          <dl className="grid gap-2 sm:grid-cols-2">
            {showTimestamp ? (
              <div>
                <dt className="text-spice-text-muted">
                  {t('adminDashboard.moduleDemand.metadata.timestamp')}
                </dt>
                <dd>{formatDisplayDateTime(row.timestamp)}</dd>
              </div>
            ) : null}
            {row.skName ? (
              <div>
                <dt className="text-spice-text-muted">
                  {t('adminDashboard.moduleDemand.metadata.skName')}
                </dt>
                <dd>{row.skName}</dd>
              </div>
            ) : null}
            {row.district ? (
              <div>
                <dt className="text-spice-text-muted">
                  {t('adminDashboard.moduleDemand.metadata.district')}
                </dt>
                <dd>{row.district}</dd>
              </div>
            ) : null}
            {row.upazila ? (
              <div>
                <dt className="text-spice-text-muted">
                  {t('adminDashboard.moduleDemand.metadata.upazila')}
                </dt>
                <dd>{row.upazila}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-spice-text-muted">
                {t('adminDashboard.moduleDemand.metadata.interaction')}
              </dt>
              <dd>{interactionLabel}</dd>
            </div>
            {row.reason ? (
              <div className="sm:col-span-2">
                <dt className="text-spice-text-muted">
                  {t('adminDashboard.moduleDemand.metadata.reason')}
                </dt>
                <dd>{row.reason}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
};
