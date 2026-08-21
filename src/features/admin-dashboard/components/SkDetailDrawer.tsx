import { skipToken } from '@reduxjs/toolkit/query/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from '@/assets/icon';
import { Drawer, EmptyState } from '@/components/ui';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { useFetchTeamMemberQuestionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import type {
  DashboardGeographyFilters,
  TeamActivityMember,
  TeamMemberModuleActivity,
} from '@/features/admin-dashboard/types/dashboard.types';
import { buildTeamMemberQuestionsQueryArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { resolveModuleCompletionTone } from '@/features/admin-dashboard/utils/moduleCompletionTones';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import {
  latestModuleCompletedAt,
  rankTopQueries,
  toRelativeActivity,
  type RelativeActivity,
} from '@/features/admin-dashboard/utils/skDetailDrawer';
import {
  memberInitials,
  memberModuleStats,
} from '@/features/admin-dashboard/utils/teamActivity';
import { cn } from '@/utils';

const DRAWER_TITLE_ID = 'sk-detail-drawer-title';
const DRAWER_DESCRIPTION_ID = 'sk-detail-drawer-description';

interface SkDetailDrawerProps {
  member: TeamActivityMember | null;
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  onClose: () => void;
}

function formatRelativeActivity(
  activity: RelativeActivity,
  neverLabel: string,
  todayLabel: string,
  yesterdayLabel: string,
  daysAgo: (count: number) => string,
): string {
  if (activity.kind === 'never') return neverLabel;
  if (activity.kind === 'today') return todayLabel;
  if (activity.kind === 'yesterday') return yesterdayLabel;
  return daysAgo(activity.count);
}

function ModuleStatusRow({ module }: { module: TeamMemberModuleActivity }) {
  const { t } = useTranslation();
  const completed = module.completed_in_range || Boolean(module.completed_at);
  const title = resolveDisplayText(module.title);

  return (
    <li className="flex items-center gap-3 border-b border-spice-border/70 py-3 last:border-b-0">
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          completed
            ? 'border-spice-palette-green bg-spice-palette-green'
            : 'border-spice-border-mid bg-spice-bg-surface',
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 text-sm text-spice-text-primary">
        {title}
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
          completed
            ? 'bg-spice-palette-greenLt text-spice-palette-green'
            : 'bg-spice-palette-blueLt text-spice-palette-blue',
        )}
      >
        {completed
          ? t('adminDashboard.skDrawer.completed')
          : t('adminDashboard.skDrawer.pending')}
      </span>
    </li>
  );
}

