import React, { memo } from 'react';
import { RETENTION_TABLE_OPTIONS as TABLE_OPTIONS } from './retentionTableOptions';

interface ClientConversionDataTableSelectorProps {
  activeTable: string;
  onTableChange: (table: string) => void;
  dataLength: number;
  isPending?: boolean;
}

export const ClientConversionDataTableSelector: React.FC<ClientConversionDataTableSelectorProps> = memo(
  ({ activeTable, onTableChange, dataLength, isPending = false }) => {
    const activeOption = TABLE_OPTIONS.find((option) => option.key === activeTable) ?? TABLE_OPTIONS[0];
    return (
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-slate-900">Retention analysis</h2>
          <span role="status" className="text-xs text-slate-600">
            {isPending ? 'Loading view…' : `${dataLength.toLocaleString()} records`}
          </span>
        </div>
        <nav
          aria-label="Retention analysis views"
          className="p57-tablist flex flex-wrap gap-1 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)] p-1.5 shadow-[0_10px_26px_-18px_rgba(14,23,41,0.55)] dark:border-[#2a2a2e] dark:bg-[linear-gradient(180deg,#141416_0%,#0f0f11_100%)]"
        >
          {TABLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = activeTable === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                data-state={active ? 'active' : 'inactive'}
                onClick={() => onTableChange(option.key)}
                className="p57-tabtrigger inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] font-bold tracking-[-0.01em] text-slate-500 transition-all duration-150 hover:-translate-y-[1px] hover:bg-white hover:text-slate-900 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </nav>
        <p className="text-sm text-slate-600">{activeOption.description}</p>
      </div>
    );
  }
);

ClientConversionDataTableSelector.displayName = 'ClientConversionDataTableSelector';
