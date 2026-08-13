import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardIcon } from '@/assets/icon';
import { Badge, Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  MODULE_ASSIGNMENT_DURATION_KEY,
  useFetchConfigByKeyQuery,
} from '@/features/admin-configs/api/adminConfigsApi';
import { parseConfigDurationDays } from '@/features/admin-configs/utils/configDuration';
import {
  useFetchAdminUsersQuery,
  useFetchModuleAssignedUsersQuery,
  type AssignmentSummaryType,
} from '@/features/modules/api/adminAssignmentApi';
import { AssignedUsersSummary } from '@/features/modules/components/AssignedUsersSummary';
import type { AssignedUserEntry } from '@/features/modules/utils/assignmentDisplay';
import {
  buildEntriesFromAssignedUsers,
  countAssignedUsers,
} from '@/features/modules/utils/assignmentDisplay';
import {
  formatAssignmentDeadlineLabel,
  getAssignmentDeadlineDate,
} from '@/features/modules/utils/assignmentDeadline';

type ModuleAssignedState = {
  moduleId?: string;
  moduleName?: string;
  assignedAt?: string;
  assignedCount?: number;
  assignedUsers?: AssignedUserEntry[];
  removedUsers?: AssignedUserEntry[];
  /** Includes legacy summary labels used by older navigation state. */
  assignmentType?: AssignmentSummaryType | 'individual' | 'group';
};

