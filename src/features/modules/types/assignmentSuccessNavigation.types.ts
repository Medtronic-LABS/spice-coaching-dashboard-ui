import type { AssignmentSummaryType } from '@/features/modules/api/adminAssignmentApi';
import type { AssignedUserEntry } from '@/features/modules/utils/assignmentDisplay';

export type AssignmentSuccessEntityKind = 'module' | 'document' | 'video';

export type AssignmentDialogTargetForSuccess =
  | { kind: 'module'; id: string; title: string }
  | {
      kind: 'sourceDocument';
      id: string;
      title: string;
      noun: 'video' | 'document';
    };

export type AssignmentSuccessLocationState = {
  entityKind?: AssignmentSuccessEntityKind;
  entityId?: string;
  entityName?: string;
  /** @deprecated Prefer entityId when entityKind is module. */
  moduleId?: string;
  /** @deprecated Prefer entityName when entityKind is module. */
  moduleName?: string;
  assignedAt?: string;
  assignedCount?: number;
  assignedUsers?: AssignedUserEntry[];
  removedUsers?: AssignedUserEntry[];
  assignmentType?: AssignmentSummaryType | 'individual' | 'group';
};

export type OpenDocumentAssignmentState = {
  openDocumentAssignment?: {
    sourceDocumentId: string;
    title: string;
    noun: 'document' | 'video';
  };
};

export function resolveAssignmentSuccessEntityKind(
  state: AssignmentSuccessLocationState,
): AssignmentSuccessEntityKind {
  if (state.entityKind) return state.entityKind;
  if (state.moduleId) return 'module';
  return 'module';
}

export function resolveAssignmentSuccessEntityId(
  state: AssignmentSuccessLocationState,
): string | undefined {
  return state.entityId ?? state.moduleId;
}

export function resolveAssignmentSuccessEntityName(
  state: AssignmentSuccessLocationState,
  fallback: string,
): string {
  return state.entityName ?? state.moduleName ?? fallback;
}

export function assignmentEntityKindFromTarget(
  target: AssignmentDialogTargetForSuccess,
): AssignmentSuccessEntityKind {
  if (target.kind === 'module') return 'module';
  return target.noun === 'video' ? 'video' : 'document';
}

export function buildAssignmentSuccessLocationState(
  target: AssignmentDialogTargetForSuccess,
  details: {
    assignmentType?: AssignmentSummaryType;
    assignedUsers: AssignedUserEntry[];
    removedUsers: AssignedUserEntry[];
    assignedCount: number;
    assignedAt: string;
  },
): AssignmentSuccessLocationState {
  const entityKind = assignmentEntityKindFromTarget(target);
  const base: AssignmentSuccessLocationState = {
    entityKind,
    entityId: target.id,
    entityName: target.title,
    assignedAt: details.assignedAt,
    assignedCount: details.assignedCount,
    assignedUsers: details.assignedUsers,
    removedUsers: details.removedUsers,
    ...(details.assignmentType
      ? { assignmentType: details.assignmentType }
      : {}),
  };

  if (entityKind === 'module') {
    return {
      ...base,
      moduleId: target.id,
      moduleName: target.title,
    };
  }

  return base;
}
