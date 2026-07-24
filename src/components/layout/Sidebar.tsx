import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paths } from '@/constants/routes';
import {
  getAuthDisplayName,
  getAuthInitials,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { cn } from '@/utils';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

type NavIconProps = { className?: string };

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

const ClipboardIcon = ({ className }: NavIconProps) => (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 2h6v4H9V2Z" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

const HistoryIcon = ({ className }: NavIconProps) => (
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
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const SettingsIcon = ({ className }: NavIconProps) => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const Sidebar = ({ isMobileOpen, onMobileClose }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isModuleReviewRoute = Boolean(
    matchPath({ path: paths.adminModuleReview, end: false }, location.pathname),
  );
  const authSession = getAuthSession();
  const displayName = authSession
    ? getAuthDisplayName(authSession)
    : t('layout.header.userName');
  const userInitials = authSession
    ? getAuthInitials(authSession)
    : t('layout.header.userInitials');
  const roleLabel = authSession?.role ?? t('layout.sidebar.userFallback');
  const sectionTitleClassName =
    'px-3 pt-2 text-[10px] font-semibold tracking-wider text-spice-text-onDark-lo';
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-spice-brand-pm/20 text-spice-text-onDark-hi'
        : 'text-spice-text-onDark-mid hover:bg-white/10 hover:text-spice-text-onDark-hi'
    }`;
  const iconClassName = ({ isActive }: { isActive: boolean }) =>
    `h-4 w-4 shrink-0 ${
      isActive
        ? 'text-spice-brand-pm'
        : 'text-spice-text-onDark-mid group-hover:text-spice-text-onDark-hi'
    }`;

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-label={t('layout.sidebar.closeOverlay')}
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={onMobileClose}
      />
      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-[min(18rem,85vw)] shrink-0 flex-col border-r border-white/10 bg-spice-brand-navy transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-64 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 pb-4 pt-5">
          <div className="text-[10px] font-semibold tracking-wider text-spice-text-onDark-mid">
            {t('layout.sidebar.brand')}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <div className={sectionTitleClassName}>
            {t('layout.sidebar.sections.learning')}
          </div>
          <NavLink
            className={({ isActive }) =>
              linkClassName({ isActive: isActive || isModuleReviewRoute })
            }
            to={paths.moduleLibrary}
            end
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <BookIcon
                  className={iconClassName({
                    isActive: isActive || isModuleReviewRoute,
                  })}
                />
                {t('layout.sidebar.nav.moduleLibrary')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.ingestDocument}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <ClipboardIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.ingestDocument')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.videoUpload}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <ClipboardIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.videoUpload')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.ingestHistory}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <HistoryIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.ingestHistory')}
              </>
            )}
          </NavLink>
          <div className={sectionTitleClassName}>
            {t('layout.sidebar.sections.administration')}
          </div>
          <NavLink
            className={linkClassName}
            to={paths.configs}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <SettingsIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.configs')}
              </>
            )}
          </NavLink>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spice-brand-pm text-xs font-semibold text-white">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-spice-text-onDark-hi">
                {displayName}
              </div>
              <div className="truncate text-xs text-spice-text-onDark-mid">
                {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
