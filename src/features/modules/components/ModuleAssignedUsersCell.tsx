import { useCallback, useId, useMemo, useState } from 'react';
import { Button, Card, Modal } from '@/components/ui';
import { MODULE_LIBRARY_ACTION_BUTTON_CLASS } from '@/features/modules/constants/moduleLibraryActionStyles';
import { useLazyFetchModuleAssignedUsersQuery } from '@/features/modules/api/adminAssignmentApi';
import {
  buildFlatAssignedUserEntries,
  type AssignedIndividualUser,
} from '@/features/modules/utils/assignmentDisplay';

export interface ModuleAssignedUsersCellProps {
  moduleId: string;
  /** When false, renders a centered dash (drafts, FAQ-only, etc.). */
  enabled?: boolean;
}

const SKELETON_CHIP_WIDTHS = ['9.5rem', '11rem', '8.5rem', '10rem'] as const;

function CenteredDash() {
  return (
    <span
      className="inline-flex h-8 w-full min-w-[7.5rem] items-center justify-center text-xs text-spice-text-medium"
      aria-hidden="true"
    >
      —
    </span>
  );
}

/** Compact chip: name + nested role pill. Not full-width so several can wrap. */
function AssignedUserChip({ user }: { user: AssignedIndividualUser }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-spice-bg-surface py-1.5 pl-3 pr-1.5 text-xs font-semibold text-spice-text-primary shadow-sm ring-1 ring-spice-border">
      <span className="min-w-0 truncate">{user.name}</span>
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-spice-palette-purpleLt px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-spice-palette-purple">
        {user.role}
      </span>
    </span>
  );
}

function AssignedUsersSkeleton() {
  return (
    <div
      className="flex flex-wrap gap-2.5"
      aria-busy="true"
      aria-label="Loading assignees"
    >
      {SKELETON_CHIP_WIDTHS.map((width) => (
        <span
          key={width}
          className="inline-flex h-8 animate-pulse items-center gap-2 rounded-full bg-spice-bg-surface py-1.5 pl-3 pr-1.5 ring-1 ring-spice-border"
          style={{ width }}
        >
          <span className="h-3 flex-1 rounded bg-spice-border" />
          <span className="h-5 w-8 shrink-0 rounded-full bg-spice-palette-purpleLt" />
        </span>
      ))}
    </div>
  );
}

export const ModuleAssignedUsersCell = ({
  moduleId,
  enabled = true,
}: ModuleAssignedUsersCellProps) => {
  const modalTitleId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchAssignedUsers, { data, isError, isSuccess }] =
    useLazyFetchModuleAssignedUsersQuery();

  const users = useMemo(() => data ?? [], [data]);
  const count = users.length;
  const hasLoaded = isSuccess || isError || data !== undefined;
  const isEmpty = hasLoaded && !isError && count === 0;
  const showSkeleton = modalOpen && !hasLoaded;

  const entries = useMemo(
    () =>
      buildFlatAssignedUserEntries(
        users.map((user) => user.id),
        users,
      ),
    [users],
  );

  const handleViewClick = useCallback(() => {
    if (!enabled) return;
    setModalOpen(true);
    void fetchAssignedUsers(moduleId);
  }, [enabled, fetchAssignedUsers, moduleId]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  if (!enabled || (isEmpty && !modalOpen)) {
    return <CenteredDash />;
  }

  return (
    <>
      {!isEmpty ? (
        <Button
          className={MODULE_LIBRARY_ACTION_BUTTON_CLASS}
          aria-label={`View assigned users for module ${moduleId}`}
          onClick={handleViewClick}
        >
          View
        </Button>
      ) : null}

      <Modal
        open={modalOpen}
        labelledBy={modalTitleId}
        onClose={handleModalClose}
        contentClassName="max-w-md"
      >
        <Card
          variant="elevated"
          className="w-full space-y-4 border-spice-border p-4 pr-12 shadow-lg sm:p-5 sm:pr-14"
        >
          <div className="flex min-w-0 items-center gap-2">
            <h2
              id={modalTitleId}
              className="text-base font-semibold text-spice-text-primary"
            >
              Assigned users
            </h2>
            {hasLoaded && !isError && !showSkeleton ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-spice-brand-primary px-1.5 text-[11px] font-semibold tabular-nums text-white"
                aria-label={`${count} assigned users`}
              >
                {count}
              </span>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border">
            {showSkeleton ? (
              <AssignedUsersSkeleton />
            ) : isError ? (
              <div className="flex h-24 items-center justify-center text-xs text-spice-semantic-error">
                Failed to load assignees.
              </div>
            ) : entries.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-xs text-spice-text-medium">
                —
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {entries.map((user) => (
                  <AssignedUserChip key={user.userId} user={user} />
                ))}
              </div>
            )}
          </div>
        </Card>
      </Modal>
    </>
  );
};
