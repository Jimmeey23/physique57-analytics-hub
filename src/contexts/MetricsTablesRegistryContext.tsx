import React, { createContext, useContext, useRef, useCallback } from 'react';

interface RegisteredTable {
  id: string; // usually the title
  getTextContent: () => string; // tab-separated text representation
}

interface MetricsTablesRegistryContextValue {
  register: (table: RegisteredTable) => void;
  unregister: (id: string) => void;
  getAllTabsContent: () => string;
}

const MetricsTablesRegistryContext = createContext<MetricsTablesRegistryContextValue | null>(null);

export const MetricsTablesRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tablesRef = useRef<Map<string, RegisteredTable>>(new Map());

  const register = useCallback((table: RegisteredTable) => {
    tablesRef.current.set(table.id, table);
  }, []);

  const unregister = useCallback((id: string) => {
    tablesRef.current.delete(id);
  }, []);

  const getAllTabsContent = useCallback(() => {
    const parts: string[] = [];
    const dateStamp = new Date().toLocaleDateString();
    parts.push(`All Metrics Export\nDate: ${dateStamp}`);
    tablesRef.current.forEach((table, id) => {
      try {
        parts.push(`\n=== ${id} ===`);
        parts.push(table.getTextContent());
      } catch (err) {
        parts.push(`(Failed to extract table: ${id})`);
      }
    });
    return parts.join('\n');
  }, []);

  return (
    <MetricsTablesRegistryContext.Provider value={{ register, unregister, getAllTabsContent }}>
      {children}
    </MetricsTablesRegistryContext.Provider>
  );
};

export const useMetricsTablesRegistry = () => {
  const ctx = useContext(MetricsTablesRegistryContext);
  return ctx;
};
