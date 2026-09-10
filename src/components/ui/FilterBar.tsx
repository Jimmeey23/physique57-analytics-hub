import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  label?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Canonical filter container: panel strip with labeled control slots.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  label = 'Filters',
  children,
  actions,
  className,
}) => {
  return (
    <div className={cn('p57-filterbar', className)}>
      <span className="p57-filterbar-label">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="hidden h-5 w-px bg-border sm:inline-block" />
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export const FilterField: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}> = ({ label, children, className, minWidth = '150px' }) => {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)} style={{ minWidth }}>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
};

export default FilterBar;
