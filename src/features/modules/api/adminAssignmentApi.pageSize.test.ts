import { describe, expect, it } from 'vitest';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  ASSIGNMENT_USERS_PAGE_SIZE,
} from '@/features/modules/api/adminAssignmentApi';

describe('assignment list page sizes', () => {
  it('uses API-max page size for users, districts, and upazilas', () => {
    expect(ASSIGNMENT_USERS_PAGE_SIZE).toBe(200);
    expect(ASSIGNMENT_LIST_PAGE_SIZE).toBe(200);
  });
});
