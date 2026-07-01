import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import type { AssignmentType } from '@/features/module-library/api/adminAssignmentApi';

type ModuleAssignedState = {
  moduleId?: string;
  moduleName?: string;
  deadlineLabel?: string;
  assignedCount?: number;
  assignedNames?: string[];
  assignmentType?: AssignmentType;
};

const assignedToLabelKey: Record<AssignmentType, string> = {
  individual: 'moduleLibrary.assigned.summary.assignedToIndividual',
  po_sk: 'moduleLibrary.assigned.summary.assignedToPoSk',
  geographical: 'moduleLibrary.assigned.summary.assignedToUpazila',
  group: 'moduleLibrary.assigned.summary.assignedToOrganization',
};

const ClipboardIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="text-spice-brand-primary"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 2h6v4H9V2Z" />
  </svg>
);

export const ModuleAssignedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ModuleAssignedState;

  const assignmentType = state.assignmentType ?? 'individual';
  const showMoreCount =
    assignmentType === 'individual' || assignmentType === 'po_sk';
  const moduleId = state.moduleId;
  const moduleName =
    state.moduleName ?? t('moduleLibrary.assigned.sample.module');
  const deadlineLabel =
    state.deadlineLabel ?? t('moduleLibrary.assigned.sample.deadline');
  const assignedCount = state.assignedCount ?? 8;
  const assignedNames = state.assignedNames ?? [
    'Fatema Jannat',
    'Momotaj Begum',
    'Nasrin Khatun',
    'Hosneara Khatun',
  ];
  const assignedToLabel = t(assignedToLabelKey[assignmentType]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card variant="elevated" className="w-full max-w-xl p-0">
        <div className="px-8 pb-7 pt-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-spice-bg-tint ring-1 ring-spice-border">
            <ClipboardIcon />
          </div>
          <Badge className="mt-4 bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border">
            {t('moduleLibrary.assigned.badge')}
          </Badge>
          <h1 className="mt-3 text-xl font-semibold text-spice-text-primary">
            {t('moduleLibrary.assigned.title')}
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            {t('moduleLibrary.assigned.subtitle')}
          </p>

          <div className="mt-6 grid gap-3 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-spice-bg-tint p-4 ring-1 ring-spice-border/70">
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
              <div className="rounded-xl bg-spice-bg-tint p-4 ring-1 ring-spice-border/70">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  {t('moduleLibrary.assigned.summary.deadline')}
                </div>
                <div className="mt-1 text-sm font-semibold text-spice-text-primary">
                  {deadlineLabel}
                </div>
                <div className="text-xs text-spice-text-muted">
                  {t('moduleLibrary.assigned.summary.deadlineMeta')}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-spice-bg-tint p-4 ring-1 ring-spice-border/70">
              <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                {assignedToLabel}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {assignedNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-spice-bg-surface px-2.5 py-1 text-xs font-semibold text-spice-text-medium ring-1 ring-spice-border"
                  >
                    {name}
                  </span>
                ))}
                {showMoreCount && assignedCount > assignedNames.length ? (
                  <span className="rounded-full bg-spice-bg-surface px-2.5 py-1 text-xs font-semibold text-spice-text-medium ring-1 ring-spice-border">
                    +{assignedCount - assignedNames.length} more
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                {t('moduleLibrary.assigned.next.title')}
              </div>
              <div className="mt-3 grid gap-2">
                {moduleId ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(paths.moduleLibrary, {
                        state: {
                          openAssignment: { moduleId, moduleTitle: moduleName },
                        },
                      })
                    }
                    className="flex w-full items-center justify-between rounded-xl bg-spice-bg-tint px-4 py-3 text-left ring-1 ring-spice-border/70 transition hover:bg-spice-bg-surface"
                  >
                    <div>
                      <div className="text-sm font-semibold text-spice-text-primary">
                        {t('moduleLibrary.assigned.next.assignMore')}
                      </div>
                      <div className="text-xs text-spice-text-muted">
                        {t('moduleLibrary.assigned.next.assignMoreHint')}
                      </div>
                    </div>
                    <span className="text-spice-text-muted">›</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(paths.moduleLibrary)}
                  className="flex w-full items-center justify-between rounded-xl bg-spice-bg-tint px-4 py-3 text-left ring-1 ring-spice-border/70 transition hover:bg-spice-bg-surface"
                >
                  <div>
                    <div className="text-sm font-semibold text-spice-text-primary">
                      {t('moduleLibrary.assigned.next.backToLibrary')}
                    </div>
                    <div className="text-xs text-spice-text-muted">
                      {t('moduleLibrary.assigned.next.backToLibraryHint')}
                    </div>
                  </div>
                  <span className="text-spice-text-muted">›</span>
                </button>
                {/* <button
                  type="button"
                  onClick={() => navigate(paths.home)}
                  className="flex w-full items-center justify-between rounded-xl bg-spice-bg-tint px-4 py-3 text-left ring-1 ring-spice-border/70 transition hover:bg-spice-bg-surface"
                >
                  <div>
                    <div className="text-sm font-semibold text-spice-text-primary">
                      {t('moduleLibrary.assigned.next.goDashboard')}
                    </div>
                    <div className="text-xs text-spice-text-muted">
                      {t('moduleLibrary.assigned.next.goDashboardHint')}
                    </div>
                  </div>
                  <span className="text-spice-text-muted">›</span>
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* <div className="border-t border-spice-border bg-spice-bg-surface px-8 py-5">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(paths.moduleLibrary)}
            >
              {t('moduleLibrary.assigned.actions.back')}
            </Button>
            <Button onClick={() => navigate(paths.home)}>
              {t('moduleLibrary.assigned.actions.goDashboard')}
            </Button>
          </div>
        </div> */}
      </Card>
    </div>
  );
};
