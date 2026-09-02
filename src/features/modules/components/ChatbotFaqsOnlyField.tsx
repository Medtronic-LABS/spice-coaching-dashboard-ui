import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

export interface ChatbotFaqsOnlyFieldProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

/** Shared checkbox for marking a module as chatbot FAQ-only (not assignable to SKs/POs). */
export function ChatbotFaqsOnlyField({
  checked,
  disabled = false,
  onChange,
}: ChatbotFaqsOnlyFieldProps) {
  return (
    <label className="flex min-h-10 items-start gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5">
      <input
        type="checkbox"
        className={cn(SPICE_CHECKBOX_CLASSNAME, 'mt-0.5')}
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-spice-text-medium">
        <span className="font-semibold text-spice-text-primary">
          Chatbot FAQs Only
        </span>
        <span className="mt-0.5 block text-xs text-spice-text-muted">
          Published FAQ-only modules are available for chatbot Q&A and cannot be
          assigned to SKs or POs.
        </span>
      </span>
    </label>
  );
}
