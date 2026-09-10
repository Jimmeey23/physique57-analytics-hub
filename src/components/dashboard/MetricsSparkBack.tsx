import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparkBackProps {
  data: Array<{ value: number }>;
  color: string;
  caption: string;
  id: string;
}

/** Flip-card back-face sparkline. Split out so `recharts` loads lazily (see MetricsCardsEnhanced). */
export const SparkBack: React.FC<SparkBackProps> = ({ data, color, caption, id }) => (
  <div>
    <div className="h-[62px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`mce-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#mce-${id})`}
            isAnimationActive
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{caption}</p>
  </div>
);
