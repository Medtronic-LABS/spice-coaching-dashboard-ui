import type { PreviewAnswerCardState } from '@/features/module-library/utils/previewAnswerCardState';
import { cn } from '@/utils';

export interface PreviewAnswerCardProps {
  text: string;
  state: PreviewAnswerCardState;
  index: number;
  onSelect: () => void;
  disabled?: boolean;
}

const ANSWER_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

const stateClasses: Record<PreviewAnswerCardState, string> = {
  unselected: 'border-spice-border bg-white text-spice-text-primary',
  selected:
    'border-spice-brand-primary bg-spice-bg-tint text-spice-text-primary',
  correct_revealed: 'border-green-600 bg-green-50 text-spice-text-primary',
  wrong_revealed: 'border-red-600 bg-red-50 text-spice-text-primary',
};

export const PreviewAnswerCard = ({
  text,
  state,
  index,
  onSelect,
  disabled = false,
}: PreviewAnswerCardProps) => {
  const letter = ANSWER_LETTERS[index] ?? String(index + 1);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition disabled:cursor-default',
        stateClasses[state],
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          state === 'selected'
            ? 'bg-spice-brand-primary text-white'
            : state === 'correct_revealed'
              ? 'bg-green-600 text-white'
              : state === 'wrong_revealed'
                ? 'bg-red-600 text-white'
                : 'bg-spice-bg-tint text-spice-text-medium',
        )}
      >
        {letter}
      </span>
      <span>{text}</span>
    </button>
  );
};
