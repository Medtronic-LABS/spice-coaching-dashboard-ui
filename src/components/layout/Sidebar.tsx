import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookIcon,
  ClipboardIcon,
  HistoryIcon,
  SettingsIcon,
  VideoIcon,
} from '@/assets/icon';
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
            to={paths.uploadKnowledge}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <ClipboardIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.uploadKnowledge')}
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
                <VideoIcon className={iconClassName({ isActive })} />
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
