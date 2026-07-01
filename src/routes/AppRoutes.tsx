import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCurrentRole } from '@/constants/role';
import { paths, ROUTE_PREFIX } from '@/constants/routes';

const Home = lazy(() =>
  import('@/features/home/pages/Home').then((module) => ({
    default: module.Home,
  })),
);
const ChwProfilesListPage = lazy(() =>
  import('@/features/chw-profiles/pages/ChwProfilesListPage').then(
    (module) => ({
      default: module.ChwProfilesListPage,
    }),
  ),
);
const ChwProfileDetailPage = lazy(() =>
  import('@/features/chw-profiles/pages/ChwProfileDetailPage').then(
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
const ModuleAssignedPage = lazy(() =>
  import('@/features/module-library/pages/ModuleAssignedPage').then(
    (module) => ({
      default: module.ModuleAssignedPage,
    }),
  ),
);
const IngestDocumentPage = lazy(() =>
  import('@/features/module-library/pages/IngestDocumentPage').then(
    (module) => ({
      default: module.IngestDocumentPage,
    }),
  ),
);
const AdminModuleReviewLayout = lazy(() =>
  import('@/features/module-library/layout/AdminModuleReviewLayout').then(
    (module) => ({
      default: module.AdminModuleReviewLayout,
    }),
  ),
);
const AdminModuleDetailsStep = lazy(() =>
  import('@/features/module-library/pages/admin-module-review/AdminModuleDetailsStep').then(
    (module) => ({ default: module.AdminModuleDetailsStep }),
  ),
);
const AdminModuleLessonsStep = lazy(() =>
  import('@/features/module-library/pages/admin-module-review/AdminModuleLessonsStep').then(
    (module) => ({ default: module.AdminModuleLessonsStep }),
  ),
);
const AdminModuleQuizStep = lazy(() =>
  import('@/features/module-library/pages/admin-module-review/AdminModuleQuizStep').then(
    (module) => ({ default: module.AdminModuleQuizStep }),
  ),
);
const AdminModulePublishStep = lazy(() =>
  import('@/features/module-library/pages/admin-module-review/AdminModulePublishStep').then(
    (module) => ({ default: module.AdminModulePublishStep }),
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
const SupervisorsPage = lazy(() =>
  import('@/features/program-manager/pages/SupervisorsPage').then((module) => ({
    default: module.SupervisorsPage,
  })),
);
const SupervisorDetailPage = lazy(() =>
  import('@/features/program-manager/pages/SupervisorDetailPage').then(
    (module) => ({
      default: module.SupervisorDetailPage,
    }),
  ),
);
const ChwRosterPage = lazy(() =>
  import('@/features/program-manager/pages/ChwRosterPage').then((module) => ({
    default: module.ChwRosterPage,
  })),
);
const EscalationsPage = lazy(() =>
  import('@/features/program-manager/pages/EscalationsPage').then((module) => ({
    default: module.EscalationsPage,
  })),
);
const RankingsPage = lazy(() =>
  import('@/features/program-manager/pages/RankingsPage').then((module) => ({
    default: module.RankingsPage,
  })),
);
const CourseCreatePage = lazy(() =>
  import('@/features/program-manager/pages/CourseCreatePage').then(
    (module) => ({
      default: module.CourseCreatePage,
    }),
  ),
);
const CourseFlowLayout = lazy(() =>
  import('@/features/program-manager/layout/CourseFlowLayout').then(
    (module) => ({
      default: module.CourseFlowLayout,
    }),
  ),
);
const CourseLessonsPage = lazy(() =>
  import('@/features/program-manager/pages/CourseLessonsPage').then(
    (module) => ({
      default: module.CourseLessonsPage,
    }),
  ),
);
const CourseQuizPage = lazy(() =>
  import('@/features/program-manager/pages/CourseQuizPage').then((module) => ({
    default: module.CourseQuizPage,
  })),
);
const CourseReviewPublishPage = lazy(() =>
  import('@/features/program-manager/pages/CourseReviewPublishPage').then(
    (module) => ({
      default: module.CourseReviewPublishPage,
    }),
  ),
);
const CoursePublishedPage = lazy(() =>
  import('@/features/program-manager/pages/CoursePublishedPage').then(
    (module) => ({
      default: module.CoursePublishedPage,
    }),
  ),
);
export const AppRoutes = () => {
  const role = getCurrentRole();
  const isProgramManager = role === 'programManager';

  return (
    <Routes>
      <Route
        path={ROUTE_PREFIX}
        element={<Navigate to={paths.home} replace />}
      />
      <Route element={<MainLayout />}>
        <Route path={paths.home} element={<Home />} />
        <Route
          path={paths.chwProfiles}
          element={
            isProgramManager ? <ChwRosterPage /> : <ChwProfilesListPage />
          }
        />
        <Route
          path={paths.chwProfileDetail}
          element={<ChwProfileDetailPage />}
        />
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
        <Route
          path={paths.ingestDocument}
          element={
            isProgramManager ? (
              <IngestDocumentPage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route
          path={paths.adminModuleReview}
          element={<AdminModuleReviewLayout />}
        >
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<AdminModuleDetailsStep />} />
          <Route path="lessons" element={<AdminModuleLessonsStep />} />
          <Route path="quiz" element={<AdminModuleQuizStep />} />
          <Route path="review" element={<AdminModulePublishStep />} />
        </Route>
        <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
        <Route path={paths.quizPerformance} element={<QuizPerformancePage />} />
        <Route
          path={paths.leaderboard}
          element={isProgramManager ? <RankingsPage /> : <LeaderboardPage />}
        />
        <Route path={paths.reports} element={<ReportsPage />} />
        <Route
          path={paths.supervisors}
          element={
            isProgramManager ? (
              <SupervisorsPage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route
          path={paths.supervisorDetail}
          element={
            isProgramManager ? (
              <SupervisorDetailPage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route
          path={paths.escalations}
          element={
            isProgramManager ? (
              <EscalationsPage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route
          path={paths.rankings}
          element={
            isProgramManager ? (
              <RankingsPage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route
          path={paths.courseCreate}
          element={
            isProgramManager ? (
              <CourseFlowLayout />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        >
          <Route index element={<CourseCreatePage />} />
          <Route path="lessons" element={<CourseLessonsPage />} />
          <Route path="quiz" element={<CourseQuizPage />} />
          <Route path="review" element={<CourseReviewPublishPage />} />
          <Route path="published" element={<CoursePublishedPage />} />
        </Route>
        <Route
          path={paths.moduleCreate}
          element={
            isProgramManager ? (
              <CourseCreatePage />
            ) : (
              <Navigate to={paths.home} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Route>
    </Routes>
  );
};
