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
  hideSkName?: boolean;
}

export const EvidenceQueryRow = ({
  row,
  showMetadata,
  showTimestamp,
  hideSkName = false,
}: EvidenceQueryRowProps) => {
  const { t } = useTranslation();
  const [metadataOpen, setMetadataOpen] = useState(false);

  const interactionLabel =
    row.interactionType === 'assignment_requested'
      ? t('adminDashboard.moduleDemand.interaction.assignmentRequested')
      : t('adminDashboard.moduleDemand.interaction.chatbotServed');

  const metadataEntries = [
    showTimestamp && row.timestamp
      ? {
          label: t('adminDashboard.moduleDemand.metadata.timestamp'),
          value: formatDisplayDateTime(row.timestamp),
        }
      : null,
    !hideSkName && row.skName
      ? {
          label: t('adminDashboard.moduleDemand.metadata.skName'),
          value: row.skName,
        }
      : null,
    row.district
      ? {
          label: t('adminDashboard.moduleDemand.metadata.district'),
          value: row.district,
        }
      : null,
    row.upazila
      ? {
          label: t('adminDashboard.moduleDemand.metadata.upazila'),
          value: row.upazila,
        }
      : null,
    {
      label: t('adminDashboard.moduleDemand.metadata.interaction'),
      value: interactionLabel,
    },
    row.reason
      ? {
          label: t('adminDashboard.moduleDemand.metadata.reason'),
          value: row.reason,
        }
      : null,
  ].filter(
    (entry): entry is { label: string; value: string } => entry !== null,
  );

  return (
    <div className="rounded-lg border border-spice-border bg-spice-bg-surface">
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-spice-text-primary">
          {row.primaryText}
        </p>
        <p className="mt-1 text-xs text-spice-text-muted">
          {t('adminDashboard.moduleDemand.occurrences', {
            count: row.occurrenceCount,
          })}
        </p>
      </div>
      {showMetadata && metadataEntries.length > 0 ? (
        <details
          className="border-t border-spice-border"
          open={metadataOpen}
          onToggle={(event) => {
            setMetadataOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs font-medium text-spice-brand-primary marker:content-none">
            <ChevronIcon
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                metadataOpen && 'rotate-180',
              )}
            />
            {t('adminDashboard.moduleDemand.showMetadata')}
          </summary>
          <dl className="grid gap-2 px-4 pb-3 text-xs text-spice-text-medium sm:grid-cols-2">
            {metadataEntries.map((entry) => (
              <div key={entry.label}>
                <dt className="text-spice-text-muted">{entry.label}</dt>
                <dd className="mt-0.5">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
};
