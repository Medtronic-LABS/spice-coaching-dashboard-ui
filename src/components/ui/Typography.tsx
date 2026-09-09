import * as React from 'react';
import { cn } from '@/utils';
import { typographyClasses } from '@/components/ui/typographyClasses';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type TypographyBaseProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * PageSubtitle — secondary line under a page title.
 */
export type PageSubtitleProps = TypographyBaseProps &
  React.HTMLAttributes<HTMLParagraphElement>;

export const PageSubtitle = ({
  children,
  className,
  ...props
}: PageSubtitleProps) => (
  <p className={cn(typographyClasses.pageSubtitle, className)} {...props}>
    {children}
  </p>
);

/**
 * ModalTitle — dialog and modal headings.
 */
export type ModalTitleProps = TypographyBaseProps &
  Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'> & {
    as?: HeadingTag;
    id?: string;
  };

export const ModalTitle = ({
  children,
  className,
  as: Comp = 'h2',
  ...props
}: ModalTitleProps) => (
  <Comp className={cn(typographyClasses.modalTitle, className)} {...props}>
    {children}
  </Comp>
);

/**
 * CardTitle — in-card section headings.
 */
export type CardTitleProps = TypographyBaseProps &
  Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'> & {
    as?: HeadingTag;
  };

export const CardTitle = ({
  children,
  className,
  as: Comp = 'h3',
  ...props
}: CardTitleProps) => (
  <Comp className={cn(typographyClasses.cardTitle, className)} {...props}>
    {children}
  </Comp>
);

type FieldGroupLabelTag = 'div' | 'p' | 'h3' | 'h4' | 'span';

/**
 * FieldGroupLabel — uppercase micro-labels for field groups and metadata rows.
 */
export type FieldGroupLabelProps = TypographyBaseProps &
  React.HTMLAttributes<HTMLElement> & {
    as?: FieldGroupLabelTag;
  };

export const FieldGroupLabel = ({
  children,
  className,
  as: Comp = 'div',
  ...props
}: FieldGroupLabelProps) => (
  <Comp className={cn(typographyClasses.fieldGroupLabel, className)} {...props}>
    {children}
  </Comp>
);
