import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import { sortQuizItems } from '@/features/modules/utils/adminModuleQuizUtils';
import { cardBodyHasVisibleContent } from '@/features/modules/utils/cardBody';
import {
  readLocaleOptions,
  readLocaleRichBody,
  readLocaleText,
} from '@/types/localized';

export type AdminModuleDraftIssueField =
  | 'title'
  | 'body'
  | 'question'
  | 'options'
  | 'explanation';

export type AdminModuleDraftIssue = {
  kind: 'card' | 'quiz';
  /** 0-based index in the cards array or sorted quiz list. */
  index: number;
  itemId: string;
  field: AdminModuleDraftIssueField;
  message: string;
};

export class AdminModuleDraftValidationError extends Error {
  readonly code = 'admin_module_draft_invalid';
  readonly issues: AdminModuleDraftIssue[];

  constructor(issues: AdminModuleDraftIssue[]) {
    super(issues.map((issue) => issue.message).join(' '));
    this.name = 'AdminModuleDraftValidationError';
    this.issues = issues;
  }
}

export function isAdminModuleDraftValidationError(
  error: unknown,
): error is AdminModuleDraftValidationError {
  return error instanceof AdminModuleDraftValidationError;
}

function cardLabel(index: number, title: string): string {
  return title ? `Card ${index} ("${title}")` : `Card ${index}`;
}

function quizLabel(index: number): string {
  return `Quiz question ${index}`;
}

export function validateAdminModuleDraftContent(options: {
  cards: AdminModuleCard[];
  quiz: AdminModuleQuizItem[];
}): void {
  const locale = DEPLOYMENT_PRIMARY_LOCALE;
  const issues: AdminModuleDraftIssue[] = [];

  options.cards.forEach((card, index) => {
    const n = index + 1;
    const title = readLocaleText(card.title, locale).trim();
    const body = readLocaleRichBody(card.body, locale);
    const label = cardLabel(n, title);

    if (!title) {
      issues.push({
        kind: 'card',
        index,
        itemId: card.id,
        field: 'title',
        message: `${label} needs a title.`,
      });
    }
    if (!cardBodyHasVisibleContent(body)) {
      issues.push({
        kind: 'card',
        index,
        itemId: card.id,
        field: 'body',
        message: `${label} needs body content.`,
      });
    }
  });

  sortQuizItems(options.quiz).forEach((item, index) => {
    const n = index + 1;
    const label = quizLabel(n);
    const question = readLocaleText(item.question, locale).trim();
    const explanation = readLocaleText(item.explanation, locale).trim();
    const optionsForLocale = readLocaleOptions(item.options, locale);

    if (!question) {
      issues.push({
        kind: 'quiz',
        index,
        itemId: item.id,
        field: 'question',
        message: `${label} needs a question.`,
      });
    }

    if (optionsForLocale.length === 0) {
      issues.push({
        kind: 'quiz',
        index,
        itemId: item.id,
        field: 'options',
        message: `${label} needs answer options.`,
      });
    } else {
      const blankIndexes = optionsForLocale
        .map((opt, optIndex) => (opt.trim() ? null : optIndex + 1))
        .filter((value): value is number => value !== null);
      if (blankIndexes.length > 0) {
        issues.push({
          kind: 'quiz',
          index,
          itemId: item.id,
          field: 'options',
          message: `${label} has blank option${blankIndexes.length === 1 ? '' : 's'} (${blankIndexes.join(', ')}).`,
        });
      }
    }

    if (!explanation) {
      issues.push({
        kind: 'quiz',
        index,
        itemId: item.id,
        field: 'explanation',
        message: `${label} needs an explanation.`,
      });
    }
  });

  if (issues.length > 0) {
    throw new AdminModuleDraftValidationError(issues);
  }
}
