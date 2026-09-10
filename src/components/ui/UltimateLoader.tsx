import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";

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

  const pct = Math.round(progress);
  const R = 44;
  const CIRC = 2 * Math.PI * R;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="p57-grain opacity-100" aria-hidden="true" />

      {/* Single soft accent wash — no competing gradients */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[26rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.14), transparent 68%)' }}
        aria-hidden="true"
      />

      <div className="animate-p57-enter relative z-10 flex w-[min(22rem,calc(100vw-3rem))] flex-col items-center">
        {/* Brand mark inside a determinate progress ring */}
        <div className="relative flex h-[92px] w-[92px] items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
            <circle
              cx="48" cy="48" r={R} fill="none"
              stroke="currentColor" strokeOpacity="0.14" strokeWidth="4"
              className="text-foreground"
            />
            <circle
              cx="48" cy="48" r={R} fill="none"
              stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 160ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>

          <BrandLogo
            className="h-[62px] w-[62px] rounded-[18px] shadow-card ring-1 ring-black/[0.07] dark:ring-white/10"
            imgClassName="p-[8px]"
          />
        </div>

        {/* Wordmark */}
        <div className="mt-7 text-center">
          <h1 className="font-serif text-[30px] leading-none tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2.5 text-[9px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* Progress: hairline track, accent fill, tabular readout */}
        <div
          className="mt-8 w-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Loading progress"
        >
          <div className="h-[3px] overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${progress}%`,
                transition: 'width 160ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>

          <div className="mt-3.5 flex items-baseline justify-between gap-4">
            <span
              key={messageIndex}
              className="p57-message truncate text-[11px] font-medium text-muted-foreground"
            >
              {messages[messageIndex]}
            </span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground/70">
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateLoader;
