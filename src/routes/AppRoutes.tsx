import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { paths } from '@/constants/routes';

const Home = lazy(() =>
  import('@/features/home/components/Home').then((module) => ({
    default: module.Home,
  })),
);
const CHWView = lazy(() =>
  import('@/features/chw/components/CHWView').then((module) => ({
    default: module.CHWView,
  })),
);
const DistrictView = lazy(() =>
  import('@/features/district/components/DistrictView').then((module) => ({
    default: module.DistrictView,
  })),
);
const AlertsView = lazy(() =>
  import('@/features/alerts/components/AlertsView').then((module) => ({
    default: module.AlertsView,
  })),
);

export const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-600">Loading page...</div>
      }
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={paths.home} element={<Home />} />
          <Route path={paths.chw} element={<CHWView />} />
          <Route path={paths.district} element={<DistrictView />} />
          <Route path={paths.alerts} element={<AlertsView />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
