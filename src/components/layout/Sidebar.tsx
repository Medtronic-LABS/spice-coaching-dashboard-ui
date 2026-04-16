import { NavLink } from 'react-router-dom';
import { paths } from '@/constants/routes';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

export const Sidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">
        Micro Learning Analytics Dashboard
      </h1>
      <nav className="space-y-2">
        <NavLink className={linkClassName} to={paths.home}>
          Home
        </NavLink>
        <NavLink className={linkClassName} to={paths.chw}>
          CHW View
        </NavLink>
        <NavLink className={linkClassName} to={paths.uiPreview}>
          UI Preview
        </NavLink>
        <NavLink className={linkClassName} to={paths.chartPreview}>
          Chart Preview
        </NavLink>
      </nav>
    </aside>
  );
};
