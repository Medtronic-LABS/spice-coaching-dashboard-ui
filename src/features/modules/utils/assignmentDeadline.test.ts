import { describe, expect, it } from 'vitest';
import {
  addDaysToDate,
  formatAssignmentDeadlineLabel,
  getAssignmentDeadlineDate,
} from './assignmentDeadline';

describe('assignmentDeadline', () => {
  it('adds days to an assignment date', () => {
    const assignmentDate = new Date('2026-04-14T10:00:00Z');
    const deadline = addDaysToDate(assignmentDate, 30);

    expect(deadline.toISOString().slice(0, 10)).toBe('2026-05-14');
  });

  it('formats the deadline label', () => {
    const deadline = new Date('2026-04-28T10:00:00Z');

    expect(formatAssignmentDeadlineLabel(deadline, 'en-GB')).toBe(
      'Tue, 28 Apr 2026',
    );
  });

  it('derives deadline date from config duration days', () => {
    const assignmentDate = new Date('2026-04-14T10:00:00Z');
    const deadline = getAssignmentDeadlineDate(assignmentDate, 14);

    expect(deadline?.toISOString().slice(0, 10)).toBe('2026-04-28');
  });

  it('returns null for zero, over-max, or invalid duration values', () => {
    const assignmentDate = new Date('2026-04-14T10:00:00Z');

    expect(getAssignmentDeadlineDate(assignmentDate, 0)).toBeNull();
    expect(getAssignmentDeadlineDate(assignmentDate, '0')).toBeNull();
    expect(getAssignmentDeadlineDate(assignmentDate, '1e2')).toBeNull();
    expect(getAssignmentDeadlineDate(assignmentDate, '')).toBeNull();
    expect(getAssignmentDeadlineDate(assignmentDate, 366)).toBeNull();
  });
});
