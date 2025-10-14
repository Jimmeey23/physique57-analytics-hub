import React, { useEffect, useState } from 'react';
import { UniversalLoader } from '@/components/ui/UniversalLoader';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

export const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage, progress, steps, currentStepId } = useGlobalLoading();
  const [visible, setVisible] = useState(false);

  // Smooth enter/exit visibility with a tiny delay on exit to show 100%
  useEffect(() => {
    let t: any;
    if (isLoading) {
      setVisible(true);
    } else {
      // allow last frame to reach 100% visually
      t = setTimeout(() => setVisible(false), 150);
    }
    return () => clearTimeout(t);
  }, [isLoading]);

  if (!visible) return null;

  // Extract variant from loading message or default to 'default'
  const getVariantFromMessage = (message: string): 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'default' => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) return 'sales';
    if (lowerMessage.includes('discount') || lowerMessage.includes('promotion')) return 'discounts';
    if (lowerMessage.includes('funnel') || lowerMessage.includes('lead')) return 'funnel';
    if (lowerMessage.includes('retention') || lowerMessage.includes('conversion')) return 'retention';
    if (lowerMessage.includes('attendance') || lowerMessage.includes('class')) return 'attendance';
    if (lowerMessage.includes('analytics') || lowerMessage.includes('performance')) return 'analytics';
    return 'default';
  };

  const variant = getVariantFromMessage(loadingMessage);
  const currentStep = currentStepId ? steps.find(s => s.id === currentStepId)?.name : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-violet-100/90 via-purple-50/80 to-pink-100/70 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/30"></div>
      <div className="relative z-10">
        <UniversalLoader 
          variant={variant}
          subtitle={loadingMessage}
          progress={progress}
          showSteps={steps.length > 0}
          currentStep={currentStep}
        />
      </div>
    </div>
  );
};