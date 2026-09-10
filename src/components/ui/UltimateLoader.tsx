import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

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

/**
 * Minimal, elegant full-screen loader: brand mark, title,
 * hairline progress, quiet status line. Nothing else.
 */
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
        const increment = prev > 92 ? 0.6 : prev > 75 ? 1.6 : Math.max(2.2, (100 - prev) * 0.14);
        return Math.min(99, prev + increment);
      });
    }, 50);
    const minTimer = setTimeout(() => {
      completed = true;
      clearInterval(timer);
      setProgress(100);
      onComplete?.();
    }, 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(minTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const id = setInterval(() => setMessageIndex((p) => (p + 1) % messages.length), 1200);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#0A0A0A]">
      {/* whisper of ambience */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(5,155,255,0.07), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center px-8">
        <div className="animate-p57-enter" style={{ animationDelay: '0ms' }}>
          <BrandLogo className="p57-loader-breathe h-14 w-14 !rounded-2xl" />
        </div>

        <div className="animate-p57-enter mt-7 text-center" style={{ animationDelay: '90ms' }}>
          <h1 className="font-serif text-[26px] leading-none tracking-tight text-foreground">
            {title.includes('57') ? (
              <>{title.replace('57', '').trim()} <em className="not-italic text-primary">57</em></>
            ) : title}
          </h1>
          <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="animate-p57-enter mt-8 w-52" style={{ animationDelay: '160ms' }}>
          <div className="h-[2px] overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4 text-[11px] tabular-nums">
            <span key={messageIndex} className="p57-loader-msg truncate font-medium text-muted-foreground">
              {messages[messageIndex]}
            </span>
            <span className="shrink-0 font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateLoader;
