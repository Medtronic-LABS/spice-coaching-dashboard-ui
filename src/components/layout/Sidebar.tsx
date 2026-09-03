import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AwardIcon,
  BookIcon,
  ClipboardIcon,
  DashboardIcon,
  HistoryIcon,
  KnowledgeIcon,
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
  const isModuleAssignedRoute = Boolean(
    matchPath({ path: paths.moduleAssigned, end: true }, location.pathname),
  );
  const isModuleLibraryNavActive = isModuleReviewRoute || isModuleAssignedRoute;
  const authSession = getAuthSession();
  const displayName = authSession
    ? getAuthDisplayName(authSession)
    : t('layout.header.userName');
  const userInitials = authSession
    ? getAuthInitials(authSession)
    : t('layout.header.userInitials');
  const roleLabel = authSession?.role ?? t('layout.sidebar.userFallback');
  const sectionTitleClassName =
    'px-4 pt-2 text-xs font-semibold uppercase leading-[13px] text-spice-palette-violet first:pt-0';
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-3 text-sm transition',
      isActive
        ? 'bg-spice-palette-violet font-semibold text-white'
        : 'font-normal text-spice-palette-violetDeep hover:bg-white/50',
    );
  const iconClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'h-[18px] w-[18px] shrink-0',
      isActive ? 'text-white' : 'text-spice-palette-violetDeep',
    );

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed inset-x-0 bottom-0 top-14 z-40 bg-black/40 transition-opacity lg:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-label={t('layout.sidebar.closeOverlay')}
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={onMobileClose}
      />
      <aside
        id="app-sidebar"
        className={cn(
          'fixed bottom-0 left-0 top-14 z-50 flex w-[min(260px,85vw)] shrink-0 flex-col bg-spice-palette-violetLt px-5 pb-6 pt-4 transition-transform duration-200 ease-in-out lg:static lg:top-auto lg:z-auto lg:h-full lg:w-[260px] lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <div className={sectionTitleClassName}>
            {t('layout.sidebar.sections.overview')}
          </div>
          <NavLink
            className={linkClassName}
            to={paths.adminDashboard}
            draggable={false}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <DashboardIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.dashboard')}
              </>
            )}
          </NavLink>
          <div className={sectionTitleClassName}>
            {t('layout.sidebar.sections.learning')}
          </div>
          <NavLink
            className={linkClassName}
            to={paths.videoUpload}
            draggable={false}
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
            to={paths.uploadKnowledge}
            draggable={false}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <KnowledgeIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.uploadKnowledge')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.ingestDocument}
            draggable={false}
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
            className={({ isActive }) =>
              linkClassName({
                isActive: isActive || isModuleLibraryNavActive,
              })
            }
            to={paths.moduleLibrary}
            end
            draggable={false}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <BookIcon
                  className={iconClassName({
                    isActive: isActive || isModuleLibraryNavActive,
                  })}
                />
                {t('layout.sidebar.nav.moduleLibrary')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.ingestHistory}
            draggable={false}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <HistoryIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.ingestHistory')}
              </>
            )}
          </NavLink>
          <NavLink
            className={linkClassName}
            to={paths.badgeManagement}
            draggable={false}
            onClick={onMobileClose}
          >
            {({ isActive }) => (
              <>
                <AwardIcon className={iconClassName({ isActive })} />
                {t('layout.sidebar.nav.badgeManagement')}
              </>
            )}
          </NavLink>
          <div className={sectionTitleClassName}>
            {t('layout.sidebar.sections.administration')}
          </div>
          <NavLink
            className={linkClassName}
            to={paths.configs}
            draggable={false}
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

        <div className="mt-auto border-t border-spice-palette-violet pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spice-palette-violet text-sm font-bold text-white">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-[17px] text-spice-text-sidebarName">
                {displayName}
              </div>
              <div className="truncate text-xs font-medium leading-[13px] text-spice-palette-violet">
                {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
