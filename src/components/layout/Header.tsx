import { useTranslation } from 'react-i18next';
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

const MenuIcon = ({ className }: { className?: string }) => (
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
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
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
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

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
          <button
            type="button"
            className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-spice-bg-tint text-xs font-semibold text-spice-brand-primary ring-1 ring-spice-border"
            aria-label={t('layout.header.userMenuAriaLabel', {
              name: displayName,
            })}
            title={displayName}
            disabled
          >
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  );
};
