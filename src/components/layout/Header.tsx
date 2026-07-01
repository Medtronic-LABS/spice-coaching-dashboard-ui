import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/ui';
import { getCurrentRole } from '@/constants/role';
import {
  getAuthDisplayName,
  getAuthInitials,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { cn } from '@/utils';

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
  const { t, i18n } = useTranslation();
  const role = getCurrentRole();
  const isProgramManager = role === 'programManager';
  const authSession = getAuthSession();
  const displayName = authSession
    ? getAuthDisplayName(authSession)
    : t('layout.header.userName');
  const userInitials = authSession
    ? getAuthInitials(authSession)
    : t('layout.header.userInitials');

  const currentLanguage = isProgramManager
    ? 'en'
    : (i18n.resolvedLanguage ?? i18n.language ?? 'en');

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

        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-spice-text-primary sm:text-2xl">
            {t('layout.header.welcomeBack', {
              name: displayName,
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isProgramManager ? (
            <div className="hidden w-44 md:block lg:w-60">
              <SearchInput
                value=""
                onChange={() => undefined}
                placeholder="Search modules..."
              />
            </div>
          ) : (
            <>
              <label className="sr-only" htmlFor="header-language-select">
                {t('layout.header.languageSelectSr')}
              </label>
              <select
                id="header-language-select"
                className={cn(
                  'h-9 rounded-md border border-spice-border-mid bg-spice-bg-surface text-sm font-medium text-spice-text-medium shadow-sm outline-none transition focus:ring-2 focus:ring-spice-brand-primary/25',
                  'max-w-[5.5rem] px-2 sm:max-w-none sm:px-3',
                )}
                aria-label={t('layout.header.languageAriaLabel')}
                value={currentLanguage}
                onChange={(event) => {
                  const nextLanguage = event.target.value;
                  try {
                    window.localStorage.setItem('i18nLng', nextLanguage);
                  } catch {
                    // ignore storage access failures
                  }
                  void i18n.changeLanguage(nextLanguage);
                }}
              >
                <option value="en">
                  {t('layout.header.languageOptions.en')}
                </option>
                <option value="bn">
                  {t('layout.header.languageOptions.bn')}
                </option>
              </select>
            </>
          )}
          <button
            type="button"
            className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-spice-bg-tint text-xs font-semibold text-spice-brand-primary ring-1 ring-spice-border"
            aria-label={t('layout.header.userMenuAriaLabel')}
            disabled
          >
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  );
};
