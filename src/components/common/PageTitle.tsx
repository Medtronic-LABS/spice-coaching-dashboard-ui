import * as React from 'react';
import { cn } from '@/utils';

export type PageTitleProps = Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  'children'
> & {
  title: string;
  as?: 'h1' | 'h2' | 'h3';
};

export default function PageTitle({
  title,
  as: Comp = 'h2',
  className,
  ...props
}: PageTitleProps) {
  return (
    <Comp
      className={cn('text-2xl font-semibold text-slate-900', className)}
      {...props}
    >
      {title}
    </Comp>
  );
}
