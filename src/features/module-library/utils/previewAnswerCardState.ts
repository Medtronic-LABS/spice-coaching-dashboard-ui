export type PreviewAnswerCardState =
  | 'unselected'
  | 'selected'
  | 'correct_revealed'
  | 'wrong_revealed';

export function resolvePreviewAnswerCardState(
  optionIndex: number,
  selectedIndex: number | null,
  correctIndex: number,
  isRevealed: boolean,
): PreviewAnswerCardState {
  if (!isRevealed) {
    if (selectedIndex === optionIndex) return 'selected';
    return 'unselected';
  }

  if (optionIndex === correctIndex) return 'correct_revealed';
  if (selectedIndex === optionIndex) return 'wrong_revealed';
  return 'unselected';
}
