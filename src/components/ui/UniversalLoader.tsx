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
    'Aligning dashboards with your brand.'
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
          gradient: 'from-slate-800 to-slate-900',
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
      <style>{`
        @keyframes floatSoft { 0%, 100% { transform: translateY(0px) } 50% { transform: translateY(-15px) } }
        @keyframes shimmerWave { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.3; transform: scale(1) } 50% { opacity: 0.6; transform: scale(1.05) } }
        @keyframes spinSlow { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.95) translateY(10px) } 100% { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes progressShine { 0% { left: -100% } 100% { left: 200% } }
        @keyframes dotBounce { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-6px) scale(1.1) } }
        @keyframes rippleOut { 0% { transform: scale(0.9); opacity: 0.4 } 100% { transform: scale(1.8); opacity: 0 } }
      `}</style>

      {/* Modern minimalist background with white base */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full blur-3xl" style={{ animation: 'floatSoft 18s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-purple-100/30 to-pink-100/20 rounded-full blur-3xl" style={{ animation: 'floatSoft 22s ease-in-out infinite 4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-cyan-50/25 to-blue-50/15 rounded-full blur-3xl" style={{ animation: 'pulseGlow 14s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6 py-8" style={{ animation: 'fadeInScale 0.7s cubic-bezier(0.34, 1.4, 0.64, 1)' }}>
        <div className="relative" aria-label="Loading brand">
          {/* Animated decorative rings */}
          <div className="absolute inset-0 -m-8">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} opacity-10`} style={{ animation: 'spinSlow 25s linear infinite' }} />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200" style={{ animation: 'spinSlow 20s linear infinite reverse' }} />
          </div>

          {/* Ripple effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`absolute w-28 h-28 rounded-full bg-gradient-to-r ${config.gradient} opacity-15`} style={{ animation: 'rippleOut 3s ease-out infinite' }} />
            <div className={`absolute w-28 h-28 rounded-full bg-gradient-to-r ${config.gradient} opacity-15`} style={{ animation: 'rippleOut 3s ease-out infinite 1.5s' }} />
          </div>

          {/* Logo container with glass morphism */}
          <div className={`relative w-36 h-36 bg-white/90 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-slate-100 overflow-hidden`} style={{ animation: 'floatSoft 7s ease-in-out infinite' }}>
            {!imgFailed ? (
              <img
                src={logoSrcs[srcIndex]}
                alt="Physique 57"
                className="w-24 h-24 object-contain relative z-10"
                onError={() => {
                  if (srcIndex < logoSrcs.length - 1) {
                    setSrcIndex(srcIndex + 1);
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            ) : (
              <Icon className="w-14 h-14 text-slate-700 relative z-10" />
            )}
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" style={{ animation: 'shimmerWave 3.5s ease-in-out infinite' }} />
            </div>

            {/* Bottom gradient accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${config.gradient} opacity-8`} />
          </div>
        </div>

        {/* Modern progress bar */}
        <div className="w-full max-w-sm space-y-4">
          <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-100 shadow-inner border border-slate-200/50">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500 ease-out relative`}
              style={{ 
                width: progressValue > 0 ? `${progressValue}%` : '0%',
                boxShadow: '0 0 18px rgba(99, 102, 241, 0.35)'
              }}
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent" style={{ animation: 'progressShine 2.5s ease-in-out infinite' }} />
            </div>
            
            {/* Glow on right edge */}
            {progressValue > 8 && (
              <div
                className="absolute top-0 bottom-0 w-10 blur-md bg-gradient-to-r from-transparent to-indigo-300/30 transition-all duration-500"
                style={{ left: `${Math.max(0, progressValue - 8)}%` }}
              />
            )}
          </div>

          {/* Progress percentage with modern typography */}
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {progressValue}%
            </span>
            {/* Animated indicator dots */}
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" style={{ animation: 'dotBounce 1.2s ease-in-out infinite' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" style={{ animation: 'dotBounce 1.2s ease-in-out infinite 0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" style={{ animation: 'dotBounce 1.2s ease-in-out infinite 0.4s' }} />
            </div>
          </div>
        </div>

        {/* Clean modern typography */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-slate-600 text-sm font-medium tracking-wide">
            {finalSubtitle}
          </p>
          <p 
            className="text-slate-400 text-xs italic min-h-[18px] transition-opacity duration-500"
            key={taglineIndex}
            style={{ animation: 'fadeInScale 0.6s ease-out' }}
          >
            {taglines[taglineIndex]}
          </p>

          {/* Optional step indicator */}
          {showSteps && currentStep && (
            <div className="mt-5 px-5 py-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <p className="text-xs text-slate-500 font-medium">{currentStep}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};