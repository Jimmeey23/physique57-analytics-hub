import React, { memo } from 'react';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { RETENTION_TABLE_OPTIONS as TABLE_OPTIONS } from './retentionTableOptions';

interface ClientConversionDataTableSelectorProps {
  activeTable: string;
  onTableChange: (table: string) => void;
  dataLength: number;
  isPending?: boolean;
}

export const ClientConversionDataTableSelector: React.FC<ClientConversionDataTableSelectorProps> = memo(
  ({ activeTable, onTableChange, dataLength, isPending = false }) => (
    <SectionTabs
      ariaLabel="Retention analysis views"
      heading="Retention analysis"
      meta={isPending ? 'Loading view…' : `${dataLength.toLocaleString()} records`}
      options={TABLE_OPTIONS}
      value={activeTable}
      onChange={onTableChange}
    />
  )
);

ClientConversionDataTableSelector.displayName = 'ClientConversionDataTableSelector';