export const SkDetailDrawer = ({
  member,
  fromDate,
  toDate,
  geography,
  onClose,
}: SkDetailDrawerProps) => {
  const { t } = useTranslation();
  const open = member != null;
  const questionsQuery = useFetchTeamMemberQuestionsQuery(
    member
      ? buildTeamMemberQuestionsQueryArgs(
          fromDate,
          toDate,
          geography,
          member.user_id,
        )
      : skipToken,
  );
  const questionsUi = resolveDashboardQueryUiState(questionsQuery);
  const modules = member
    ? memberModuleStats(member)
    : { completed: 0, total: 0 };
  const moduleTone = resolveModuleCompletionTone(
    modules.total > 0 ? (modules.completed / modules.total) * 100 : 0,
  );
  const formatActivity = (iso: string | null | undefined) =>
    formatRelativeActivity(
      toRelativeActivity(iso),
      t('adminDashboard.skDrawer.never'),
      t('adminDashboard.skDrawer.today'),
      t('adminDashboard.skDrawer.yesterday'),
      (count) => t('adminDashboard.skDrawer.daysAgo', { count }),
    );
  const lastChat = formatActivity(member?.last_chat_at);
  const lastModule = formatActivity(
    latestModuleCompletedAt(member?.assigned_modules ?? []),
  );
  const topQueries = useMemo(
    () => rankTopQueries(questionsQuery.data?.questions ?? []),
    [questionsQuery.data?.questions],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      labelledBy={DRAWER_TITLE_ID}
      describedBy={DRAWER_DESCRIPTION_ID}
      panelClassName="max-w-md bg-spice-bg-dashboard"
    >
      {member ? (
        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 bg-spiceSkDrawer px-4 pb-12 pt-4 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={t('adminDashboard.skDrawer.close')}
              >
                <ArrowRightIcon className="h-5 w-5 rotate-180" />
              </button>
              <h2 id={DRAWER_TITLE_ID} className="text-sm font-semibold">
                {t('adminDashboard.skDrawer.title')}
              </h2>
            </div>
            <p id={DRAWER_DESCRIPTION_ID} className="sr-only">
              {t('adminDashboard.skDrawer.description', { name: member.name })}
            </p>
            <div className="mt-6 flex items-center gap-3 px-1">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white">
                {memberInitials(member.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold leading-tight">
                  {member.name}
                </p>
              </div>
            </div>
          </header>

          <div className="spice-thin-scroll -mt-8 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-spice-bg-surface px-4 py-3 text-center shadow-spiceCard">
                <p
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    moduleTone.textClassName,
                  )}
                >
                  {modules.completed}/{modules.total}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                  {t('adminDashboard.skDrawer.modulesLabel')}
                </p>
              </div>
              <div className="rounded-2xl bg-spice-bg-surface px-4 py-3 text-center shadow-spiceCard">
                <p className="text-lg font-bold tabular-nums text-spice-palette-purple">
                  {member.chatbot_query_count}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                  {t('adminDashboard.skDrawer.queriesLabel')}
                </p>
              </div>
            </div>

            <section className="rounded-2xl bg-spice-bg-surface px-4 shadow-spiceCard">
              <h3 className="pt-4 text-base font-bold text-spice-text-primary">
                {t('adminDashboard.skDrawer.modulesHeading')}
              </h3>
              {member.assigned_modules.length === 0 ? (
                <p className="py-4 text-sm text-spice-text-muted">
                  {t('adminDashboard.skDrawer.emptyModules')}
                </p>
              ) : (
                <div className="relative">
                  <ul
                    className="spice-thin-scroll max-h-[28rem] overflow-y-auto overscroll-contain pb-1 pr-1.5"
                    aria-label={t('adminDashboard.skDrawer.modulesHeading')}
                  >
                    {member.assigned_modules.map((assigned) => (
                      <ModuleStatusRow
                        key={assigned.module_id}
                        module={assigned}
                      />
                    ))}
                  </ul>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-7 rounded-b-2xl bg-gradient-to-t from-spice-bg-surface to-transparent"
                    aria-hidden
                  />
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-2xl bg-spice-bg-surface p-4 shadow-spiceCard">
              <h3 className="text-base font-bold text-spice-text-primary">
                {t('adminDashboard.skDrawer.activityHeading')}
              </h3>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-spice-text-muted">
                  {t('adminDashboard.skDrawer.lastChatbotUse')}
                </span>
                <span className="font-semibold text-spice-text-primary">
                  {lastChat}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-spice-text-muted">
                  {t('adminDashboard.skDrawer.lastModule')}
                </span>
                <span className="font-semibold text-spice-text-primary">
                  {lastModule}
                </span>
              </div>
            </section>

            <section className="rounded-2xl bg-spice-bg-surface p-4 shadow-spiceCard">
              <h3 className="text-base font-bold text-spice-text-primary">
                {t('adminDashboard.skDrawer.topQueriesHeading')}
              </h3>
              {questionsUi.showLoading ? (
                <div className="py-3">
                  <DashboardListSkeleton rows={3} />
                </div>
              ) : questionsUi.showError ? (
                <div className="py-3">
                  <DashboardWidgetErrorState
                    compact
                    onRetry={() => void questionsQuery.refetch()}
                  />
                </div>
              ) : topQueries.length === 0 ? (
                <EmptyState
                  title={t('adminDashboard.skDrawer.emptyQueriesTitle')}
                  description={t(
                    'adminDashboard.skDrawer.emptyQueriesDescription',
                  )}
                />
              ) : (
                <ol className="mt-2 divide-y divide-spice-border/70">
                  {topQueries.map((query, index) => (
                    <li
                      key={`${query.question}-${query.last_asked_at}`}
                      className="flex items-center gap-4 py-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spice-palette-pinkLt text-xs font-semibold text-spice-palette-pink">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-spice-text-primary">
                        {query.question}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-spice-palette-purple">
                        {query.occurrence_count}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
};
