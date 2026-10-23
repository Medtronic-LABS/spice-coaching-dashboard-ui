import { type HTMLAttributes, type ReactNode } from 'react';
import { typographyClasses } from '@/components/ui/typographyClasses';
import { cn } from '@/utils';

export interface FormHelperTextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

/**
 * FormHelperText
 * Caption or hint text under form fields — use instead of inline `text-xs` classes.
 */
export const FormHelperText = ({
  children,
  className,
  ...rest
}: FormHelperTextProps) => {
  return (
    <p className={cn(typographyClasses.formHelper, className)} {...rest}>
      {children}
    </p>
  );
};
