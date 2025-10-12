import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Target, Percent, CreditCard, Calendar } from 'lucide-react';
import { getThemeColors } from '@/utils/colorThemes';

interface UniversalLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'default';
  onComplete?: () => void; // called when progress hits 100 once
  // If provided, progress reflects actual loading percentage (0-100)
  progress?: number;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  title = "Physique 57 Analytics",
  subtitle,
  variant = 'default',
  onComplete,
  progress: externalProgress,
}) => {
  const [autoProgress, setAutoProgress] = useState(0);
  const [dots, setDots] = useState('');
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const logoSrcs = ['/physique57-logo.png', '/placeholder.svg'];
  // Dynamic taglines rotation
  const taglines = [
    'Optimizing analytics experience — this won’t take long.',
    'Crunching numbers and polishing insights.',
    'Fetching fresh data and KPIs.',
    'Applying smart filters and visualizations.',
    'Aligning dashboards with your brand.'
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Always run a lightweight auto progress animation for perceived progress.
  // We will only SHOW it when external progress is zero (to avoid misrepresenting real progress).
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const duration = 1600; // ms
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

  // Dots animation
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

  // Call onComplete when progress reaches 100 (external or auto)
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
          gradient: 'from-slate-600 to-slate-800',
          accentColor: 'bg-slate-500',
          defaultSubtitle: 'Loading dashboard...'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;
  const finalSubtitle = subtitle || config.defaultSubtitle;
  // Display auto progress ONLY when external progress is zero or not provided
  const baseProgress = (typeof externalProgress === 'number' && externalProgress > 0) ? externalProgress : autoProgress;
  // Clamp and snap tiny non-zero values to at least 1%
  const rawProgress = Math.max(0, Math.min(100, baseProgress));
  const progressValue = rawProgress > 0 && rawProgress < 1 ? 1 : rawProgress;
  // If progress has passed the center (≈50%), the center of the bar is within the filled (darker) region
  const isCenterFilled = progressValue >= 52; // small buffer to avoid flicker
  const percentTextClass = isCenterFilled
    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]'
    : 'text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/30">
      {/* Effects & Keyframes */}
      <style>{`
        @keyframes floaty { 0% { transform: translateY(0) translateX(0) scale(1) } 50% { transform: translateY(-10px) translateX(10px) scale(1.02) } 100% { transform: translateY(0) translateX(0) scale(1) } }
        @keyframes sheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes glowPulse { 0%, 100% { opacity: .7 } 50% { opacity: 1 } }
        @keyframes barber { 0% { background-position: 0 0 } 100% { background-position: 24px 0 } }
      `}</style>

      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-[36rem] h-[36rem] bg-gradient-to-br from-sky-400/30 via-blue-500/20 to-indigo-500/20 blur-3xl rounded-full" style={{ animation: 'floaty 12s ease-in-out infinite' }} />
        <div className="absolute -bottom-24 -right-10 w-[32rem] h-[32rem] bg-gradient-to-tr from-indigo-500/20 via-fuchsia-500/15 to-sky-400/15 blur-3xl rounded-full" style={{ animation: 'floaty 14s ease-in-out infinite 1s' as any }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 blur-2xl rounded-full" style={{ animation: 'floaty 10s ease-in-out infinite .5s' as any }} />
        {/* soft noise overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '3px 3px', opacity: 0.15 }} />
      </div>

      {/* Main Loader Content */}
      <div className="relative z-10 flex flex-col items-center gap-7 max-w-md text-center px-6 py-8">
        {/* Main Icon (replaced with brand logo, with graceful fallback) */}
        <div className="relative" aria-label="Loading brand">
          {/* Premium white glass tile for the brand logo */}
          <div className={`w-28 h-28 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-black/5`} style={{ animation: 'floaty 7s ease-in-out infinite' }}>
            {!imgFailed ? (
              <img
                src={logoSrcs[srcIndex]}
                alt="Physique 57"
                className="w-16 h-16 object-contain"
                onError={() => {
                  if (srcIndex < logoSrcs.length - 1) {
                    setSrcIndex(srcIndex + 1);
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            ) : (
              <Icon className="w-10 h-10 text-slate-700" />
            )}
          </div>
          {/* Gradient orbit */}
          <div className="absolute inset-0 -z-10 rounded-2xl">
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} opacity-50 blur-md`} style={{ filter: 'blur(16px)' }} />
            <div className={`absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r ${config.gradient} opacity-40 animate-spin`} style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm">
          <div className="relative h-3 rounded-full overflow-hidden bg-black/10 ring-1 ring-black/10 shadow-md">
            {/* Filled gradient */}
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-150 ease-out shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]`}
              style={{ width: progressValue > 0 ? `max(${progressValue}%, 8px)` : '0%' }}
            />
            {/* Animated stripes inside the filled area */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full pointer-events-none"
              style={{ width: progressValue > 0 ? `max(${progressValue}%, 8px)` : '0%' }}
            >
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, rgba(255,255,255,0.22) 25%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.22) 75%, rgba(255,255,255,0) 75%, rgba(255,255,255,0) 100%)',
                  backgroundSize: '24px 24px',
                  animation: 'barber 1s linear infinite'
                }}
              />
            </div>
            {/* sheen over the entire track */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/50 to-white/0" style={{ animation: 'sheen 2.2s ease-in-out infinite' }} />
            {/* Knob at the leading edge */}
            {progressValue > 1 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow ring-2 ring-white/80"
                style={{ left: `calc(${progressValue}% - 6px)` }}
              />
            )}
            {/* Numeric progress - switch text color based on background brightness */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] sm:text-xs font-semibold ${percentTextClass}`}>
                {progressValue}%
              </span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-black bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-slate-800 text-base leading-relaxed">
            {finalSubtitle}{dots}
          </p>
          <p className="text-xs text-slate-600">
            {taglines[taglineIndex]}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2">
          <div className={`w-2.5 h-2.5 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-2.5 h-2.5 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-2.5 h-2.5 ${config.accentColor} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};