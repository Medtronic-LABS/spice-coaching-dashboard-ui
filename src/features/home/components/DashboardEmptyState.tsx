import { Button } from '@/components/ui';
import { useTranslation } from 'react-i18next';

const RocketIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="text-slate-400"
  >
    <path d="M6 13c-1.5 1.5-2 4-2 5 1 0 3.5-.5 5-2" />
    <path d="M12 2c5 1 8 5 9 10-3 1-7 4-10 9-5-1-9-4-10-9 3-1 7-4 11-10Z" />
    <path d="M9 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
  </svg>
);

export interface DashboardEmptyStateProps {
  onAddChws?: () => void;
  onCreateModule?: () => void;
}

export const DashboardEmptyState = ({
  onAddChws,
  onCreateModule,
}: DashboardEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/70">
          <RocketIcon />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">
          {t('home.dashboardEmpty.title', {
            name: t('layout.sidebar.user.name'),
          })}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('home.dashboardEmpty.description')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onAddChws}>
            {t('home.dashboardEmpty.actions.addChws')}
          </Button>
          <Button variant="secondary" onClick={onCreateModule}>
            {t('home.dashboardEmpty.actions.createModule')}
          </Button>
        </div>
      </div>
    </div>
  );
};
