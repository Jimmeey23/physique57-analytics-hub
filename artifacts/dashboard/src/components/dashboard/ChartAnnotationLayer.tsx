
import * as React from "react";
import { ReferenceLine, Tooltip } from "recharts";
import { Annotation } from "@/hooks/useAnnotations";

interface ChartAnnotationLayerProps {
  annotations: Annotation[];
  dateKey?: string;
}

const COLOR_MAP = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#10b981',
  amber: '#f59e0b',
};

export const ChartAnnotationLayer: React.FC<ChartAnnotationLayerProps> = ({ 
  annotations, 
  dateKey = 'date' 
}) => {
  return (
    <>
      {annotations.map((ann) => (
        <ReferenceLine
          key={ann.id}
          x={ann.date}
          stroke={COLOR_MAP[ann.color]}
          strokeDasharray="3 3"
          label={{
            value: ann.label,
            position: 'top',
            fill: COLOR_MAP[ann.color],
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      ))}
    </>
  );
};
