import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { paths, ROUTE_PREFIX } from '@/constants/routes';

const ModuleLibraryPage = lazy(() =>
  import('@/features/modules/pages/ModuleLibraryPage').then((module) => ({
    default: module.ModuleLibraryPage,
  })),
);
const ModuleAssignedPage = lazy(() =>
  import('@/features/modules/pages/ModuleAssignedPage').then((module) => ({
    default: module.ModuleAssignedPage,
  })),
);
const IngestDocumentPage = lazy(() =>
  import('@/features/ingest/pages/IngestDocumentPage').then((module) => ({
    default: module.IngestDocumentPage,
  })),
);
const IngestHistoryPage = lazy(() =>
  import('@/features/ingest/pages/IngestHistoryPage').then((module) => ({
    default: module.IngestHistoryPage,
  })),
);
const VideoUploadPage = lazy(() =>
  import('@/features/ingest/pages/VideoUploadPage').then((module) => ({
    default: module.VideoUploadPage,
  })),
);
const AdminModuleReviewLayout = lazy(() =>
  import('@/features/modules/layout/AdminModuleReviewLayout').then(
    (module) => ({
      default: module.AdminModuleReviewLayout,
    }),
  ),
);
const AdminModuleDetailsStep = lazy(() =>
  import('@/features/modules/pages/admin-module-review/AdminModuleDetailsStep').then(
    (module) => ({ default: module.AdminModuleDetailsStep }),
  ),
);
const AdminModuleLessonsStep = lazy(() =>
  import('@/features/modules/pages/admin-module-review/AdminModuleLessonsStep').then(
    (module) => ({ default: module.AdminModuleLessonsStep }),
  ),
);
const AdminModuleQuizStep = lazy(() =>
  import('@/features/modules/pages/admin-module-review/AdminModuleQuizStep').then(
    (module) => ({ default: module.AdminModuleQuizStep }),
  ),
);
const AdminModulePublishStep = lazy(() =>
  import('@/features/modules/pages/admin-module-review/AdminModulePublishStep').then(
    (module) => ({ default: module.AdminModulePublishStep }),
  ),
);
const ModuleCreatePage = lazy(() =>
  import('@/features/modules/pages/ModuleCreatePage').then((module) => ({
    default: module.ModuleCreatePage,
  })),
);
const ModuleFlowLayout = lazy(() =>
  import('@/features/modules/layout/ModuleFlowLayout').then((module) => ({
    default: module.ModuleFlowLayout,
  })),
);
const ModuleLessonsPage = lazy(() =>
  import('@/features/modules/pages/ModuleLessonsPage').then((module) => ({
    default: module.ModuleLessonsPage,
  })),
);
const ModuleQuizPage = lazy(() =>
  import('@/features/modules/pages/ModuleQuizPage').then((module) => ({
    default: module.ModuleQuizPage,
  })),
);
const ModuleReviewPublishPage = lazy(() =>
  import('@/features/modules/pages/ModuleReviewPublishPage').then((module) => ({
    default: module.ModuleReviewPublishPage,
  })),
);
const ModulePublishedPage = lazy(() =>
  import('@/features/modules/pages/ModulePublishedPage').then((module) => ({
    default: module.ModulePublishedPage,
  })),
);
const ConfigsPage = lazy(() =>
  import('@/features/admin-configs/pages/ConfigsPage').then((module) => ({
    default: module.ConfigsPage,
  })),
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path={ROUTE_PREFIX}
        element={<Navigate to={paths.moduleLibrary} replace />}
      />
      <Route element={<MainLayout />}>
        <Route
          path={paths.home}
          element={<Navigate to={paths.moduleLibrary} replace />}
        />
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
        <Route path={paths.ingestDocument} element={<IngestDocumentPage />} />
        <Route path={paths.videoUpload} element={<VideoUploadPage />} />
        <Route path={paths.ingestHistory} element={<IngestHistoryPage />} />
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
        <Route path={paths.moduleCreate} element={<ModuleFlowLayout />}>
          <Route index element={<ModuleCreatePage />} />
          <Route path="lessons" element={<ModuleLessonsPage />} />
          <Route path="quiz" element={<ModuleQuizPage />} />
          <Route path="review" element={<ModuleReviewPublishPage />} />
          <Route path="published" element={<ModulePublishedPage />} />
        </Route>
        <Route path={paths.configs} element={<ConfigsPage />} />
        <Route
          path="*"
          element={<Navigate to={paths.moduleLibrary} replace />}
        />
      </Route>
    </Routes>
  );
};
