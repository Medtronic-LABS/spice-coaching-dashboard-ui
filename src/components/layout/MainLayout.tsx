import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { getCurrentRole } from '@/constants/role';

export const MainLayout = () => {
  const isProgramManager = getCurrentRole() === 'programManager';

  return (
    <div className="flex h-screen overflow-hidden bg-spice-bg-dashboard">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className={`flex-1 overflow-y-auto bg-spice-bg-dashboard ${
            isProgramManager ? 'p-6' : 'p-8'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
