import type { ModuleAssignment } from '../api/adminAssignmentApi';

export function formatAssignmentTarget(assignment: ModuleAssignment): string {
  switch (assignment.assignment_type) {
    case 'individual': {
      if (assignment.user?.name) {
        return `${assignment.user.role} - ${assignment.user.name}`;
      }
      if (assignment.user_id !== null) {
        return `User #${assignment.user_id}`;
      }
      return 'Unknown user';
    }
    case 'po_sk': {
      if (assignment.user?.name) {
        return `PO + SKs - ${assignment.user.name}`;
      }
      if (assignment.user_id !== null) {
        return `PO + SKs - User #${assignment.user_id}`;
      }
      return 'Unknown PO';
    }
    case 'geographical': {
      if (assignment.upazila) {
        return `Upazila - ${assignment.upazila}`;
      }
      return 'Unknown upazila';
    }
    case 'group': {
      if (assignment.tenant_id !== null) {
        return `Organization #${assignment.tenant_id}`;
      }
      return 'Unknown organization';
    }
    default: {
      const exhaustiveCheck: never = assignment.assignment_type;
      return exhaustiveCheck;
    }
  }
}
