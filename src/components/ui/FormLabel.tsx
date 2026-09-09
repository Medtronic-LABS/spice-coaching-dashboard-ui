import {
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from 'react';
import { typographyClasses } from '@/components/ui/typographyClasses';
import { cn } from '@/utils';

export type FormLabelSize = 'default' | 'compact';

type FormLabelBaseProps = {
  children: ReactNode;
  /** When true, appends a required asterisk after the label text. */
  required?: boolean;
  /**
   * `default` — 14px semibold primary text for forms and modals.
   * `compact` — 12px semibold for dense filter drawers and grids.
   */
  size?: FormLabelSize;
  className?: string;
};

export type FormLabelProps = FormLabelBaseProps &
  (
    | (LabelHTMLAttributes<HTMLLabelElement> & { htmlFor: string })
    | (HTMLAttributes<HTMLSpanElement> & { htmlFor?: undefined })
  );

const sizeClassName: Record<FormLabelSize, string> = {
  default: typographyClasses.formLabelDefault,
  compact: typographyClasses.formLabelCompact,
};

/**
 * FormLabel — shared label typography for fields. Prefer this over inline
 * `text-xs` / `text-sm` classes on form labels.
 */
export const FormLabel = ({
  children,
  required = false,
  size = 'default',
  className,
  htmlFor,
  ...rest
}: FormLabelProps) => {
  const classes = cn(sizeClassName[size], className);
  const content = (
    <>
      {children}
      {required ? (
        <span className="text-spice-semantic-error" aria-hidden>
          {' '}
          *
        </span>
      ) : null}
    </>
  );

  if (htmlFor !== undefined) {
    return (
      <label htmlFor={htmlFor} className={classes} {...rest}>
        {content}
      </label>
    );
  }

  return (
    <span className={classes} {...rest}>
      {content}
    </span>
  );
};
