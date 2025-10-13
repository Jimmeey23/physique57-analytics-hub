import React, { useRef, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyTableButton from './CopyTableButton';
import { cn } from '@/lib/utils';

interface TableCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showCopyButton?: boolean;
  headerControls?: React.ReactNode;
}

export const TableCard = forwardRef<HTMLDivElement, TableCardProps>(({
  title,
  subtitle,
  children,
  className,
  showCopyButton = true,
  headerControls
}, ref) => {
  const tableRef = useRef<HTMLDivElement>(null);
  
  return (
    <Card className={cn("bg-white/95 backdrop-blur-sm border-0 shadow-xl", className)} ref={ref}>
      {(title || showCopyButton || headerControls) && (
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <CardTitle className="text-lg font-bold text-white">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-sm text-white/80 mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {headerControls}
              {showCopyButton && (
                <CopyTableButton 
                  tableRef={tableRef}
                  tableName={title || 'Table'}
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0" ref={tableRef}>
        {children}
      </CardContent>
    </Card>
  );
});

TableCard.displayName = 'TableCard';

export default TableCard;