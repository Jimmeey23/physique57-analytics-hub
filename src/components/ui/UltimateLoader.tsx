import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface UltimateLoaderProps {
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

const MESSAGES: Record<string, string[]> = {
  sales: ['Analyzing revenue trends…', 'Processing sales data…', 'Calculating ATV metrics…', 'Loading sales insights…'],
  discount: ['Loading discount analytics…', 'Analyzing promotion impact…', 'Calculating discount ROI…'],
  funnel: ['Mapping conversion funnel…', 'Analyzing lead pipeline…', 'Tracking conversions…'],
  lead: ['Mapping conversion funnel…', 'Analyzing lead pipeline…', 'Tracking conversions…'],
  retention: ['Analyzing member retention…', 'Tracking engagement patterns…', 'Calculating retention rates…'],
  attendance: ['Loading class schedules…', 'Analyzing attendance patterns…', 'Tracking studio capacity…'],
  class: ['Loading class schedules…', 'Analyzing attendance patterns…', 'Tracking studio capacity…'],
  cancellation: ['Analyzing late cancellations…', 'Identifying usage patterns…', 'Calculating policy impact…'],
  expiration: ['Tracking expirations…', 'Analyzing renewal patterns…', 'Identifying opportunities…'],
  trainer: ['Loading trainer metrics…', 'Ranking performance…', 'Preparing insights…'],
  payroll: ['Loading payroll data…', 'Calculating compensation…', 'Preparing reports…'],
  executive: ['Preparing executive summary…', 'Aggregating key metrics…', 'Loading overview…'],
  summary: ['Preparing executive summary…', 'Aggregating key metrics…', 'Loading overview…'],
  patterns: ['Analyzing usage patterns…', 'Processing trend data…', 'Identifying insights…'],
  trends: ['Analyzing usage patterns…', 'Processing trend data…', 'Identifying insights…'],
  default: ['Loading analytics…', 'Processing studio data…', 'Preparing insights…', 'Almost ready…'],
};

export const UltimateLoader: React.FC<UltimateLoaderProps> = ({
  onComplete,
  title = "Analytics Hub",
  subtitle = "Physique 57 · India",
}) => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = React.useMemo(() => {
    const path = location.pathname.toLowerCase();
    const key = Object.keys(MESSAGES).find((k) => k !== 'default' && path.includes(k));
    return key ? MESSAGES[key] : MESSAGES.default;
  }, [location.pathname]);

  useEffect(() => {
    let completed = false;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (completed) return 100;
        const increment = prev > 92 ? 0.4 : prev > 75 ? 1.1 : Math.max(1.6, (100 - prev) * 0.12);
        return Math.min(99, prev + increment);
      });
    }, 60);
    const minTimer = setTimeout(() => {
      completed = true;
      clearInterval(timer);
      setProgress(100);
      onComplete?.();
    }, 1600);
    return () => {
      clearInterval(timer);
      clearTimeout(minTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const id = setInterval(() => setMessageIndex((p) => (p + 1) % messages.length), 900);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white dark:bg-[#050506]">
      <div className="p57-grain opacity-100" aria-hidden="true" />
      {/* blue ambience */}
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-72 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(0,94,237,0.16), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="animate-p57-enter relative z-10 flex flex-col items-center gap-6 px-8">
        {/* Mark with progress ring */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="5" className="text-foreground" />
            <circle
              cx="48" cy="48" r="44" fill="none"
              stroke="url(#p57-ring)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 120ms linear' }}
            />
            <defs>
              <linearGradient id="p57-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#005eed" />
                <stop offset="100%" stopColor="#6aa5ff" />
              </linearGradient>
            </defs>
          </svg>
          <span className="p57-logo-mark flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--brand-deep))] font-display text-xl font-extrabold text-white shadow-[0_8px_32px_rgba(0,94,237,0.45)]">
            57
          </span>
        </div>

        <div className="text-center">
          <h1 className="font-serif text-[32px] leading-none tracking-tight text-foreground">
            {title.includes('57') ? (
              <>{title.replace('57', '').trim()} <em className="text-primary">57</em></>
            ) : title}
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{subtitle}</p>
        </div>

        <div className="w-64">
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#6aa5ff]"
              style={{ width: `${progress}%`, transition: 'width 120ms linear' }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold tabular-nums">
            <span className="truncate pr-4 font-medium text-muted-foreground">{messages[messageIndex]}</span>
            <span className="shrink-0 text-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateLoader;
