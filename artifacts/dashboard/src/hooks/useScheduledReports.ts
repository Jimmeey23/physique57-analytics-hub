
import { useState, useEffect } from 'react';

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  lastRun?: string;
  enabled: boolean;
  sections: string[];
}

const STORAGE_KEY = 'p57-scheduled-reports';

export const useScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse scheduled reports', e);
      }
    }
  }, []);

  const saveReports = (newReports: ScheduledReport[]) => {
    setReports(newReports);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
  };

  const addReport = (report: Omit<ScheduledReport, 'id'>) => {
    const newReport: ScheduledReport = {
      ...report,
      id: crypto.randomUUID(),
    };
    saveReports([...reports, newReport]);
  };

  const updateReport = (id: string, updates: Partial<ScheduledReport>) => {
    saveReports(reports.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteReport = (id: string) => {
    saveReports(reports.filter(r => r.id !== id));
  };

  return {
    reports,
    addReport,
    updateReport,
    deleteReport
  };
};
