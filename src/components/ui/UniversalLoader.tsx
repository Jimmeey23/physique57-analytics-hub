import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Target, Percent, CreditCard, Calendar } from 'lucide-react';
import { getThemeColors } from '@/utils/colorThemes';

interface UniversalLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'default';
  onComplete?: () => void; // called when progress hits 100 once
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  title = "Physique 57 Analytics",
  subtitle,
  variant = 'default',
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    // One-shot smooth progress animation from 0 -> 100
    let rafId = 0;
    const start = performance.now();
    const duration = 1400; // ms
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(t);
      const value = Math.round(eased * 100);
      setProgress(value);
      if (t < 1) rafId = requestAnimationFrame(step);
      else if (value >= 100 && onComplete) onComplete();
    };
    rafId = requestAnimationFrame(step);

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(dotsInterval);
    };
  }, []);

  const getVariantConfig = () => {
    const theme = getThemeColors(variant);
    
    switch (variant) {
      case 'sales':
        return {
          icon: TrendingUp,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading sales analytics and revenue data...'
        };
      case 'discounts':
        return {
          icon: Percent,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading discount and promotional analysis...'
        };
      case 'funnel':
        return {
          icon: Target,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading funnel and lead conversion data...'
        };
      case 'retention':
        return {
          icon: Users,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading client retention and conversion data...'
        };
      case 'attendance':
        return {
          icon: Calendar,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading class attendance and session data...'
        };
      case 'analytics':
        return {
          icon: BarChart3,
          gradient: theme.activeTabGradient,
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading analytics and performance data...'
        };
      default:
        return {
          icon: Activity,
          gradient: 'from-slate-600 to-slate-800',
          accentColor: 'bg-slate-500',
          defaultSubtitle: 'Loading dashboard...'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;
  const finalSubtitle = subtitle || config.defaultSubtitle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>

      {/* Main Loader Content */}
  <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md text-center px-6">
        {/* Main Icon (replaced with brand logo, with graceful fallback) */}
        <div className="relative">
          <div className={`w-24 h-24 bg-white/80 backdrop-blur rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-black/5`}>
            {!imgFailed ? (
              <img
                src="/physique57-logo.png"
                alt="Physique 57"
                className="w-14 h-14 object-contain animate-pulse"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <Icon className="w-10 h-10 text-slate-700 animate-pulse" />
            )}
          </div>
          {/* Orbital animation */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/40 to-purple-500/40 animate-spin" style={{ animationDuration: '3.5s' }}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className={`w-2 h-2 ${config.accentColor} rounded-full`}></div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-200 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-slate-700 text-base leading-relaxed">
            {finalSubtitle}{dots}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2">
          <div className={`w-3 h-3 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-3 h-3 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-3 h-3 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};