import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';

function focusElement(selector: string): boolean {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) return false;
  node.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    node.focus?.();
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement
    ) {
      const end = node.value.length;
      try {
        node.setSelectionRange(end, end);
      } catch {
        // Some input types do not support selection APIs.
      }
    }
  }, 50);
  return true;
}

/** Focus/scroll to a draft validation issue on the current page when possible. */
export function focusAdminModuleDraftIssue(issue: AdminModuleDraftIssue): void {
  if (issue.kind === 'card') {
    if (issue.field === 'title') {
      if (focusElement('[data-card-editor-field="title"] input')) {
        return;
      }
      focusElement('[data-card-editor-field="title"]');
      return;
    }
    // Prefer the ProseMirror surface when present.
    if (focusElement('[data-card-editor-field="body"] .ProseMirror')) {
      return;
    }
    focusElement('[data-card-editor-field="body"]');
    return;
  }

  if (issue.field === 'explanation') {
    focusElement(`[data-quiz-explanation-id="${CSS.escape(issue.itemId)}"]`);
    return;
  }

  const field = issue.field === 'options' ? 'options' : 'question';
  focusElement(
    `[data-quiz-question-id="${CSS.escape(issue.itemId)}"] [data-quiz-field="${field}"]`,
  );
}
