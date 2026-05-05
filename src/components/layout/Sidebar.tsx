import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentRole } from '@/constants/role';
import { paths } from '@/constants/routes';

type NavIconProps = { className?: string };

const DashboardIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 13h8V3H3v10Z" />
    <path d="M13 21h8V11h-8v10Z" />
    <path d="M13 3h8v6h-8V3Z" />
    <path d="M3 17h8v4H3v-4Z" />
  </svg>
);

const UsersIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    <path d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.35" />
    <path d="M16.5 3.15a4 4 0 0 1 0 7.7" />
  </svg>
);

const BookIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 19a2 2 0 0 0 2 2h14" />
    <path d="M6 2h14v20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
  </svg>
);

const QuizIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 12h6" />
    <path d="M9 16h6" />
    <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M9 8h.01" />
  </svg>
);

const TrophyIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M5 4h2v3a4 4 0 0 1-4-4V2h2v2Z" />
    <path d="M19 4h2V2h2v1a4 4 0 0 1-4 4V4Z" />
  </svg>
);

const ReportIcon = ({ className }: NavIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h8" />
    <path d="M8 9h2" />
  </svg>
);

export const Sidebar = () => {
  const { t } = useTranslation();
  const role = getCurrentRole();
  const isProgramManager = role === 'programManager';
  const sectionTitleClassName = `px-3 pt-2 text-[10px] font-semibold tracking-wider ${
    isProgramManager ? 'text-spice-text-onDark-lo' : 'text-spice-text-muted'
  }`;
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isProgramManager
        ? isActive
          ? 'bg-spice-brand-pm/20 text-spice-text-onDark-hi'
          : 'text-spice-text-onDark-mid hover:bg-white/10 hover:text-spice-text-onDark-hi'
        : isActive
          ? 'bg-spice-bg-tint text-spice-brand-primary'
          : 'text-spice-text-medium hover:bg-spice-bg-tint'
    }`;
  const iconClassName = ({ isActive }: { isActive: boolean }) =>
    `h-4 w-4 shrink-0 ${
      isProgramManager
        ? isActive
          ? 'text-spice-brand-pm'
          : 'text-spice-text-onDark-mid group-hover:text-spice-text-onDark-hi'
        : isActive
          ? 'text-spice-brand-primary'
          : 'text-spice-text-muted group-hover:text-spice-text-medium'
    }`;

  return (
    <aside
      className={`sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r ${
        isProgramManager
          ? 'border-white/10 bg-spice-brand-navy'
          : 'border-spice-border bg-spice-bg-surface'
      }`}
    >
      <div className="px-5 pb-4 pt-5">
        <div
          className={`text-[10px] font-semibold tracking-wider ${
            isProgramManager
              ? 'text-spice-text-onDark-mid'
              : 'text-spice-text-medium'
          }`}
        >
          {t('layout.sidebar.brand')}
        </div>
        <div
          className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isProgramManager
              ? 'bg-spice-brand-pm text-white'
              : 'bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border'
          }`}
        >
          {isProgramManager ? 'Admin Access' : t('layout.sidebar.badge')}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        <div className={sectionTitleClassName}>
          {t('layout.sidebar.sections.overview')}
        </div>
        <NavLink className={linkClassName} to={paths.home} end>
          {({ isActive }) => (
            <>
              <DashboardIcon className={iconClassName({ isActive })} />
              {isProgramManager
                ? 'Overview'
                : t('layout.sidebar.nav.dashboard')}
            </>
          )}
        </NavLink>
        <NavLink
          className={linkClassName}
          to={isProgramManager ? paths.supervisors : paths.chwProfiles}
        >
          {({ isActive }) => (
            <>
              <UsersIcon className={iconClassName({ isActive })} />
              {isProgramManager
                ? 'Supervisors'
                : t('layout.sidebar.nav.chwProfiles')}
            </>
          )}
        </NavLink>
        {isProgramManager ? (
          <NavLink className={linkClassName} to={paths.chwProfiles}>
            {({ isActive }) => (
              <>
                <UsersIcon className={iconClassName({ isActive })} />
                CHW Roster
              </>
            )}
          </NavLink>
        ) : null}

        <div className={sectionTitleClassName}>
          {t('layout.sidebar.sections.learning')}
        </div>
        <NavLink className={linkClassName} to={paths.moduleLibrary}>
          {({ isActive }) => (
            <>
              <BookIcon className={iconClassName({ isActive })} />
              {isProgramManager
                ? 'Courses'
                : t('layout.sidebar.nav.moduleLibrary')}
            </>
          )}
        </NavLink>
        <NavLink className={linkClassName} to={paths.quizPerformance}>
          {({ isActive }) => (
            <>
              <QuizIcon className={iconClassName({ isActive })} />
              {isProgramManager
                ? 'Quiz Analytics'
                : t('layout.sidebar.nav.quizPerformance')}
            </>
          )}
        </NavLink>

        <div className={sectionTitleClassName}>
          {t('layout.sidebar.sections.monitoring')}
        </div>
        <NavLink
          className={linkClassName}
          to={isProgramManager ? paths.escalations : paths.leaderboard}
        >
          {({ isActive }) => (
            <>
              <TrophyIcon className={iconClassName({ isActive })} />
              {isProgramManager
                ? 'Escalations'
                : t('layout.sidebar.nav.leaderboard')}
            </>
          )}
        </NavLink>
        {isProgramManager ? (
          <NavLink className={linkClassName} to={paths.rankings}>
            {({ isActive }) => (
              <>
                <TrophyIcon className={iconClassName({ isActive })} />
                Rankings
              </>
            )}
          </NavLink>
        ) : null}
        <NavLink className={linkClassName} to={paths.reports}>
          {({ isActive }) => (
            <>
              <ReportIcon className={iconClassName({ isActive })} />
              {t('layout.sidebar.nav.reports')}
            </>
          )}
        </NavLink>
      </nav>

      <div
        className={`border-t px-4 py-4 ${
          isProgramManager ? 'border-white/10' : 'border-spice-border'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
              isProgramManager
                ? 'bg-spice-brand-pm text-white'
                : 'bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border'
            }`}
          >
            {t('layout.sidebar.user.initials')}
          </div>
          <div className="min-w-0">
            <div
              className={`truncate text-sm font-semibold ${
                isProgramManager
                  ? 'text-spice-text-onDark-hi'
                  : 'text-spice-text-primary'
              }`}
            >
              {t('layout.sidebar.user.name')}
            </div>
            <div
              className={`truncate text-xs ${
                isProgramManager
                  ? 'text-spice-text-onDark-mid'
                  : 'text-spice-text-muted'
              }`}
            >
              {isProgramManager
                ? 'Program Manager'
                : t('layout.sidebar.user.subtitle')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
