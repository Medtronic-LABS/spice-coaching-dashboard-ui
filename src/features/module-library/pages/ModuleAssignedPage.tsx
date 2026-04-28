import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';

type ModuleAssignedState = {
  moduleName?: string;
  deadlineLabel?: string;
  assignedCount?: number;
  assignedNames?: string[];
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
    className="text-blue-700"
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card variant="elevated" className="w-full max-w-xl p-0">
        <div className="px-8 pb-7 pt-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
            <ClipboardIcon />
          </div>
          <Badge className="mt-4 bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            {t('moduleLibrary.assigned.badge')}
          </Badge>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            {t('moduleLibrary.assigned.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('moduleLibrary.assigned.subtitle')}
          </p>

          <div className="mt-6 grid gap-3 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                <div className="text-[10px] font-semibold tracking-wider text-slate-500">
                  {t('moduleLibrary.assigned.summary.module')}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {moduleName}
                </div>
                <div className="text-xs text-slate-500">
                  {t('moduleLibrary.assigned.summary.moduleMeta')}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                <div className="text-[10px] font-semibold tracking-wider text-slate-500">
                  {t('moduleLibrary.assigned.summary.deadline')}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {deadlineLabel}
                </div>
                <div className="text-xs text-slate-500">
                  {t('moduleLibrary.assigned.summary.deadlineMeta')}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
              <div className="text-[10px] font-semibold tracking-wider text-slate-500">
                {t('moduleLibrary.assigned.summary.assignedTo', {
                  count: assignedCount,
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {assignedNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    {name}
                  </span>
                ))}
                {assignedCount > assignedNames.length ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    +{assignedCount - assignedNames.length} more
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                {t('moduleLibrary.assigned.next.title')}
              </div>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => navigate(paths.moduleLibrary)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/60 transition hover:bg-slate-100"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t('moduleLibrary.assigned.next.backToLibrary')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('moduleLibrary.assigned.next.backToLibraryHint')}
                    </div>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(paths.moduleLibrary)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/60 transition hover:bg-slate-100"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t('moduleLibrary.assigned.next.assignMore')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('moduleLibrary.assigned.next.assignMoreHint')}
                    </div>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(paths.home)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/60 transition hover:bg-slate-100"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t('moduleLibrary.assigned.next.goDashboard')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('moduleLibrary.assigned.next.goDashboardHint')}
                    </div>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-8 py-5">
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
        </div>
      </Card>
    </div>
  );
};
