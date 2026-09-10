import React from 'react';
import { AlertTriangle, Inbox, LucideIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<StateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn('p57-state', className)}>
    <span className="p57-state-icon">
      <Icon className="h-5 w-5" />
    </span>
    <p className="font-display text-[15px] font-bold">{title}</p>
    {description && <p className="max-w-md text-[13px] text-muted-foreground">{description}</p>}
    {action}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title = 'Something went wrong', description, onRetry, className }) => (
  <div className={cn('p57-state', className)}>
    <span className="p57-state-icon bg-[#fdeeee] text-[#c23333] dark:bg-[rgba(224,82,82,0.18)] dark:text-[#fb7185]">
      <AlertTriangle className="h-5 w-5" />
    </span>
    <p className="font-display text-[15px] font-bold">{title}</p>
    {description && <p className="max-w-md text-[13px] text-muted-foreground">{description}</p>}
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 gap-2">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    )}
  </div>
);

export const LoadingState: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className }) => (
  <div className={cn('p57-card space-y-3 p-5', className)}>
    <div className="p57-skeleton h-5 w-44" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p57-skeleton h-9 w-full" style={{ animationDelay: `${i * 90}ms` }} />
    ))}
  </div>
);

export default EmptyState;
