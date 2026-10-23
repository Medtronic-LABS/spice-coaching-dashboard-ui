import * as React from 'react';
import { PageSubtitle } from '@/components/ui/Typography';
import { typographyClasses } from '@/components/ui/typographyClasses';
import { cn } from '@/utils';

export type PageTitleProps = Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  'children'
> & {
  title: string;
  /** Optional secondary line rendered below the title. */
  subtitle?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
};

export function PageTitle({
  title,
  subtitle,
  as: Comp = 'h1',
  className,
  ...props
}: PageTitleProps) {
  return (
    <div>
      <Comp className={cn(typographyClasses.pageTitle, className)} {...props}>
        {title}
      </Comp>
      {subtitle ? <PageSubtitle>{subtitle}</PageSubtitle> : null}
    </div>
  );
}
