import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Official Physique 57 brand mark. The logo carries dark text, so it always
 * sits on a white tile to stay legible in both themes.
 */
export const BrandLogo: React.FC<{
  className?: string;
  imgClassName?: string;
  tileClassName?: string;
}> = ({ className, imgClassName, tileClassName }) => {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-black/[0.06] dark:ring-white/10',
        className
      )}
    >
      <img
        src="/physique57-logo.png"
        alt="Physique 57"
        draggable={false}
        className={cn('h-full w-full object-contain p-[3px]', imgClassName, tileClassName)}
      />
    </span>
  );
};

export default BrandLogo;
