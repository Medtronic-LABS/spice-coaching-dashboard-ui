import * as React from 'react';
import { cn } from '@/utils';

export type PageTitleProps = Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  'children'
> & {
  title: string;
  as?: 'h1' | 'h2' | 'h3';
};

export function PageTitle({
  title,
  as: Comp = 'h2',
  className,
  ...props
}: PageTitleProps) {
  return (
    <Comp
      className={cn(
        'text-[30px] font-extrabold tracking-[-0.3px] text-spice-text-primary',
        className,
      )}
      {...props}
    >
      {title}
    </Comp>
  );
}
