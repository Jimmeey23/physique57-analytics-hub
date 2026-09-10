import React, { useState } from 'react';
import { BookOpenCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricDefinition {
  name: string;
  /** Short formula, e.g. "Σ checkedInCount ÷ Σ capacity × 100". */
  formula?: string;
  /** 1–3 sentence plain-language definition incl. filters/edge cases. */
  text: string;
}

export interface MetricDefinitionsProps {
  title?: string;
  subtitle?: string;
  items: MetricDefinition[];
}

/**
 * Collapsed metric-definition index pinned to the bottom of each tab.
 */
export const MetricDefinitions: React.FC<MetricDefinitionsProps> = ({
  title = 'Metric definitions',
  subtitle = 'How every number on this tab is computed',
  items,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="p57-defs" aria-label={title}>
      <button
        type="button"
        className="p57-defs-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="p57-shell-ic !h-8 !w-8" aria-hidden="true">
          <BookOpenCheck className="!h-4 !w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="p57-defs-title block">{title}</span>
          <span className="p57-defs-sub block">{subtitle} · {items.length} metrics</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="p57-defs-grid">
          {items.map((d) => (
            <article key={d.name} className="p57-def">
              <h4 className="p57-def-name">{d.name}</h4>
              {d.formula && <p className="p57-def-formula">{d.formula}</p>}
              <p className="p57-def-text">{d.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MetricDefinitions;
