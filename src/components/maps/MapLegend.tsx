import React from 'react';

interface LegendProps {
  indicator: string;
  min: number;
  max: number;
  unit?: string;
  colorScale: string[];
}

export const MapLegend: React.FC<LegendProps> = ({
  indicator,
  min,
  max,
  unit = '%',
  colorScale
}) => {
  return (
    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-sm text-xs text-left space-y-1.5 min-w-[170px]">
      <div className="font-semibold text-slate-700 dark:text-slate-300 capitalize text-[11px] truncate">
        {indicator} ({unit})
      </div>
      <div className="flex items-center gap-1">
        {colorScale.map((color, idx) => (
          <div
            key={idx}
            className="flex-1 h-3 rounded-xs first:rounded-l-sm last:rounded-r-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>{min}{unit}</span>
        <span>{Math.round((min + max) / 2)}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
