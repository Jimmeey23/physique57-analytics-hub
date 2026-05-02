import { useState, useEffect, useCallback } from 'react';

export type AuditAction = 'navigate' | 'export' | 'filter_change' | 'upload' | 'view_drilldown';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  detail: string;
  page: string;
  timestamp: string;
  tabKey?: string;
}

const STORAGE_KEY = 'p57-audit-log';
const MAX_ENTRIES = 200;

export const logAuditEvent = (
  action: AuditAction,
  detail: string,
  page: string = window.location.pathname,
  tabKey?: string
) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const logs: AuditEntry[] = stored ? JSON.parse(stored) : [];
    
    const newEntry: AuditEntry = {
      id: crypto.randomUUID(),
      action,
      detail,
      page,
      timestamp: new Date().toISOString(),
      tabKey,
    };

    const updatedLogs = [newEntry, ...logs].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    
    // Dispatch a custom event to notify listeners (hooks in other components)
    window.dispatchEvent(new CustomEvent('p57-audit-log-updated'));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

export const useAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  const loadLogs = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEntries(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    
    const handleUpdate = () => loadLogs();
    window.addEventListener('p57-audit-log-updated', handleUpdate);
    return () => window.removeEventListener('p57-audit-log-updated', handleUpdate);
  }, [loadLogs]);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    window.dispatchEvent(new CustomEvent('p57-audit-log-updated'));
  }, []);

  return { entries, clear };
};