export const ModuleAssignedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ModuleAssignedState;

  const moduleId = state.moduleId;
  const moduleName =
    state.moduleName ?? t('moduleLibrary.assigned.sample.module');
  const [showAllAssigned, setShowAllAssigned] = useState(false);

  const {
    data: assignmentDurationConfig,
    isLoading: isLoadingDeadlineConfig,
    isFetching: isFetchingDeadlineConfig,
  } = useFetchConfigByKeyQuery(MODULE_ASSIGNMENT_DURATION_KEY);

  const assignmentDate = useMemo(() => {
    if (!state.assignedAt) {
      return new Date();
    }

    const parsedDate = new Date(state.assignedAt);
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [state.assignedAt]);

  const assignmentDurationDays = useMemo(
    () => parseConfigDurationDays(assignmentDurationConfig?.value_json),
    [assignmentDurationConfig],
  );

  const deadlineDate = useMemo(
    () =>
      getAssignmentDeadlineDate(
        assignmentDate,
        assignmentDurationConfig?.value_json,
      ),
    [assignmentDate, assignmentDurationConfig],
  );

  const isReattemptWindowLoading =
    isLoadingDeadlineConfig || isFetchingDeadlineConfig;

  const quizReattemptUntilLabel = useMemo(() => {
    if (isReattemptWindowLoading) {
      return t(
        'moduleLibrary.assigned.summary.quizReattemptAllowedUntilLoading',
      );
    }

    if (!deadlineDate) {
      return t(
        'moduleLibrary.assigned.summary.quizReattemptAllowedUntilUnavailable',
      );
    }

    return formatAssignmentDeadlineLabel(deadlineDate);
  }, [deadlineDate, isReattemptWindowLoading, t]);

  const quizReattemptAllowedMeta = useMemo(() => {
    if (isReattemptWindowLoading) {
      return t(
        'moduleLibrary.assigned.summary.quizReattemptAllowedMetaLoading',
      );
    }

    if (assignmentDurationDays === null) {
      return t(
        'moduleLibrary.assigned.summary.quizReattemptAllowedMetaUnavailable',
      );
    }

    return t('moduleLibrary.assigned.summary.quizReattemptAllowedMeta', {
      count: assignmentDurationDays,
    });
  }, [assignmentDurationDays, isReattemptWindowLoading, t]);

  const {
    data: moduleAssignedUsers,
    isLoading: isLoadingAssignments,
    isFetching: isFetchingAssignments,
  } = useFetchModuleAssignedUsersQuery(moduleId ?? '', {
    skip: !moduleId || !showAllAssigned,
  });

  const {
    data: adminUsers,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useFetchAdminUsersQuery(undefined, {
    skip: !moduleId || !showAllAssigned,
  });

  const derivedAssignedUsers = useMemo<AssignedUserEntry[]>(() => {
    if (!showAllAssigned || !moduleId) {
      return state.assignedUsers ?? [];
    }

    return buildEntriesFromAssignedUsers(
      moduleAssignedUsers ?? [],
      adminUsers ?? [],
    );
  }, [
    adminUsers,
    moduleAssignedUsers,
    moduleId,
    showAllAssigned,
    state.assignedUsers,
  ]);

  const assignedUsers = derivedAssignedUsers;
  const removedUsers = state.removedUsers ?? [];
  const assignedCount =
    showAllAssigned && moduleId
      ? countAssignedUsers(derivedAssignedUsers)
      : (state.assignedCount ?? countAssignedUsers(derivedAssignedUsers));

  const assignedUsersLabel = (() => {
    if (showAllAssigned) {
      return t('moduleLibrary.assigned.summary.assignedUsers');
    }

    switch (state.assignmentType) {
      case 'individual':
        return t('moduleLibrary.assigned.summary.assignedToIndividual');
      case 'po_sk':
        return t('moduleLibrary.assigned.summary.assignedToPoSk');
      case 'po':
        return t('moduleLibrary.assigned.summary.assignedToPo');
      case 'sk':
        return t('moduleLibrary.assigned.summary.assignedToIndividual');
      case 'geographical':
        return t('moduleLibrary.assigned.summary.assignedToUpazila');
      case 'group':
        return t('moduleLibrary.assigned.summary.assignedToOrganization');
      case undefined:
        return t('moduleLibrary.assigned.summary.newlyAssignedUser');
      default: {
        const exhaustiveCheck: never = state.assignmentType;
        return exhaustiveCheck;
      }
    }
  })();

  return (
    <div className="flex h-[85vh] items-center justify-center px-4 py-6">
      <Loader
        open={
          showAllAssigned &&
          Boolean(moduleId) &&
          (isLoadingAssignments ||
            isFetchingAssignments ||
            isLoadingUsers ||
            isFetchingUsers)
        }
        label={t('moduleLibrary.assigned.summary.loadingAssignedUsers')}
      />
      <Card
        variant="elevated"
        className="flex w-full max-w-xl max-h-[90dvh] flex-col overflow-hidden p-2"
      >
        <div className="shrink-0 border-b border-spice-border/70 bg-spice-bg-tint/30 px-6 py-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-spice-bg-surface ring-1 ring-spice-border">
            <ClipboardIcon className="h-5 w-5 text-spice-brand-primary" />
          </div>
          <Badge className="mt-3 bg-spice-bg-surface text-spice-brand-primary ring-1 ring-spice-border">
            {t('moduleLibrary.assigned.badge')}
          </Badge>
          <h1 className="mt-2 text-lg font-semibold text-spice-text-primary sm:text-xl">
            {t('moduleLibrary.assigned.title')}
          </h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 text-left">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border/70">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {t('moduleLibrary.assigned.summary.module')}
                </div>
                <div className="mt-1 text-sm font-semibold text-spice-text-primary">
                  {moduleName}
                </div>
                <div className="text-xs text-spice-text-muted">
                  {t('moduleLibrary.assigned.summary.moduleMeta')}
                </div>
              </div>
              <div className="rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border/70">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {t('moduleLibrary.assigned.summary.quizReattemptAllowed')}
                </div>
                <div className="mt-1 text-sm font-semibold text-spice-text-primary">
                  {quizReattemptUntilLabel}
                </div>
                <div className="text-xs text-spice-text-muted">
                  {quizReattemptAllowedMeta}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border/70">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {assignedUsersLabel}
                </div>
                <div className="flex items-center gap-2">
                  {moduleId && !showAllAssigned ? (
                    <button
                      type="button"
                      onClick={() => setShowAllAssigned(true)}
                      className="rounded-full bg-spice-bg-surface px-2.5 py-1 text-[10px] font-semibold text-spice-brand-primary ring-1 ring-spice-border transition hover:bg-spice-bg-tint"
                    >
                      {t('moduleLibrary.assigned.summary.showAll')}
                    </button>
                  ) : null}
                  <div className="text-[10px] font-semibold text-spice-text-muted">
                    {assignedCount}
                  </div>
                </div>
              </div>
              <div className="mt-2 max-h-36 overflow-y-auto pr-1 sm:max-h-40">
                <AssignedUsersSummary entries={assignedUsers} />
              </div>
            </div>

            {removedUsers.length > 0 ? (
              <div className="rounded-xl bg-spice-semantic-errorBg/40 p-3 ring-1 ring-spice-border/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                    {t('moduleLibrary.assigned.summary.revoked')}
                  </div>
                  <div className="text-[10px] font-semibold text-spice-text-muted">
                    {countAssignedUsers(removedUsers)}
                  </div>
                </div>
                <div className="mt-2 max-h-36 overflow-y-auto pr-1 sm:max-h-40">
                  <AssignedUsersSummary
                    entries={removedUsers}
                    emptyMessage={t(
                      'moduleLibrary.assigned.summary.noUsersRevoked',
                    )}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-spice-border bg-spice-bg-surface px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            {moduleId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate(paths.moduleLibrary, {
                    state: {
                      tab: 'published',
                      openAssignment: { moduleId, moduleTitle: moduleName },
                    },
                  })
                }
                className="flex-1"
              >
                {t('moduleLibrary.assigned.next.assignMore')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(paths.moduleLibrary)}
              className="flex-1"
            >
              {t('moduleLibrary.assigned.next.backToLibrary')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
