import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';

export const usePayrollData = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseNumericValue = (value: string | number): number => {
    // Accept numbers directly
    if (typeof value === 'number') {
      // Sheets with UNFORMATTED_VALUE will already give numbers
      return isNaN(value) ? 0 : value;
    }
    if (!value || value === '') return 0;
    // Strip everything except digits, minus and decimal point
    const cleaned = value.toString().replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the local API endpoint instead of Google Sheets directly
      const response = await fetch('/api/payroll');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // The API endpoint already returns processed PayrollData objects
      setData(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payroll data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  return { data, isLoading, error, refetch: fetchPayrollData };
};
