import React from 'react';
import { CheckCircle2, RefreshCw, Globe, AlertCircle } from 'lucide-react';

interface DataQualityProps {
  completeness: number;
  freshness: string;
  coverageCount: number;
  missingPct: number;
  reliabilityTier: string;
}

export const DataQualityBadge: React.FC<DataQualityProps> = ({
  completeness,
  freshness,
  coverageCount,
  missingPct,
  reliabilityTier
}) => {
  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
          Data Quality & Hygiene Scorecard
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {completeness}% Score
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Completeness</div>
          <div className="font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {completeness}%
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Freshness</div>
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate text-[11px]">
            <RefreshCw className="w-3 h-3 text-brand-500 shrink-0" />
            <span className="truncate">{freshness}</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Geo Coverage</div>
          <div className="font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            {coverageCount} Units
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Missing Records</div>
          <div className="font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            {missingPct}%
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
        <span>Reliability Grade: <strong className="text-slate-700 dark:text-slate-300">{reliabilityTier}</strong></span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified Schema</span>
      </div>
    </div>
  );
};
