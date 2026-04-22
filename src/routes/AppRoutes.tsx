import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { paths } from '@/constants/routes';

const Home = lazy(() =>
  import('@/features/home/pages/Home').then((module) => ({
    default: module.Home,
  })),
);
const ChwProfilesListPage = lazy(() =>
  import('@/features/chw-profiles/pages/ChwProfilesListPage.tsx').then(
    (module) => ({
      default: module.ChwProfilesListPage,
    }),
  ),
);
const ChwProfileDetailPage = lazy(() =>
  import('@/features/chw-profiles/pages/ChwProfileDetailPage.tsx').then(
    (module) => ({
      default: module.ChwProfileDetailPage,
    }),
  ),
);
const UiPreviewPage = lazy(() =>
  import('@/features/ui-preview/components/UiPreviewPage').then((module) => ({
    default: module.UiPreviewPage,
  })),
);
const ChartPreview = lazy(() =>
  import('@/features/ui-preview/components/ChartPreview').then((module) => ({
    default: module.ChartPreview,
  })),
);

export const AppRoutes = () => {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-600">
          {t('common.loadingPage')}
        </div>
      }
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={paths.home} element={<Home />} />
          <Route path={paths.chwProfiles} element={<ChwProfilesListPage />} />
          <Route
            path={paths.chwProfileDetail}
            element={<ChwProfileDetailPage />}
          />
          <Route path={paths.uiPreview} element={<UiPreviewPage />} />
          <Route path={paths.chartPreview} element={<ChartPreview />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
