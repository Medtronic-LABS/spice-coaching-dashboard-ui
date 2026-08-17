import { DISPLAY_LABEL_MAX_LENGTH } from '@/constants/fieldLimits';
import {
  isDisplayTextTruncated,
  truncateDisplayText,
} from '@/utils/truncateDisplayText';
import { cn } from '@/utils';

export interface QuotedDisplayLabelProps {
  text: string;
  className?: string;
  maxLength?: number;
}

/** Renders a quoted label, truncating with an ellipsis when too long for modals. */
export function QuotedDisplayLabel({
  text,
  className,
  maxLength = DISPLAY_LABEL_MAX_LENGTH,
}: QuotedDisplayLabelProps) {
  const trimmed = text.trim();
  const display = truncateDisplayText(trimmed, maxLength);

  return (
    <span
      className={cn('font-medium text-spice-text-primary', className)}
      title={isDisplayTextTruncated(trimmed, maxLength) ? trimmed : undefined}
    >
      “{display}”
    </span>
  );
}
