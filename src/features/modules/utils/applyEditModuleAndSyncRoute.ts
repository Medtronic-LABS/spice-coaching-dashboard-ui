import type { NavigateFunction } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
import type {
  EditAdminModuleRequestBody,
  EditAdminModuleResponse,
} from '@/features/modules/api/adminModulesApi';

export function buildAdminModuleReviewPath(
  currentPathname: string,
  moduleId: string,
): string | null {
  const match = matchPath(
    { path: paths.adminModuleReview, end: false },
    currentPathname,
  );
  if (!match) return null;
  const suffix = currentPathname.slice(match.pathnameBase.length);
  return `${adminModuleReviewPaths.root(moduleId)}${suffix}`;
}

type EditModuleTrigger = (args: {
  moduleId: string;
  body: EditAdminModuleRequestBody;
}) => { unwrap: () => Promise<EditAdminModuleResponse> };

export async function applyEditModuleAndSyncRoute(options: {
  editModule: EditModuleTrigger;
  navigate: NavigateFunction;
  pathname: string;
  moduleEntityId: string;
  body: EditAdminModuleRequestBody;
}): Promise<EditAdminModuleResponse> {
  const response = await options
    .editModule({ moduleId: options.moduleEntityId, body: options.body })
    .unwrap();

  if (response.id !== options.moduleEntityId) {
    const nextPath = buildAdminModuleReviewPath(options.pathname, response.id);
    if (nextPath) {
      options.navigate(nextPath, { replace: true });
      return response;
    }
    options.navigate(adminModuleReviewPaths.details(response.id), {
      replace: true,
    });
  }

  return response;
}
