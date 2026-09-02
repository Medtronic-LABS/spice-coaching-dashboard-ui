import { Button, Card } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { OVERLAY_Z_INDEX } from '@/components/ui/overlayZIndex';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import {
  groupAdminModuleDraftIssues,
  shortAdminModuleDraftIssueText,
} from '@/features/modules/utils/groupAdminModuleDraftIssues';

export interface AdminModuleDraftValidationDialogProps {
  open: boolean;
  issues: AdminModuleDraftIssue[];
  onClose: () => void;
  onReviewIssue: (issue: AdminModuleDraftIssue) => void;
}

export function AdminModuleDraftValidationDialog({
  open,
  issues,
  onClose,
  onReviewIssue,
}: AdminModuleDraftValidationDialogProps) {
  if (!open || issues.length === 0) return null;

  const firstIssue = issues[0];
  const kindGroups = groupAdminModuleDraftIssues(issues);

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="admin-module-draft-validation-title"
      describedBy="admin-module-draft-validation-description"
      contentClassName="max-w-lg"
      zIndexClassName={OVERLAY_Z_INDEX.modalRaised}
    >
      <Card
        variant="elevated"
        className="w-full space-y-4 border-spice-border p-4 pr-12 shadow-lg sm:p-6 sm:pr-14"
      >
        <div className="space-y-2">
          <h2
            id="admin-module-draft-validation-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Can&apos;t save yet
          </h2>
          <p
            id="admin-module-draft-validation-description"
            className="text-sm text-spice-text-muted"
          >
            Fix the items below, then try saving again.
          </p>
        </div>

        <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-spice-border bg-spice-bg-tint/40 p-3">
          {kindGroups.map((kindGroup) => (
            <section key={kindGroup.kind} className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-spice-text-muted uppercase">
                {kindGroup.title}
              </h3>
              <div className="space-y-3">
                {kindGroup.items.map((item) => (
                  <div
                    key={`${item.kind}-${item.itemId}`}
                    className="space-y-1"
                  >
                    <div className="px-2 text-sm font-semibold text-spice-text-primary">
                      {item.label}
                    </div>
                    <ul className="list-disc space-y-1 pl-6">
                      {item.issues.map((issue) => (
                        <li
                          key={`${issue.kind}-${issue.itemId}-${issue.field}-${issue.message}`}
                        >
                          <button
                            type="button"
                            className="w-full rounded-md py-1 text-left text-sm text-spice-text-primary transition-colors hover:bg-spice-bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30"
                            onClick={() => onReviewIssue(issue)}
                          >
                            {shortAdminModuleDraftIssueText(issue, item.label)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {firstIssue ? (
            <Button
              className="h-9 text-xs"
              onClick={() => onReviewIssue(firstIssue)}
            >
              Review first issue
            </Button>
          ) : null}
        </div>
      </Card>
    </Modal>
  );
}
