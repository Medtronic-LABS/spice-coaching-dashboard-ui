import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardIcon } from '@/assets/icon';
import { Badge, Button, Card, Loader, TruncatedText } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  MODULE_ASSIGNMENT_DURATION_KEY,
  useFetchConfigByKeyQuery,
} from '@/features/admin-configs/api/adminConfigsApi';
import { parseConfigDurationDays } from '@/features/admin-configs/utils/configDuration';
import { useFetchDocumentAssignedUsersQuery } from '@/features/ingest/api/adminDocumentAssignmentApi';
import {
  useFetchAdminUsersQuery,
  useFetchModuleAssignedUsersQuery,
} from '@/features/modules/api/adminAssignmentApi';
import { AssignedUsersSummary } from '@/features/modules/components/AssignedUsersSummary';
import {
  buildFlatAssignedUserEntries,
  countAssignedUsers,
} from '@/features/modules/utils/assignmentDisplay';
import type { AssignedUserEntry } from '@/features/modules/utils/assignmentDisplay';
import {
  formatAssignmentDeadlineLabel,
  getAssignmentDeadlineDate,
} from '@/features/modules/utils/assignmentDeadline';
import {
  resolveAssignmentSuccessEntityId,
  resolveAssignmentSuccessEntityKind,
  resolveAssignmentSuccessEntityName,
  type AssignmentSuccessEntityKind,
  type AssignmentSuccessLocationState,
} from '@/features/modules/types/assignmentSuccessNavigation.types';

function entityCopy(
  entityKind: AssignmentSuccessEntityKind,
  t: (key: string) => string,
): {
  title: string;
  subtitle: string;
  entityLabel: string;
  entityMeta: string;
  backToLibrary: string;
  assignMore: string;
} {
  switch (entityKind) {
    case 'document':
      return {
        title: t('moduleLibrary.assigned.titleDocument'),
        subtitle: t('moduleLibrary.assigned.subtitleDocument'),
        entityLabel: t('moduleLibrary.assigned.summary.document'),
        entityMeta: t('moduleLibrary.assigned.summary.documentMeta'),
        backToLibrary: t('moduleLibrary.assigned.next.backToKnowledgeLibrary'),
        assignMore: t('moduleLibrary.assigned.next.assignMoreDocument'),
      };
    case 'video':
      return {
        title: t('moduleLibrary.assigned.titleVideo'),
        subtitle: t('moduleLibrary.assigned.subtitleVideo'),
        entityLabel: t('moduleLibrary.assigned.summary.video'),
        entityMeta: t('moduleLibrary.assigned.summary.videoMeta'),
        backToLibrary: t('moduleLibrary.assigned.next.backToVideoLibrary'),
        assignMore: t('moduleLibrary.assigned.next.assignMoreVideo'),
      };
    default:
      return {
        title: t('moduleLibrary.assigned.title'),
        subtitle: t('moduleLibrary.assigned.subtitle'),
        entityLabel: t('moduleLibrary.assigned.summary.module'),
        entityMeta: t('moduleLibrary.assigned.summary.moduleMeta'),
        backToLibrary: t('moduleLibrary.assigned.next.backToLibrary'),
        assignMore: t('moduleLibrary.assigned.next.assignMore'),
      };
  }
}

function libraryPathForEntity(entityKind: AssignmentSuccessEntityKind): string {
  switch (entityKind) {
    case 'document':
      return paths.uploadKnowledge;
    case 'video':
      return paths.videoUpload;
    default:
      return paths.moduleLibrary;
  }
}

