import * as React from 'react';
import { motion, useInView, useAnimation, useSpring } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MotionCard = motion(Card);

interface StudioPulseMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  metric: number;
  metricUnit?: string;
  subtext: string;
  description?: string;
  iconContainerClassName?: string;
  precision?: number;
  growthLabel?: string;
  growthValue?: number | null;
  secondaryGrowthLabel?: string;
  secondaryGrowthValue?: number | null;
  /** Raw metric values per month — newest last */
  sparklineData?: number[];
  /** Month labels aligned to sparklineData */
  sparklineLabels?: string[];
  formatter?: (value: number) => string;
  badgeLabel?: string;
  tooltipContent?: string;
}

const formatMetric = (value: number, precision: number, formatter?: (value: number) => string) => {
  if (formatter) return formatter(Number.isFinite(value) ? value : 0);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Number.isFinite(value) ? value : 0);
};

const deriveDeltaFromPercent = (current: number, percent?: number | null) => {
  if (percent === undefined || percent === null || !Number.isFinite(percent)) return null;
  if (percent === 100) return current;
  const previous = current / (1 + percent / 100);
  if (!Number.isFinite(previous)) return null;
  return current - previous;
};

/** Animated count-up span */
const AnimatedValue = ({
  value,
  precision,
  formatter,
}: {
  value: number;
  precision: number;
  formatter?: (v: number) => string;
}) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { damping: 30, stiffness: 100, mass: 1 });

  React.useEffect(() => {
    if (isInView) spring.set(value);
  }, [spring, isInView, value]);

  React.useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      if (ref.current) {
        const isSettled = Math.abs(latest - value) < 0.5;
        ref.current.textContent = formatMetric(latest, isSettled ? precision : 0, formatter);
      }
    });
    return () => unsub();
  }, [precision, formatter, spring, value]);

  return <span ref={ref}>{formatMetric(0, precision, formatter)}</span>;
};

