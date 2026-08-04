import { useState } from 'react';
import type {
  AssignedGeographicalEntry,
  AssignedIndividualUser,
  AssignedPoSkGroup,
  AssignedUpazilaGroup,
  AssignedUserEntry,
} from '../utils/assignmentDisplay';

interface AssignedUsersSummaryProps {
  entries: AssignedUserEntry[];
  emptyMessage?: string;
}

interface RoleBadgeProps {
  role: 'PO' | 'SK';
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold tracking-wide text-spice-text-muted ring-1 ring-spice-border">
      {label}
    </span>
  );
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`h-4 w-4 text-spice-text-muted transition-transform ${
      expanded ? 'rotate-180' : ''
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
);

function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className="rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-spice-brand-primary ring-1 ring-spice-border">
      {role}
    </span>
  );
}

function IndividualUserCard({ user }: { user: AssignedIndividualUser }) {
  return (
    <div className="rounded-xl bg-spice-bg-surface px-3 py-3 ring-1 ring-spice-border">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-spice-text-primary">
            {user.name}
          </div>
        </div>
        <RoleBadge role={user.role} />
      </div>
    </div>
  );
}

function GeographicalCard({ entry }: { entry: AssignedGeographicalEntry }) {
  const label = entry.name.startsWith('Organization #')
    ? 'Organization'
    : 'Upazila';

  return (
    <div className="rounded-xl bg-spice-bg-surface px-3 py-3 ring-1 ring-spice-border">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-spice-text-primary">
            {entry.name}
          </div>
        </div>
        <TypeBadge label={label} />
      </div>
    </div>
  );
}

function PoSkAssignedGroupCard({ group }: { group: AssignedPoSkGroup }) {
  const [expanded, setExpanded] = useState(false);
  const skCountLabel =
    group.skUsers.length === 1 ? '1 SK' : `${group.skUsers.length} SKs`;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-spice-border">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Hide' : 'Show'} SK users for ${group.poName}`}
        className="flex w-full items-center justify-between gap-3 bg-spice-bg-surface px-3 py-3 text-left transition hover:bg-spice-bg-tint/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RoleBadge role="PO" />
            <span className="truncate text-sm font-semibold text-spice-text-primary">
              {group.poName}
            </span>
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            {skCountLabel}
          </div>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded ? (
        <div className="space-y-2 border-t border-spice-border bg-spice-bg-tint/30 p-2">
          {group.skUsers.length === 0 ? (
            <div className="rounded-lg bg-spice-bg-surface px-3 py-2 text-xs text-spice-text-muted ring-1 ring-spice-border">
              No SK users under this PO.
            </div>
          ) : (
            group.skUsers.map((sk) => (
              <div
                key={sk.userId}
                className="rounded-lg bg-spice-bg-surface px-3 py-2.5 ring-1 ring-spice-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-spice-text-primary">
                    {sk.name}
                  </span>
                  <RoleBadge role="SK" />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function UpazilaGroupCard({ upazila }: { upazila: AssignedUpazilaGroup }) {
  const [expanded, setExpanded] = useState(false);
  const skCountLabel =
    upazila.skUsers.length === 1 ? '1 SK' : `${upazila.skUsers.length} SKs`;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-spice-border">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Hide' : 'Show'} SK users for ${upazila.upazilaName}`}
        className="flex w-full items-center justify-between gap-3 bg-spice-bg-surface px-3 py-3 text-left transition hover:bg-spice-bg-tint/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge label="Upazila" />
            <span className="truncate text-sm font-semibold text-spice-text-primary">
              {upazila.upazilaName}
            </span>
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            {skCountLabel}
          </div>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded ? (
        <div className="space-y-2 border-t border-spice-border bg-spice-bg-tint/30 p-2">
          {upazila.skUsers.length === 0 ? (
            <div className="rounded-lg bg-spice-bg-surface px-3 py-2 text-xs text-spice-text-muted ring-1 ring-spice-border">
              No SK users under this upazila.
            </div>
          ) : (
            upazila.skUsers.map((sk) => (
              <div
                key={sk.userId}
                className="rounded-lg bg-spice-bg-surface px-3 py-2.5 ring-1 ring-spice-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-spice-text-primary">
                    {sk.name}
                  </span>
                  <RoleBadge role="SK" />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export const AssignedUsersSummary = ({
  entries,
  emptyMessage = 'No users assigned.',
}: AssignedUsersSummaryProps) => {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-spice-bg-surface px-3 py-6 text-center text-xs text-spice-text-muted ring-1 ring-spice-border">
        {emptyMessage}
      </div>
    );
  }

  const organizationEntries = entries.filter(
    (entry): entry is AssignedGeographicalEntry =>
      entry.kind === 'geographical' && entry.name.startsWith('Organization #'),
  );
  const otherGeographicalEntries = entries.filter(
    (entry): entry is AssignedGeographicalEntry =>
      entry.kind === 'geographical' && !entry.name.startsWith('Organization #'),
  );
  const nonGeographicalEntries = entries.filter(
    (entry) => entry.kind !== 'geographical',
  );

  return (
    <div className="space-y-2">
      {organizationEntries.map((entry) => (
        <GeographicalCard key={entry.name} entry={entry} />
      ))}
      {otherGeographicalEntries.map((entry) => (
        <GeographicalCard key={entry.name} entry={entry} />
      ))}

      {nonGeographicalEntries.map((entry) => {
        switch (entry.kind) {
          case 'po_sk':
            return <PoSkAssignedGroupCard key={entry.poId} group={entry} />;
          case 'upazila':
            return <UpazilaGroupCard key={entry.upazilaName} upazila={entry} />;
          case 'individual':
            return <IndividualUserCard key={entry.userId} user={entry} />;
          default: {
            const exhaustiveCheck: never = entry;
            return exhaustiveCheck;
          }
        }
      })}
    </div>
  );
};
