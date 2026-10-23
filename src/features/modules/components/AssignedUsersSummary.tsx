import type {
  AssignedGeographicalEntry,
  AssignedIndividualUser,
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
    <span className="rounded-full bg-spice-bg-tint px-2 py-0.5 text-xs font-semibold tracking-wide text-spice-text-muted ring-1 ring-spice-border">
      {label}
    </span>
  );
}

function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className="rounded-full bg-spice-bg-tint px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-spice-brand-primary ring-1 ring-spice-border">
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

/** Flatten grouped PO/SK or upazila entries into a simple user list. */
function flattenToIndividualUsers(
  entries: AssignedUserEntry[],
): AssignedIndividualUser[] {
  const users: AssignedIndividualUser[] = [];
  const seen = new Set<number>();

  const push = (user: AssignedIndividualUser) => {
    if (seen.has(user.userId)) return;
    seen.add(user.userId);
    users.push(user);
  };

  for (const entry of entries) {
    switch (entry.kind) {
      case 'individual':
        push(entry);
        break;
      case 'po_sk':
        push({
          kind: 'individual',
          userId: entry.poId,
          role: 'PO',
          name: entry.poName,
        });
        for (const sk of entry.skUsers) {
          push({
            kind: 'individual',
            userId: sk.userId,
            role: 'SK',
            name: sk.name,
          });
        }
        break;
      case 'upazila':
        for (const sk of entry.skUsers) {
          push({
            kind: 'individual',
            userId: sk.userId,
            role: 'SK',
            name: sk.name,
          });
        }
        break;
      case 'geographical':
        break;
      default: {
        const exhaustiveCheck: never = entry;
        return exhaustiveCheck;
      }
    }
  }

  return users;
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
  const individualUsers = flattenToIndividualUsers(entries);

  if (
    organizationEntries.length === 0 &&
    otherGeographicalEntries.length === 0 &&
    individualUsers.length === 0
  ) {
    return (
      <div className="rounded-xl bg-spice-bg-surface px-3 py-6 text-center text-xs text-spice-text-muted ring-1 ring-spice-border">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {organizationEntries.map((entry) => (
        <GeographicalCard key={entry.name} entry={entry} />
      ))}
      {otherGeographicalEntries.map((entry) => (
        <GeographicalCard key={entry.name} entry={entry} />
      ))}
      {individualUsers.map((user) => (
        <IndividualUserCard key={user.userId} user={user} />
      ))}
    </div>
  );
};
