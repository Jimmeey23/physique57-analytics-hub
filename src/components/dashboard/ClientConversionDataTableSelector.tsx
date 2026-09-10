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
          <h2 className="text-lg font-semibold text-slate-900">Retention analysis</h2>
          <span role="status" className="text-xs text-slate-600">
            {isPending ? 'Loading view…' : `${dataLength.toLocaleString()} records`}
          </span>
        </div>
        <nav aria-label="Retention analysis views" className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TABLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={activeTable === option.key}
                onClick={() => onTableChange(option.key)}
                className={`flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${activeTable === option.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
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
