import { CloseIcon } from '@/assets/icon';
import { Button } from '@/components/ui/Button';
import type {
  SnackbarItem,
  SnackbarTone,
} from '@/components/ui/Snackbar/snackbar.types';
import { cn } from '@/utils';

const toneClassMap: Record<SnackbarTone, string> = {
  info: 'bg-spice-bg-surface text-spice-text-primary ring-spice-semantic-info/30',
  success:
    'bg-spice-semantic-successBg text-spice-semantic-success ring-spice-semantic-success/30',
  warning:
    'bg-spice-semantic-warningBg text-spice-semantic-warning ring-spice-semantic-warning/30',
  critical:
    'bg-spice-semantic-errorBg text-spice-semantic-error ring-spice-semantic-error/30',
};

export interface SnackbarViewportProps {
  items: SnackbarItem[];
  onDismiss: (id: string) => void;
}

export const SnackbarViewport = ({
  items,
  onDismiss,
}: SnackbarViewportProps) => {
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[400] flex w-full max-w-lg -translate-x-1/2 flex-col gap-2 px-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ring-1',
            toneClassMap[item.tone],
          )}
        >
          <p className="min-w-0 flex-1 leading-relaxed">{item.message}</p>
          <Button
            type="button"
            variant="ghost"
            aria-label="Dismiss notification"
            className="h-7 w-7 shrink-0 p-0 text-current hover:bg-black/5"
            onClick={() => onDismiss(item.id)}
          >
            <CloseIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
};
