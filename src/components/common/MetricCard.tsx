import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info, HelpCircle } from 'lucide-react';
import { SourceBadge } from './SourceBadge';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  previousValue?: string | number;
  changePct?: number;
  changePeriod?: string;
  tooltip?: string;
  sourceText?: string;
  sourceUrl?: string;
  datasetId?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  subtext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  previousValue,
  changePct,
  changePeriod = 'vs 2015',
  tooltip,
  sourceText = 'MoA&FW / DES 2025',
  sourceUrl,
  datasetId = 'DS-DES-LUS',
  status,
  subtext
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine trend color
  const isPositive = changePct !== undefined && changePct > 0;
  const isNegative = changePct !== undefined && changePct < 0;
  const isNeutral = changePct !== undefined && changePct === 0;

  return (
    <div className="relative p-4 md:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
      {/* Top Title & Info Tooltip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 z-20 w-48 p-2 text-[11px] font-normal leading-relaxed text-white bg-slate-900 rounded-lg shadow-lg dark:bg-slate-800 border border-slate-700 pointer-events-none">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main KPI Value */}
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Comparison Indicator / Subtext */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {changePct !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {isPositive && (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{changePct}%
              </span>
            )}
            {isNegative && (
              <span className="flex items-center text-rose-600 dark:text-rose-400 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {changePct}%
              </span>
            )}
            {isNeutral && (
              <span className="flex items-center text-slate-500 font-semibold">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                0.0%
              </span>
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {changePeriod}
            </span>
          </div>
        ) : subtext ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">{subtext}</span>
        ) : <div />}

        {/* Source Citation Pill */}
        <SourceBadge source={sourceText} datasetId={datasetId} sourceUrl={sourceUrl} />
      </div>
    </div>
  );
};
