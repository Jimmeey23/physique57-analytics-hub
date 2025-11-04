import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Target, Percent, Calendar } from 'lucide-react';
import { getThemeColors } from '@/utils/colorThemes';

interface UniversalLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'default';
  onComplete?: () => void;
  progress?: number;
  showSteps?: boolean;
  currentStep?: string;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  title = "Physique 57 Analytics",
  subtitle,
  variant = 'default',
  onComplete,
  progress: externalProgress,
  showSteps = false,
  currentStep,
}) => {
  const [autoProgress, setAutoProgress] = useState(0);
  const [dots, setDots] = useState('');
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const logoSrcs = ['/physique57-logo.png', '/placeholder.svg'];
  
  const taglines = [
    "Optimizing analytics experience - this won't take long.",
    'Crunching numbers and polishing insights.',
    'Fetching fresh data and KPIs.',
    'Applying smart filters and visualizations.',
    'Aligning dashboards with your brand.',
    'Enhanced loader system activated.'
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const duration = 1600;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(t);
      const value = Math.round(eased * 100);
      setAutoProgress(value);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    const taglineInterval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % taglines.length);
    }, 2800);
    return () => {
      clearInterval(dotsInterval);
      clearInterval(taglineInterval);
    };
  }, []);

  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    const val = externalProgress ?? autoProgress;
    if (val >= 100 && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [externalProgress, autoProgress, completed, onComplete]);

  const getVariantConfig = () => {
    const theme = getThemeColors(variant);
    
    switch (variant) {
      case 'sales':
        return {
          icon: TrendingUp,
          gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading sales analytics and revenue data...'
        };
      case 'discounts':
        return {
          icon: Percent,
          gradient: 'from-orange-500 via-amber-500 to-yellow-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading discount and promotional analysis...'
        };
      case 'funnel':
        return {
          icon: Target,
          gradient: 'from-purple-500 via-violet-500 to-indigo-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading funnel and lead conversion data...'
        };
      case 'retention':
        return {
          icon: Users,
          gradient: 'from-pink-500 via-rose-500 to-red-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading client retention and conversion data...'
        };
      case 'attendance':
        return {
          icon: Calendar,
          gradient: 'from-blue-500 via-sky-500 to-cyan-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading class attendance and session data...'
        };
      case 'analytics':
        return {
          icon: BarChart3,
          gradient: 'from-indigo-500 via-blue-500 to-purple-500',
          accentColor: `bg-${theme.accentColors.secondary}`,
          defaultSubtitle: 'Loading analytics and performance data...'
        };
      default:
        return {
          icon: Activity,
          gradient: 'from-blue-500 via-indigo-500 to-purple-500',
          accentColor: 'bg-indigo-500',
          defaultSubtitle: 'Loading dashboard...'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;
  const finalSubtitle = subtitle || config.defaultSubtitle;
  const baseProgress = (typeof externalProgress === 'number' && externalProgress > 0) ? externalProgress : autoProgress;
  const rawProgress = Math.max(0, Math.min(100, baseProgress));
  const progressValue = rawProgress > 0 && rawProgress < 1 ? 1 : rawProgress;
  const isCenterFilled = progressValue >= 52;
  const percentTextClass = isCenterFilled
    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]'
    : 'text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-white">

      {/* Enhanced animated background with floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-cyan-400/20 to-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-6 py-8 animate-fade-in">
        <div className="relative" aria-label="Loading brand">
          {/* Compact logo container with subtle animations */}
          <div className="relative w-20 h-20 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 overflow-hidden animate-pulse" 
               style={{ 
                 animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite, float 6s ease-in-out infinite',
               }}>
            {!imgFailed ? (
              <img
                src={logoSrcs[srcIndex]}
                alt="Physique 57"
                className="w-14 h-14 object-contain relative z-10 transition-transform duration-700"
                style={{
                  animation: 'gentle-bounce 2s ease-in-out infinite'
                }}
                onError={() => {
                  if (srcIndex < logoSrcs.length - 1) {
                    setSrcIndex(srcIndex + 1);
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            ) : (
              <Icon className="w-10 h-10 text-gray-700 relative z-10" style={{ animation: 'gentle-bounce 2s ease-in-out infinite' }} />
            )}
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer opacity-50" />
          </div>
        </div>

        {/* Sleek minimal progress bar */}
        <div className="w-full max-w-xs">
          <div className="relative h-1 rounded-full overflow-hidden bg-gray-200">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${config.gradient}`}
              style={{ 
                width: progressValue > 0 ? `${progressValue}%` : '0%',
                boxShadow: `0 0 8px ${config.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : 
                                      config.gradient.includes('orange') ? 'rgba(249, 115, 34, 0.3)' : 
                                      config.gradient.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : 
                                      config.gradient.includes('pink') ? 'rgba(236, 72, 153, 0.3)' : 
                                      'rgba(59, 130, 246, 0.3)'}`,
              }}
            >
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Clean, visible typography */}
        <div className="space-y-2">
          <h2 className={`text-xl font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
            {title}
          </h2>
          <p className="text-gray-600 text-sm font-medium">
            {finalSubtitle}
          </p>
          <p 
            className="text-gray-500 text-xs min-h-[16px] transition-opacity duration-500 animate-fade-in"
            key={taglineIndex}
          >
            {taglines[taglineIndex]}
          </p>

          {/* Step indicator */}
          {showSteps && currentStep && (
            <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-700 font-medium">{currentStep}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};