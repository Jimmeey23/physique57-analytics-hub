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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      <style>{`
        @keyframes floaty { 0% { transform: translateY(0) translateX(0) scale(1) rotate(0deg) } 33% { transform: translateY(-12px) translateX(8px) scale(1.03) rotate(1deg) } 66% { transform: translateY(-6px) translateX(-8px) scale(1.01) rotate(-1deg) } 100% { transform: translateY(0) translateX(0) scale(1) rotate(0deg) } }
        @keyframes sheen { 0% { transform: translateX(-100%) skewX(-15deg) } 100% { transform: translateX(200%) skewX(-15deg) } }
        @keyframes glowPulse { 0%, 100% { opacity: .6; filter: blur(20px) } 50% { opacity: .95; filter: blur(24px) } }
        @keyframes barber { 0% { background-position: 0 0 } 100% { background-position: 32px 0 } }
        @keyframes shimmer { 0% { transform: translateX(-100%) rotate(45deg) } 100% { transform: translateX(200%) rotate(45deg) } }
        @keyframes breathe { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes orbit { 0% { transform: rotate(0deg) translateX(40px) rotate(0deg) } 100% { transform: rotate(360deg) translateX(40px) rotate(-360deg) } }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes dotPulse { 0%, 100% { transform: scale(0.8); opacity: 0.5 } 50% { transform: scale(1.2); opacity: 1 } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[48rem] h-[48rem] bg-gradient-to-br from-blue-400/25 via-indigo-400/15 to-purple-400/20 rounded-full" style={{ animation: 'floaty 18s ease-in-out infinite, glowPulse 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-32 -right-32 w-[52rem] h-[52rem] bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/15 to-cyan-400/15 rounded-full" style={{ animation: 'floaty 22s ease-in-out infinite 2s, glowPulse 10s ease-in-out infinite 1s' as any }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-br from-sky-400/12 via-blue-400/8 to-indigo-400/12 rounded-full" style={{ animation: 'breathe 12s ease-in-out infinite' }} />
        
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/20 to-slate-50/40" />
        
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-300/30 rounded-full blur-sm" style={{ animation: 'orbit 15s linear infinite' }} />
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-purple-300/30 rounded-full blur-sm" style={{ animation: 'orbit 20s linear infinite reverse' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6 py-8" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="relative" aria-label="Loading brand">
          <div className={`w-32 h-32 bg-white backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-slate-200/50 border border-slate-100`} style={{ animation: 'floaty 8s ease-in-out infinite, breathe 6s ease-in-out infinite' }}>
            {!imgFailed ? (
              <img
                src={logoSrcs[srcIndex]}
                alt="Physique 57"
                className="w-20 h-20 object-contain drop-shadow-lg"
                onError={() => {
                  if (srcIndex < logoSrcs.length - 1) {
                    setSrcIndex(srcIndex + 1);
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            ) : (
              <Icon className="w-12 h-12 text-slate-700 drop-shadow-md" />
            )}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 rounded-3xl">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${config.gradient} opacity-40`} style={{ filter: 'blur(24px)', animation: 'glowPulse 4s ease-in-out infinite' }} />
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${config.gradient} opacity-25`} style={{ filter: 'blur(40px)', animation: 'glowPulse 6s ease-in-out infinite 0.5s' }} />
            <div className={`absolute inset-[-4px] rounded-3xl border border-transparent bg-gradient-to-r ${config.gradient} opacity-20 animate-spin`} style={{ animationDuration: '8s', maskImage: 'linear-gradient(white, white)', WebkitMaskImage: 'linear-gradient(white, white)' }} />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="relative h-4 rounded-full overflow-hidden bg-slate-100/80 backdrop-blur-xl ring-1 ring-slate-200/60 shadow-lg border border-white/60">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-300 ease-out shadow-[0_0_16px_rgba(59,130,246,0.4)]`}
              style={{ 
                width: progressValue > 0 ? `max(${progressValue}%, 10px)` : '0%',
                boxShadow: `0 0 16px rgba(59, 130, 246, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)`
              }}
            />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full pointer-events-none"
              style={{ width: progressValue > 0 ? `max(${progressValue}%, 10px)` : '0%' }}
            >
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent 100%)',
                  backgroundSize: '32px 32px',
                  animation: 'barber 1.2s linear infinite'
                }}
              />
            </div>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/60 to-white/0 w-1/3" style={{ animation: 'sheen 2.5s ease-in-out infinite' }} />
            {progressValue > 2 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gradient-to-br from-white to-blue-50 shadow-lg ring-2 ring-white transition-all duration-300"
                style={{ 
                  left: `calc(${progressValue}% - 10px)`,
                  boxShadow: '0 0 12px rgba(59,130,246,0.5), 0 4px 8px rgba(0,0,0,0.15)'
                }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold tracking-wide ${percentTextClass}`} style={{ textShadow: isCenterFilled ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.9)' }}>
                {progressValue}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent drop-shadow-sm">
            {title}
          </h2>
          <p className="text-slate-700 text-base leading-relaxed font-light tracking-wide">
            {finalSubtitle}{dots}
          </p>
          <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
            {taglines[taglineIndex]}
          </p>
        </div>

        <div className="flex space-x-3 mt-2">
          <div className={`w-3 h-3 ${config.accentColor} rounded-full shadow-lg`} style={{ animation: 'dotPulse 1.5s ease-in-out infinite', animationDelay: '0ms' }}></div>
          <div className={`w-3 h-3 ${config.accentColor} rounded-full shadow-lg`} style={{ animation: 'dotPulse 1.5s ease-in-out infinite', animationDelay: '200ms' }}></div>
          <div className={`w-3 h-3 ${config.accentColor} rounded-full shadow-lg`} style={{ animation: 'dotPulse 1.5s ease-in-out infinite', animationDelay: '400ms' }}></div>
        </div>
      </div>
    </div>
  );
};