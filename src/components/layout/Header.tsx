import { useTranslation } from 'react-i18next';
import { CloseIcon, MenuIcon } from '@/assets/icon';
import uhisLogo from '@/assets/img/uhis-logo.png';
import {
  getAuthDisplayName,
  getAuthInitials,
  getAuthSession,
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

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spice-palette-violet text-xs font-bold text-white"
          aria-label={t('layout.header.userMenuAriaLabel', {
            name: displayName,
          })}
          title={displayName}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
};
