import React from 'react';
import { UltimateLoader } from './UltimateLoader';

interface UniversalLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'cancellations' | 'payroll' | 'expirations' | 'default';
  onComplete?: () => void;
  progress?: number;
  showSteps?: boolean;
  currentStep?: string;
}

const VARIANT_SUBTITLES: Record<string, string> = {
  sales: 'Loading Sales Analytics…',
  discounts: 'Loading Discount Analysis…',
  funnel: 'Loading Funnel & Lead Data…',
  retention: 'Loading Retention Metrics…',
  attendance: 'Loading Class Attendance…',
  analytics: 'Loading Analytics Dashboard…',
  cancellations: 'Loading Late Cancellations…',
  payroll: 'Loading Payroll Data…',
  expirations: 'Loading Expiration Analytics…',
  default: 'Analytics Hub',
};

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  title = 'PHYSIQUE 57',
  subtitle,
  variant = 'default',
  onComplete,
}) => {
  return (
    <UltimateLoader
      title={title}
      subtitle={subtitle || VARIANT_SUBTITLES[variant] || VARIANT_SUBTITLES.default}
      onComplete={onComplete}
    />
  );
};

export default UniversalLoader;
