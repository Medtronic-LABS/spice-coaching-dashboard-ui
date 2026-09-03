import { useTranslation } from 'react-i18next';
import { CloseIcon, MenuIcon } from '@/assets/icon';
import uhisLogo from '@/assets/img/uhis-logo.png';
import { isLoginEnabled } from '@/config/authConfig';
import { getAuthSession, logout } from '@/features/auth/services/authSession';

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export const Header = ({ isSidebarOpen, onMenuToggle }: HeaderProps) => {
  const { t } = useTranslation();
  const authSession = getAuthSession();
  const canLogout = Boolean(authSession) && isLoginEnabled();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-spice-border bg-spice-palette-violetLt px-4 sm:px-6">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-spice-border text-spice-palette-violetDeep transition hover:bg-spice-palette-violetLt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-palette-violet/30 lg:hidden"
          aria-label={
            isSidebarOpen
              ? t('layout.header.closeMenu')
              : t('layout.header.openMenu')
          }
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          onClick={onMenuToggle}
        >
          {isSidebarOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1">
          <img
            src={uhisLogo}
            alt="UHIS"
            draggable={false}
            className="h-8 w-auto select-none object-contain sm:h-10"
          />
          <span className="truncate text-lg font-semibold tracking-tight text-spice-brand-coaching sm:text-xl">
            AI Coaching
          </span>
        </div>

        {canLogout ? (
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-spice-logout-border bg-spice-logout-bg px-4 text-sm font-semibold leading-4 text-spice-logout-text transition hover:bg-spice-logout-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-logout-border"
            onClick={() => logout()}
            aria-label={t('layout.header.logoutAriaLabel', {
              defaultValue: 'Log out',
            })}
          >
            {t('layout.header.logout', { defaultValue: 'Log out' })}
          </button>
        ) : null}
      </div>
    </header>
  );
};
