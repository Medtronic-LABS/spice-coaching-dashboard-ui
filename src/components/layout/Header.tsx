import { useTranslation } from 'react-i18next';
import { CloseIcon, MenuIcon } from '@/assets/icon';
import uhisLogo from '@/assets/img/uhis-logo.png';
import { Button } from '@/components/ui/Button';
import { isLoginEnabled } from '@/config/authConfig';
import {
  getAuthDisplayName,
  getAuthInitials,
  getAuthSession,
  logout,
} from '@/features/auth/services/authSession';

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export const Header = ({ isSidebarOpen, onMenuToggle }: HeaderProps) => {
  const { t } = useTranslation();
  const authSession = getAuthSession();
  const displayName = authSession
    ? getAuthDisplayName(authSession)
    : t('layout.header.userName');
  const userInitials = authSession
    ? getAuthInitials(authSession)
    : t('layout.header.userInitials');
  const canLogout = Boolean(authSession) && isLoginEnabled();

  return (
    <header className="border-b border-spice-border bg-spice-bg-surface px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-spice-border-mid text-spice-text-primary transition hover:bg-spice-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/25 lg:hidden"
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
            className="h-8 w-auto object-contain sm:h-9"
          />
          <span className="truncate text-lg font-semibold tracking-tight text-[#E5007D] sm:text-xl">
            AI Coaching
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-spice-bg-tint text-xs font-semibold text-spice-brand-primary ring-1 ring-spice-border"
            aria-hidden="true"
            title={displayName}
          >
            {userInitials}
          </div>
          {canLogout ? (
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 text-xs"
              onClick={() => logout()}
              aria-label={t('layout.header.logoutAriaLabel', {
                defaultValue: 'Log out',
              })}
            >
              {t('layout.header.logout', { defaultValue: 'Log out' })}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
