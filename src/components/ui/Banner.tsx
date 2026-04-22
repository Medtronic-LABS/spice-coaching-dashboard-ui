import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Banner
 * Full-width callout message for important context or warnings.
 *
 * Usage:
 * <Banner tone="warning">Attention needed</Banner>
 */
export interface BannerProps {
  /** Banner body content, usually short alert text. */
  children: ReactNode;
  /** Semantic color tone. Defaults to `info`. */
  tone?: 'info' | 'success' | 'warning' | 'critical';
}

const toneClassMap: Record<NonNullable<BannerProps['tone']>, string> = {
  info: 'bg-blue-50 text-blue-800 ring-blue-200',
  success: 'bg-green-50 text-green-800 ring-green-200',
  warning: 'bg-yellow-50 text-yellow-900 ring-yellow-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
};

export const Banner = ({ children, tone = 'info' }: BannerProps) => {
  return (
    <div className={cn('rounded-lg p-3 text-sm ring-1', toneClassMap[tone])}>
      {children}
    </div>
  );
};
