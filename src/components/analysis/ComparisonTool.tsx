import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { GitCompare, ArrowRight, CheckCircle2, Minus } from 'lucide-react';

export const ComparisonTool: React.FC = () => {
  const { states } = useApp();
  const [geo1, setGeo1] = useState<string>('IN-UP');
  const [geo2, setGeo2] = useState<string>('IN-BR');
  const [year, setYear] = useState<number>(2025);
  const [compData, setCompData] = useState<any>(null);

  useEffect(() => {
    async function fetchComp() {
      try {
        const data = await api.getComparison(geo1, geo2, year);
        setCompData(data);
      } catch (err) {
        console.error('Failed to load comparison data:', err);
      }
    }
    fetchComp();
  }, [geo1, geo2, year]);

  const g1 = compData?.comparison?.geo1;
  const g2 = compData?.comparison?.geo2;
  const deltas = compData?.comparison?.deltas;

  const comparisonRows = [
    { label: 'Agricultural Land %', key: 'agricultural_pct', d1: g1?.record?.agricultural_pct, d2: g2?.record?.agricultural_pct, diff: deltas?.agricultural_diff },
    { label: 'Forest Cover %', key: 'forest_pct', d1: g1?.record?.forest_pct, d2: g2?.record?.forest_pct, diff: deltas?.forest_diff },
    { label: 'Built-up Area %', key: 'builtup_pct', d1: g1?.record?.builtup_pct, d2: g2?.record?.builtup_pct, diff: deltas?.builtup_diff },
    { label: 'Water Bodies %', key: 'waterbodies_pct', d1: g1?.record?.waterbodies_pct, d2: g2?.record?.waterbodies_pct, diff: deltas?.water_diff },
    { label: 'Barren Land %', key: 'barren_pct', d1: g1?.record?.barren_pct, d2: g2?.record?.barren_pct, diff: deltas?.barren_diff },
    { label: 'Gross Irrigated Land %', key: 'irrigated_pct', d1: g1?.record?.irrigated_pct, d2: g2?.record?.irrigated_pct, diff: deltas?.irrigated_diff }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" />
            <span>Regional Comparative Assessment Tool</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            State vs State / Regional Benchmark Comparator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Side-by-side indicator benchmarking showing delta differences across all 9-fold land classifications, irrigation intensity, and forest preservation.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <select
            value={geo1}
            onChange={e => setGeo1(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {states.map(s => (
              <option key={s.state_code} value={s.state_code}>{s.state_name}</option>
            ))}
          </select>

          <span className="text-slate-400 font-bold">vs</span>

          <select
            value={geo2}
            onChange={e => setGeo2(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {states.map(s => (
              <option key={s.state_code} value={s.state_code}>{s.state_name}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {[2025, 2020, 2015, 2010, 2005].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-3 gap-4 pb-3 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-center">
          <div className="text-left text-slate-400 uppercase text-[10px]">Land Indicator</div>
          <div className="text-brand-700 dark:text-brand-300">{g1?.name} ({year})</div>
          <div className="text-emerald-700 dark:text-emerald-300">{g2?.name} ({year})</div>
        </div>

        <div className="space-y-2">
          {comparisonRows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 items-center text-xs"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {row.label}
              </div>
              <div className="text-center font-mono font-bold text-slate-900 dark:text-white">
                {row.d1 !== undefined ? `${row.d1}%` : '—'}
              </div>
              <div className="text-center font-mono font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <span>{row.d2 !== undefined ? `${row.d2}%` : '—'}</span>
                {row.diff !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    row.diff > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {row.diff > 0 ? `+${row.diff} pp` : `${row.diff} pp`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
