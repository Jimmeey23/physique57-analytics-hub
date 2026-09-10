import React from 'react';
import { cn } from '@/lib/utils';

export type P57BadgeTone = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'slate';

/**
 * Canonical in-table badge — fixed 22px height / 52px min-width geometry
 * (see .p57-badge in index.css) so badges align across every table.
 */
export const P57Badge: React.FC<{
  tone?: P57BadgeTone;
  className?: string;
  children: React.ReactNode;
  title?: string;
}> = ({ tone = 'slate', className, children, title }) => (
  <span className={cn('p57-badge', `p57-badge-${tone}`, className)} title={title}>
    {children}
  </span>
);

export default P57Badge;
