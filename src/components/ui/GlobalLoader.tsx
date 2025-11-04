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
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50"></div>
      
      {/* Floating animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-indigo-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-gradient-to-br from-cyan-300/15 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>
      
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