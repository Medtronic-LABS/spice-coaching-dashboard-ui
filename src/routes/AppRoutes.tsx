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
const ModuleLibraryPage = lazy(() =>
  import('@/features/module-library/pages/ModuleLibraryPage').then(
    (module) => ({
      default: module.ModuleLibraryPage,
    }),
  ),
);
const QuizPerformancePage = lazy(() =>
  import('@/features/quiz-performance/pages/QuizPerformancePage').then(
    (module) => ({
      default: module.QuizPerformancePage,
    }),
  ),
);
const LeaderboardPage = lazy(() =>
  import('@/features/leaderboard/pages/LeaderboardPage').then((module) => ({
    default: module.LeaderboardPage,
  })),
);
const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
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
          <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
          <Route
            path={paths.quizPerformance}
            element={<QuizPerformancePage />}
          />
          <Route path={paths.leaderboard} element={<LeaderboardPage />} />
          <Route path={paths.reports} element={<ReportsPage />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
