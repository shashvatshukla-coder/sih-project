import React from 'react';
import { ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ConversionFlowProps {
  stateName?: string;
  fromYear?: number;
  toYear?: number;
}

export const LandConversionFlow: React.FC<ConversionFlowProps> = ({
  stateName = 'Uttar Pradesh',
  fromYear = 2010,
  toYear = 2025
}) => {
  const transitions = [
    { from: 'Agricultural Land', to: 'Built-up / Urban Infrastructure', deltaHa: -584000, pctShift: -3.4, direction: 'decline' },
    { from: 'Barren & Wastelands', to: 'Solar Parks & Agriculture', deltaHa: +42400, pctShift: -0.2, direction: 'reclaimed' },
    { from: 'Unirrigated Rainfed Cropland', to: 'Assured Irrigated Farmland (PMKSY)', deltaHa: +1700000, pctShift: +7.0, direction: 'intensified' },
    { from: 'Floodplain Riparian Zone', to: 'Settlement & Peri-urban Encroachment', deltaHa: -50000, pctShift: -0.2, direction: 'decline' }
  ];

  return (
    <div className="space-y-3 text-left">
      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        Net Recorded Land Inter-Category Transitions ({stateName}, {fromYear} → {toYear}):
      </div>

      <div className="space-y-2">
        {transitions.map((t, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {t.from}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-brand-600 dark:text-brand-400 truncate">
                {t.to}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                {t.deltaHa > 0 ? `+${t.deltaHa.toLocaleString()} Ha` : `${t.deltaHa.toLocaleString()} Ha`}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  t.deltaHa > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {t.pctShift > 0 ? `+${t.pctShift}%` : `${t.pctShift}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