export const ModuleAssignedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as AssignmentSuccessLocationState;

  const entityKind = resolveAssignmentSuccessEntityKind(state);
  const entityId = resolveAssignmentSuccessEntityId(state);
  const entityName = resolveAssignmentSuccessEntityName(
    state,
    t('moduleLibrary.assigned.sample.module'),
  );
  const copy = entityCopy(entityKind, t);
  const isModuleAssignment = entityKind === 'module';

  const [showAllAssigned, setShowAllAssigned] = useState(false);

  const {
    data: assignmentDurationConfig,
    isLoading: isLoadingDeadlineConfig,
    isFetching: isFetchingDeadlineConfig,
  } = useFetchConfigByKeyQuery(MODULE_ASSIGNMENT_DURATION_KEY, {
    skip: !isModuleAssignment,
  });

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
    isModuleAssignment && (isLoadingDeadlineConfig || isFetchingDeadlineConfig);

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

  const { data: moduleAssignedUsers, isLoading: isLoadingModuleAssignments } =
    useFetchModuleAssignedUsersQuery(entityId ?? '', {
      skip: !entityId || !showAllAssigned || !isModuleAssignment,
    });

  const {
    data: documentAssignedUsers,
    isLoading: isLoadingDocumentAssignments,
  } = useFetchDocumentAssignedUsersQuery(entityId ?? '', {
    skip: !entityId || !showAllAssigned || isModuleAssignment,
  });

  const { data: adminUsers, isLoading: isLoadingUsers } =
    useFetchAdminUsersQuery(undefined, {
      skip: !entityId || !showAllAssigned || !isModuleAssignment,
    });

  const derivedAssignedUsers = useMemo<AssignedUserEntry[]>(() => {
    if (!showAllAssigned || !entityId) {
      return state.assignedUsers ?? [];
    }

    if (isModuleAssignment) {
      const knownUsers = [
        ...(moduleAssignedUsers ?? []),
        ...(adminUsers ?? []),
      ];
      return buildFlatAssignedUserEntries(
        (moduleAssignedUsers ?? []).map((user) => user.id),
        knownUsers,
      );
    }

    return buildFlatAssignedUserEntries(
      (documentAssignedUsers ?? []).map((user) => user.id),
      documentAssignedUsers ?? [],
    );
  }, [
    adminUsers,
    documentAssignedUsers,
    entityId,
    isModuleAssignment,
    moduleAssignedUsers,
    showAllAssigned,
    state.assignedUsers,
  ]);

  const assignedUsers = derivedAssignedUsers;
  const removedUsers = state.removedUsers ?? [];
  const assignedCount =
    showAllAssigned && entityId
      ? countAssignedUsers(derivedAssignedUsers)
      : (state.assignedCount ?? countAssignedUsers(derivedAssignedUsers));

  const assignedUsersLabel = (() => {
    if (
      state.assignmentType === 'geographical' ||
      state.assignmentType === 'group'
    ) {
      return state.assignmentType === 'group'
        ? t('moduleLibrary.assigned.summary.assignedToOrganization')
        : t('moduleLibrary.assigned.summary.assignedToUpazila');
    }

    return t('moduleLibrary.assigned.summary.assignedTo');
  })();

  const isLoadingAssignments =
    isLoadingModuleAssignments ||
    isLoadingDocumentAssignments ||
    isLoadingUsers;

  const handleAssignMore = () => {
    if (!entityId) return;

    if (entityKind === 'module') {
      navigate(paths.moduleLibrary, {
        state: {
          tab: 'published',
          openAssignment: { moduleId: entityId, moduleTitle: entityName },
        },
      });
      return;
    }

    navigate(libraryPathForEntity(entityKind), {
      state: {
        openDocumentAssignment: {
          sourceDocumentId: entityId,
          title: entityName,
          noun: entityKind === 'video' ? 'video' : 'document',
        },
      },
    });
  };

  return (
    <div className="flex h-[85vh] items-center justify-center px-4 py-6">
      <Loader
        open={showAllAssigned && Boolean(entityId) && isLoadingAssignments}
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
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">{copy.subtitle}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 text-left">
            <div
              className={
                isModuleAssignment
                  ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                  : 'grid grid-cols-1 gap-3'
              }
            >
              <div className="rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border/70">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {copy.entityLabel}
                </div>
                <div className="mt-1 min-w-0 text-sm font-semibold text-spice-text-primary">
                  <TruncatedText
                    text={entityName}
                    className="font-semibold text-spice-text-primary"
                  />
                </div>
                <div className="text-xs text-spice-text-muted">
                  {copy.entityMeta}
                </div>
              </div>
              {isModuleAssignment ? (
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
              ) : null}
            </div>

            <div className="rounded-xl bg-spice-bg-tint p-3 ring-1 ring-spice-border/70">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {assignedUsersLabel}
                </div>
                <div className="flex items-center gap-2">
                  {entityId && !showAllAssigned ? (
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
            {entityId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleAssignMore}
                className="flex-1"
              >
                {copy.assignMore}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(libraryPathForEntity(entityKind))}
              className="flex-1"
            >
              {copy.backToLibrary}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
