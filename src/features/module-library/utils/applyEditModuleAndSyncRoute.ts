import type { NavigateFunction } from 'react-router-dom';
import { paths } from '@/constants/routes';
import type {
  EditAdminModuleRequestBody,
  EditAdminModuleResponse,
} from '@/features/module-library/api/adminModulesApi';

const ADMIN_MODULE_REVIEW_PREFIX = paths.adminModuleReview.replace(
  ':moduleId',
  '',
);

export function buildAdminModuleReviewPath(
  currentPathname: string,
  moduleId: string,
): string | null {
  if (!currentPathname.startsWith(ADMIN_MODULE_REVIEW_PREFIX)) return null;
  const afterPrefix = currentPathname.slice(ADMIN_MODULE_REVIEW_PREFIX.length);
  const slashIndex = afterPrefix.indexOf('/');
  const suffix = slashIndex === -1 ? '' : afterPrefix.slice(slashIndex);
  return `${ADMIN_MODULE_REVIEW_PREFIX}${encodeURIComponent(moduleId)}${suffix}`;
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
    options.navigate(
      paths.adminModuleReviewDetails.replace(
        ':moduleId',
        encodeURIComponent(response.id),
      ),
      { replace: true },
    );
  }

  return response;
}