const makeBarVariants = (heightPct: number) => ({
  hidden: { height: '0%' },
  visible: {
    height: `${heightPct}%`,
    transition: { type: 'spring', damping: 15, stiffness: 100 },
  },
});

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StudioPulseMetricCard = React.forwardRef<HTMLDivElement, StudioPulseMetricCardProps>(
  (
    {
      className,
      icon,
      title,
      metric,
      metricUnit,
      subtext,
      description,
      iconContainerClassName,
      precision = 0,
      growthLabel,
      growthValue,
      secondaryGrowthLabel,
      secondaryGrowthValue,
      sparklineData,
      sparklineLabels,
      formatter,
      badgeLabel,
      tooltipContent,
      onClick,
      ...props
    },
    ref
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, amount: 0.4 });
    const controls = useAnimation();

    React.useEffect(() => {
      if (isInView) controls.start('visible');
    }, [isInView, controls]);

    // Build bar data from sparklineData — last item is current month (highlighted)
    const bars = React.useMemo(() => {
      if (!sparklineData || sparklineData.length < 2) return [];
      const data = sparklineData.slice(-8); // max 8 bars
      const max = Math.max(...data, 1);
      const labels = sparklineLabels
        ? sparklineLabels.slice(-8)
        : (() => {
            const now = new Date();
            return data.map((_, i) => SHORT_MONTHS[(now.getMonth() - (data.length - 1 - i) + 12) % 12]);
          })();
      return data.map((v, i) => ({
        value: Math.max((v / max) * 100, 3),
        rawValue: v,
        label: labels[i] ?? '',
        isLast: i === data.length - 1,
      }));
    }, [sparklineData, sparklineLabels]);

    const renderGrowthBadge = (label?: string, value?: number | null) => {
      if (value === undefined) return null;
      const delta = deriveDeltaFromPercent(metric, value);
      const isPos = value !== null && value >= 0;
      const isNull = value === null;

      return (
        <div
          className="inline-flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 shadow-[0_2px_4px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-150 hover:shadow-[0_4px_8px_rgba(15,23,42,0.10),0_2px_4px_rgba(15,23,42,0.06)] active:shadow-[0_1px_2px_rgba(15,23,42,0.08),inset_0_1px_3px_rgba(15,23,42,0.08)] active:translate-y-px"
        >
          <span className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-medium">{label}</span>
          <div className="flex items-center gap-0.5">
            {!isNull && (isPos
              ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              : <ArrowDownRight className="h-3 w-3 text-red-400" />
            )}
            <span className="text-[11px] font-bold tabular-nums text-slate-800">
              {isNull ? 'N/C' : `${isPos ? '+' : ''}${value!.toFixed(1)}%`}
            </span>
          </div>
          {delta !== null ? (
            <span className="text-[9px] opacity-50 tabular-nums">
              {delta >= 0 ? '+' : ''}{formatMetric(delta, Math.min(precision, 1), formatter)}
            </span>
          ) : null}
        </div>
      );
    };

    // Derive accent color from iconContainerClassName gradient or fallback to growth polarity
    const accentColor = React.useMemo(() => {
      if (iconContainerClassName) {
        if (/emerald|green/.test(iconContainerClassName)) return '#10b981';
        if (/cyan|sky/.test(iconContainerClassName)) return '#06b6d4';
        if (/amber|orange|yellow/.test(iconContainerClassName)) return '#f59e0b';
        if (/red|rose/.test(iconContainerClassName)) return '#ef4444';
        if (/purple|violet/.test(iconContainerClassName)) return '#8b5cf6';
        if (/pink/.test(iconContainerClassName)) return '#ec4899';
        if (/blue/.test(iconContainerClassName)) return '#3b82f6';
      }
      if (growthValue !== null && growthValue !== undefined) {
        return growthValue >= 0 ? '#10b981' : '#ef4444';
      }
      return '#3b82f6';
    }, [iconContainerClassName, growthValue]);

    // Peak bar (max value) gets a secondary highlight color
    const peakIdx = React.useMemo(() => {
      if (!bars.length) return -1;
      let max = -Infinity, idx = 0;
      bars.forEach((b, i) => { if (b.rawValue > max) { max = b.rawValue; idx = i; } });
      return idx;
    }, [bars]);

    const peakColor = '#60a5fa'; // blue-400 — contrasting highlight for historical peak

    return (
      <MotionCard
        ref={ref}
        className={cn('group w-full overflow-hidden cursor-pointer border border-slate-100 shadow-sm', className)}
        whileHover={{ scale: 1.025, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        onClick={onClick}
        {...(props as any)}
      >
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-0">
          {/* Icon + title row */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
                iconContainerClassName || 'bg-gradient-to-br from-blue-600 to-blue-800'
              )}
            >
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })
                : icon}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <h3 className="truncate text-[14px] font-bold tracking-tight text-slate-700 leading-tight">{title}</h3>
              {metricUnit ? <span className="text-[10px] font-normal text-slate-400 flex-shrink-0">{metricUnit}</span> : null}
              {tooltipContent ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                        <CircleAlert className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl border border-slate-100 bg-white p-2.5 text-[11px] leading-relaxed text-slate-600 shadow-xl">
                      {tooltipContent}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>
          {onClick && (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-all duration-200 group-hover:text-slate-500 group-hover:translate-x-0.5" />
          )}
        </CardHeader>

        <CardContent className="px-4 pt-2 pb-3">
          <div ref={cardRef} className="flex flex-col gap-3">
            {/* Big metric value + subtext */}
            <div>
              <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 leading-none tabular-nums">
                <AnimatedValue value={metric} precision={precision} formatter={formatter} />
              </h2>
              <p className="mt-1 text-[10px] text-slate-400 leading-tight">{subtext}</p>
              {description ? (
                <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{description}</p>
              ) : null}
            </div>

            {/* Bar chart — previous months, taller + rounded tops */}
            {bars.length >= 2 ? (
              <motion.div
                className="flex h-[72px] w-full items-end gap-[3px]"
                initial="hidden"
                animate={controls}
                transition={{ staggerChildren: 0.07 }}
                aria-label={`${title} monthly chart`}
              >
                {bars.map((bar, i) => {
                  const isCurrent = bar.isLast;
                  const isPeak = i === peakIdx && !isCurrent;
                  const barBg = isCurrent ? accentColor : isPeak ? peakColor : '#cbd5e1'; // slate-300
                  const barOpacity = isCurrent ? 1 : isPeak ? 0.85 : 0.55;

                  return (
                    <TooltipProvider key={i} delayDuration={60}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex h-full flex-1 flex-col items-center justify-end gap-[3px] group/bar">
                            <motion.div
                              className="w-full rounded-t-[6px] transition-opacity duration-150 group-hover/bar:opacity-100"
                              style={{
                                backgroundColor: barBg,
                                opacity: barOpacity,
                              }}
                              variants={makeBarVariants(bar.value)}
                            />
                            <span className={cn(
                              'text-[8px] font-semibold leading-none',
                              isCurrent ? 'text-slate-600' : 'text-slate-400'
                            )}>
                              {bar.label}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 shadow-md">
                          {bar.label}: {formatMetric(bar.rawValue, precision, formatter)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </motion.div>
            ) : null}

            {/* Growth badges */}
            <div className="flex gap-2">
              {renderGrowthBadge(growthLabel, growthValue)}
              {renderGrowthBadge(secondaryGrowthLabel, secondaryGrowthValue)}
            </div>
          </div>
        </CardContent>
      </MotionCard>
    );
  }
);

StudioPulseMetricCard.displayName = 'StudioPulseMetricCard';

export { StudioPulseMetricCard };
