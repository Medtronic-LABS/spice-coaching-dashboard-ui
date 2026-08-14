import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import type {
  ModuleDemandQueryRow,
  ModuleDemandUserEntry,
} from '@/features/admin-dashboard/types/dashboard.types';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

/** Show this many rows before the list becomes scrollable. */
export const MODULE_DEMAND_VISIBLE_ROWS = 5;

interface EvidenceQueryRowProps {
  row: ModuleDemandQueryRow;
  showTimestamp: boolean;
  hideSkName?: boolean;
}

function ScrollableRowList({
  children,
  itemCount,
}: {
  children: ReactNode;
  itemCount: number;
}) {
  const shouldScroll = itemCount > MODULE_DEMAND_VISIBLE_ROWS;

  return (
    <div
      className={cn(
        'space-y-1.5',
        shouldScroll &&
          'max-h-[13.75rem] overflow-y-auto overscroll-contain pr-1',
      )}
    >
      {children}
    </div>
  );
}

function UserDetailRow({
  hideSkName,
  user,
  showTimestamp,
  interactionLabel,
}: {
  hideSkName: boolean;
  user: ModuleDemandUserEntry;
  showTimestamp: boolean;
  interactionLabel: string;
}) {
  const name = !hideSkName && user.skName ? user.skName : null;
  const timestamp =
    showTimestamp && user.timestamp
      ? formatDisplayDateTime(user.timestamp)
      : null;

  if (!name && !interactionLabel && !timestamp) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid gap-x-3 gap-y-1 rounded-md border border-spice-border/50 bg-spice-bg-surface px-2.5 py-2 text-xs',
        'sm:grid-cols-[minmax(8rem,1fr)_minmax(7rem,0.9fr)_minmax(8rem,0.9fr)]',
      )}
    >
      <span className="truncate font-medium text-spice-text-primary">
        {name ?? '—'}
      </span>
      <span className="text-spice-text-muted">{interactionLabel}</span>
      <span className="whitespace-nowrap text-spice-text-muted">
        {timestamp ?? '—'}
      </span>
    </div>
  );
}

export const EvidenceQueryRow = ({
  row,
  showTimestamp,
  hideSkName = false,
}: EvidenceQueryRowProps) => {
  const { t } = useTranslation();
  const [usersOpen, setUsersOpen] = useState(false);

  const interactionLabel =
    row.interactionType === 'assignment_requested'
      ? t('adminDashboard.moduleDemand.interaction.assignmentRequested')
      : t('adminDashboard.moduleDemand.interaction.chatbotServed');

  const users = row.users.length > 0 ? row.users : [row];
  const hasUserDetails = users.length > 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-spice-border/70 bg-spice-bg-surface',
        usersOpen && 'border-spice-brand-primary/30 shadow-sm',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
          hasUserDetails && 'hover:bg-spice-bg-tint/60',
          usersOpen && 'bg-spice-bg-tint/40',
        )}
        aria-expanded={usersOpen}
        disabled={!hasUserDetails}
        onClick={() => {
          if (!hasUserDetails) return;
          setUsersOpen((value) => !value);
        }}
      >
        {hasUserDetails ? (
          <ChevronIcon
            expanded={usersOpen}
            className="h-3.5 w-3.5 shrink-0 text-spice-text-muted"
          />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-spice-text-primary">
            {row.primaryText}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
            'bg-spice-brand-primary/10 text-spice-brand-primary',
          )}
        >
          {t('adminDashboard.moduleDemand.occurrences', {
            count: row.occurrenceCount,
          })}
        </span>
      </button>

      {usersOpen && hasUserDetails ? (
        <div className="space-y-2 border-t border-spice-border/60 bg-spice-bg-tint/30 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-spice-text-muted">
              {t('adminDashboard.moduleDemand.usersHeading')}
            </p>
            <span className="text-[10px] tabular-nums text-spice-text-muted">
              {t('adminDashboard.moduleDemand.userCount', {
                count: users.length,
              })}
            </span>
          </div>

          <div
            className={cn(
              'hidden gap-x-3 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-spice-text-muted sm:grid',
              'sm:grid-cols-[minmax(8rem,1fr)_minmax(7rem,0.9fr)_minmax(8rem,0.9fr)]',
            )}
          >
            <span>{t('adminDashboard.moduleDemand.metadata.skName')}</span>
            <span>{t('adminDashboard.moduleDemand.metadata.interaction')}</span>
            <span>{t('adminDashboard.moduleDemand.metadata.timestamp')}</span>
          </div>

          <ScrollableRowList itemCount={users.length}>
            {users.map((user, index) => (
              <UserDetailRow
                key={`${user.skId ?? 'user'}-${user.timestamp ?? index}`}
                hideSkName={hideSkName}
                user={user}
                showTimestamp={showTimestamp}
                interactionLabel={interactionLabel}
              />
            ))}
          </ScrollableRowList>
        </div>
      ) : null}
    </div>
  );
};

interface ModuleDemandEvidenceListProps {
  questionRows: ModuleDemandQueryRow[];
  requestRows: ModuleDemandQueryRow[];
  queriesHeading: string;
  requestsHeading: string;
  emptyQueries: string;
  emptyRequests: string;
  showTimestamp: boolean;
  hideSkName?: boolean;
  reasonLabel?: string | null;
}

function EvidenceSection({
  heading,
  emptyMessage,
  rows,
  showTimestamp,
  hideSkName,
}: {
  heading: string;
  emptyMessage: string;
  rows: ModuleDemandQueryRow[];
  showTimestamp: boolean;
  hideSkName: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-spice-text-muted">
          {heading}
        </h4>
        {rows.length > 0 ? (
          <span className="text-[10px] tabular-nums text-spice-text-muted">
            {rows.length}
          </span>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-spice-border/70 px-3 py-2 text-xs text-spice-text-muted">
          {emptyMessage}
        </p>
      ) : (
        <ScrollableRowList itemCount={rows.length}>
          {rows.map((row) => (
            <EvidenceQueryRow
              key={row.id}
              row={row}
              showTimestamp={showTimestamp}
              hideSkName={hideSkName}
            />
          ))}
        </ScrollableRowList>
      )}
    </section>
  );
}

export const ModuleDemandEvidenceList = ({
  questionRows,
  requestRows,
  queriesHeading,
  requestsHeading,
  emptyQueries,
  emptyRequests,
  showTimestamp,
  hideSkName = false,
  reasonLabel,
}: ModuleDemandEvidenceListProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {reasonLabel ? (
        <div className="rounded-md border border-spice-brand-primary/20 bg-spice-brand-primary/5 px-3 py-2 text-xs text-spice-text-medium">
          <span className="font-semibold text-spice-text-primary">
            {t('adminDashboard.suggestedModules.reasonHeading')}:
          </span>{' '}
          {reasonLabel}
        </div>
      ) : null}

      <EvidenceSection
        heading={queriesHeading}
        emptyMessage={emptyQueries}
        rows={questionRows}
        showTimestamp={showTimestamp}
        hideSkName={hideSkName}
      />

      <EvidenceSection
        heading={requestsHeading}
        emptyMessage={emptyRequests}
        rows={requestRows}
        showTimestamp={showTimestamp}
        hideSkName={hideSkName}
      />
    </div>
  );
};
