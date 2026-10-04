import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type P57SortDir = 'asc' | 'desc';

export function useSortableData<T>(
  rows: T[],
  getValue: (row: T, key: string) => string | number | null | undefined,
  initialKey?: string,
  initialDir: P57SortDir = 'desc'
): {
  rows: T[];
  sortKey: string | null;
  sortDir: P57SortDir;
  toggleSort: (key: string) => void;
} {
  const [sortKey, setSortKey] = useState<string | null>(initialKey ?? null);
  const [sortDir, setSortDir] = useState<P57SortDir>(initialDir);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'en-IN');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, getValue]);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
    } else {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    }
  };

  return { rows: sorted, sortKey, sortDir, toggleSort };
}

export interface P57SortThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  activeKey: string | null;
  dir: P57SortDir;
  onToggle: (key: string) => void;
  align?: 'left' | 'center' | 'right';
}

/**
 * Canonical sortable header cell. Click toggles desc → asc.
 * Renders inside any `.p57-scope` thead.
 */
export const P57SortTh: React.FC<P57SortThProps> = ({
  sortKey,
  activeKey,
  dir,
  onToggle,
  align = 'left',
  className,
  children,
  ...rest
}) => {
  const active = activeKey === sortKey;
  // The sort glyph is positioned out of flow so it never pushes the header
  // label off the column's data alignment. Padding keeps them from colliding.
  const iconOnLeft = align === 'right';
  return (
    <th
      {...rest}
      data-sortable="true"
      data-align={align}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => onToggle(sortKey)}
      className={cn(
        'relative',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        // Centered columns reserve a gutter on both sides so the label stays on
        // the column's centre line; edge-aligned columns reserve only the side
        // the glyph sits on.
        align === 'center' ? 'px-5' : iconOnLeft ? 'pl-5' : 'pr-5',
        className
      )}
    >
      {children}
      <span
        className={cn(
          'p57-sort-ic absolute top-1/2 -translate-y-1/2',
          iconOnLeft ? 'left-1' : 'right-1',
          active && 'p57-sort-pop'
        )}
        data-active={active}
      >
        {active ? (
          dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3" />
        )}
      </span>
    </th>
  );
};

export default P57SortTh;
