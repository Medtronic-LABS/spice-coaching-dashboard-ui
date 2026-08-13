import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';

export type AdminModuleDraftIssueItemGroup = {
  kind: 'card' | 'quiz';
  itemId: string;
  index: number;
  label: string;
  issues: AdminModuleDraftIssue[];
};

export type AdminModuleDraftIssueKindGroup = {
  kind: 'card' | 'quiz';
  title: string;
  items: AdminModuleDraftIssueItemGroup[];
};

function itemLabel(issue: AdminModuleDraftIssue): string {
  return issue.kind === 'card'
    ? `Card ${issue.index + 1}`
    : `Quiz question ${issue.index + 1}`;
}

/** Group issues by Cards then Quiz, and by item within each kind. */
export function groupAdminModuleDraftIssues(
  issues: AdminModuleDraftIssue[],
): AdminModuleDraftIssueKindGroup[] {
  const kindOrder: Array<'card' | 'quiz'> = ['card', 'quiz'];
  const byKind = new Map<'card' | 'quiz', AdminModuleDraftIssue[]>();

  for (const issue of issues) {
    const list = byKind.get(issue.kind) ?? [];
    list.push(issue);
    byKind.set(issue.kind, list);
  }

  return kindOrder.flatMap((kind) => {
    const kindIssues = byKind.get(kind);
    if (!kindIssues?.length) return [];

    const itemOrder: string[] = [];
    const byItem = new Map<string, AdminModuleDraftIssueItemGroup>();

    for (const issue of kindIssues) {
      const existing = byItem.get(issue.itemId);
      if (existing) {
        existing.issues.push(issue);
        continue;
      }
      itemOrder.push(issue.itemId);
      byItem.set(issue.itemId, {
        kind: issue.kind,
        itemId: issue.itemId,
        index: issue.index,
        label: itemLabel(issue),
        issues: [issue],
      });
    }

    return [
      {
        kind,
        title: kind === 'card' ? 'Cards' : 'Quiz',
        items: itemOrder.map((id) => byItem.get(id)!),
      },
    ];
  });
}

/** Short text under a grouped item heading (drops the repeated "Card N" / "Quiz question N" prefix). */
export function shortAdminModuleDraftIssueText(
  issue: AdminModuleDraftIssue,
  groupLabel: string,
): string {
  const prefix = `${groupLabel} `;
  if (issue.message.toLowerCase().startsWith(prefix.toLowerCase())) {
    const rest = issue.message.slice(prefix.length).trim();
    if (!rest) return issue.message;
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return issue.message;
}
