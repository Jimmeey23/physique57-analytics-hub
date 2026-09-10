import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardTitleProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Simple centered dashboard title block.
 */
const DashboardTitle: React.FC<DashboardTitleProps> = ({
  title = 'Business Intelligence Dashboard',
  subtitle = 'Physique 57 · India',
  className,
}) => {
  return (
    <div className={cn('text-center', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{subtitle}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      <div className="mx-auto mt-3 h-[3px] w-24 rounded-full bg-gradient-to-r from-primary to-[#6aa5ff]" />
    </div>
  );
};

export default DashboardTitle;
