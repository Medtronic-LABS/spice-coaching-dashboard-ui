import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { EyeIcon } from '@/assets/icon';
import { Button, Card, CircularSpinner, Modal } from '@/components/ui';
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

function CenteredDash() {
  return (
    <span
      className="inline-flex h-8 w-full min-w-[7.5rem] items-center justify-center text-spice-text-medium"
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
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-spice-palette-purpleLt px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-spice-palette-purple">
        {user.role}
      </span>
    </span>
  );
}

function AssignedUsersLoader() {
  return (
    <div
      className="flex min-h-24 flex-col items-center justify-center gap-2 text-sm text-spice-text-muted"
      role="status"
      aria-live="polite"
      aria-label="Loading assignees"
    >
      <CircularSpinner className="h-8 w-8 text-spice-brand-primary" />
      <span>Loading assignees…</span>
    </div>
  );
}

export const ModuleAssignedUsersCell = ({
  moduleId,
  enabled = true,
}: ModuleAssignedUsersCellProps) => {
  const modalTitleId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  /** Remembers empty assignee result after close so View does not reappear. */
  const [knownEmpty, setKnownEmpty] = useState(false);
  const [fetchAssignedUsers, { data, isError, isFetching, isSuccess, reset }] =
    useLazyFetchModuleAssignedUsersQuery();

  const users = useMemo(() => data ?? [], [data]);
  const count = users.length;
  const hasLoaded = isSuccess || isError || data !== undefined;
  const showLoader = modalOpen && (isFetching || !hasLoaded);

  const entries = useMemo(
    () =>
      buildFlatAssignedUserEntries(
        users.map((user) => user.id),
        users,
      ),
    [users],
  );

  useEffect(() => {
    if (!isSuccess || data === undefined) return;
    setKnownEmpty(data.length === 0);
  }, [data, isSuccess]);

  const handleViewClick = useCallback(() => {
    if (!enabled) return;
    reset();
    setModalOpen(true);
    void fetchAssignedUsers(moduleId);
  }, [enabled, fetchAssignedUsers, moduleId, reset]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    reset();
  }, [reset]);

  if (!enabled || (knownEmpty && !modalOpen)) {
    return <CenteredDash />;
  }

  return (
    <>
      {!knownEmpty ? (
        <Button
          className={`${MODULE_LIBRARY_ACTION_BUTTON_CLASS} inline-flex items-center justify-center gap-1.5`}
          aria-label={`View assigned users for module ${moduleId}`}
          onClick={handleViewClick}
        >
          <EyeIcon className="h-3.5 w-3.5" />
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
            {hasLoaded && !isError && !showLoader ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-spice-brand-primary px-1.5 text-xs font-semibold tabular-nums text-white"
                aria-label={`${count} assigned users`}
              >
                {count}
              </span>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border">
            {showLoader ? (
              <AssignedUsersLoader />
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
