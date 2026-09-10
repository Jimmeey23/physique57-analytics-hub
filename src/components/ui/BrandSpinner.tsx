import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface BrandSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** If true, only shows the ring without the center mark */
  ringOnly?: boolean;
  /** Optional accessible label for screen readers */
  ariaLabel?: string;
  /** Extra classes for the ring */
  ringClassName?: string;
  /** @deprecated logos are no longer used; kept for API compatibility */
  srcs?: string[];
}

const sizeMap: Record<SpinnerSize, { ring: string; mark: string; text: string }> = {
  xs: { ring: 'h-3.5 w-3.5', mark: 'h-3.5 w-3.5', text: 'text-[5px]' },
  sm: { ring: 'h-5 w-5', mark: 'h-5 w-5', text: 'text-[7px]' },
  md: { ring: 'h-8 w-8', mark: 'h-8 w-8', text: 'text-[10px]' },
  lg: { ring: 'h-12 w-12', mark: 'h-12 w-12', text: 'text-[13px]' },
};

/**
 * Sleek dual-tone brand spinner: soft track + royal-blue arc,
 * with a micro "57" tile at the center (md/lg only).
 */
export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  size = 'md',
  className,
  ringOnly = false,
  ariaLabel = 'Loading',
  ringClassName,
}) => {
  const sz = sizeMap[size];
  const showMark = !ringOnly && (size === 'md' || size === 'lg');
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', sz.ring, className)}
      role="status"
      aria-label={ariaLabel}
    >
      <span className={cn('p57-spin absolute inset-0', ringClassName)} aria-hidden="true" />
      {showMark && (
        <span
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-[6px] bg-gradient-to-br from-primary to-[hsl(var(--brand-deep))] font-display font-extrabold text-white',
            size === 'lg' ? 'h-6 w-6' : 'h-4 w-4',
            sz.text
          )}
        >
          57
        </span>
      )}
    </span>
  );
};

export default BrandSpinner;
