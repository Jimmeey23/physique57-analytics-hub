import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TablePagerProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
  /** Show the rows-per-page selector */
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Max numbered buttons in the sliding window */
  windowSize?: number;
}

/** Sliding-window page numbers that handle start/end edges correctly. */
function pageWindow(page: number, totalPages: number, windowSize: number): number[] {
  const size = Math.min(windowSize, totalPages);
  let start = page - Math.floor(size / 2);
  start = Math.max(1, Math.min(start, totalPages - size + 1));
  return Array.from({ length: size }, (_, i) => start + i);
}

/**
 * Single uniform pagination control for all data tables:
 * "Showing x to y of z" + optional page-size select + Prev / numbered window / Next.
 */
export const TablePager: React.FC<TablePagerProps> = ({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'items',
  className,
  showPageSize = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  windowSize = 5,
}) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn('flex items-center justify-between mt-4 flex-wrap gap-4', className)}>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {start} to {end} of {totalItems} {itemLabel}
        </div>
        {showPageSize && onPageSizeChange && (
          <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pageWindow(page, totalPages, windowSize).map((pageNum) => (
            <Button
              key={pageNum}
              variant={page === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TablePager;
