import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paths } from '@/constants/routes';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

export const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">
        {t('layout.sidebar.title')}
      </h1>
      <nav className="space-y-2">
        <NavLink className={linkClassName} to={paths.home}>
          {t('layout.sidebar.nav.home')}
        </NavLink>
        <NavLink className={linkClassName} to={paths.chw}>
          {t('layout.sidebar.nav.chwView')}
        </NavLink>
        <NavLink className={linkClassName} to={paths.uiPreview}>
          {t('layout.sidebar.nav.uiPreview')}
        </NavLink>
        <NavLink className={linkClassName} to={paths.chartPreview}>
          {t('layout.sidebar.nav.chartPreview')}
        </NavLink>
      </nav>
    </aside>
  );
};
