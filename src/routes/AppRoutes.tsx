import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { paths } from '@/constants/routes';
import ChartPreview from '@/features/ui-preview/components/ChartPreview';

const Home = lazy(() =>
  import('@/features/home/pages/Home').then((module) => ({
    default: module.Home,
  })),
);
const CHWView = lazy(() =>
  import('@/features/chw/components/CHWView').then((module) => ({
    default: module.CHWView,
  })),
);
const UiPreviewPage = lazy(() =>
  import('@/features/ui-preview/components/UiPreviewPage').then((module) => ({
    default: module.UiPreviewPage,
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
          <Route path={paths.uiPreview} element={<UiPreviewPage />} />
          <Route path={paths.chartPreview} element={<ChartPreview />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
