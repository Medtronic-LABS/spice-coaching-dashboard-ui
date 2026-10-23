import { useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { AssignmentSuccessCard } from '@/features/modules/components/AssignmentSuccessModal';
import {
  resolveAssignmentSuccessEntityKind,
  resolveAssignmentSuccessEntityId,
  resolveAssignmentSuccessEntityName,
  type AssignmentSuccessEntityKind,
  type AssignmentSuccessLocationState,
} from '@/features/modules/types/assignmentSuccessNavigation.types';

function libraryPathForEntity(entityKind: AssignmentSuccessEntityKind): string {
  switch (entityKind) {
    case 'document':
      return paths.uploadKnowledge;
    case 'video':
      return paths.videoUpload;
    default:
      return paths.moduleLibrary;
  }
}

export const ModuleAssignedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as AssignmentSuccessLocationState;

  const entityKind = resolveAssignmentSuccessEntityKind(state);
  const entityId = resolveAssignmentSuccessEntityId(state);
  const entityName = resolveAssignmentSuccessEntityName(state, '');

  const handleAssignMore = () => {
    if (!entityId) return;

    if (entityKind === 'module') {
      navigate(paths.moduleLibrary, {
        state: {
          tab: 'published',
          openAssignment: { moduleId: entityId, moduleTitle: entityName },
        },
      });
      return;
    }

    navigate(libraryPathForEntity(entityKind), {
      state: {
        openDocumentAssignment: {
          sourceDocumentId: entityId,
          title: entityName,
          noun: entityKind === 'video' ? 'video' : 'document',
        },
      },
    });
  };

  return (
    <div className="flex h-[85vh] items-center justify-center px-4 py-6">
      <AssignmentSuccessCard
        state={state}
        presentation="page"
        onAssignMore={entityId ? handleAssignMore : undefined}
        onPrimaryAction={() => navigate(libraryPathForEntity(entityKind))}
      />
    </div>
  );
};
