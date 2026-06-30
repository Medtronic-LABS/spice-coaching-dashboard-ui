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
  info: 'bg-spice-semantic-infoBg text-spice-semantic-info ring-spice-semantic-info/25',
  success:
    'bg-spice-semantic-successBg text-spice-semantic-success ring-spice-semantic-success/25',
  warning:
    'bg-spice-semantic-warningBg text-spice-semantic-warning ring-spice-semantic-warning/25',
  critical:
    'bg-spice-semantic-errorBg text-spice-semantic-error ring-spice-semantic-error/25',
};

export const Banner = ({ children, tone = 'info' }: BannerProps) => {
  return (
    <div className={cn('rounded-lg p-3 text-sm ring-1', toneClassMap[tone])}>
      {children}
    </div>
  );
};
