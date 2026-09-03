import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, ActivitySquare, TrendingDown, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { LandConversionFlow } from '../charts/LandConversionFlow';

export const LandUseChangeView: React.FC = () => {
  const { selectedState, states } = useApp();
  const [fromYear, setFromYear] = useState<number>(2010);
  const [toYear, setToYear] = useState<number>(2025);

  const stateName = states.find(s => s.state_code === selectedState)?.state_name || 'Uttar Pradesh';

  const conversionMatrix = [
    { category: 'Agricultural Land', startPct: 70.8, endPct: 68.4, startHa: 17224000, endHa: 16640000, deltaHa: -584000, changePct: -3.4 },
    { category: 'Forest Cover', startPct: 8.9, endPct: 9.2, startHa: 2165000, endHa: 2240000, deltaHa: +75000, changePct: +3.5 },
    { category: 'Built-up / Urban Area', startPct: 9.0, endPct: 11.8, startHa: 2189000, endHa: 2870000, deltaHa: +681000, changePct: +31.1 },
    { category: 'Water Bodies & Wetlands', startPct: 3.9, endPct: 3.7, startHa: 950000, endHa: 900000, deltaHa: -50000, changePct: -5.3 },
    { category: 'Barren & Uncultivable', startPct: 4.3, endPct: 4.1, startHa: 1040000, endHa: 997600, deltaHa: -42400, changePct: -4.1 },
    { category: 'Other / Fallow Lands', startPct: 3.1, endPct: 2.8, startHa: 760600, endHa: 681000, deltaHa: -79600, changePct: -10.5 }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <ActivitySquare className="w-4 h-4" />
            <span>Multi-Period Land Conversion & Transition Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {stateName}: Land Conversion Dynamics ({fromYear} → {toYear})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Quantify inter-category acreage transitions, agricultural displacement into peri-urban zones, and wasteland reclamation across chosen milestone intervals.
          </p>
        </div>

        {/* Year Selectors */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span>From:</span>
            <select
              value={fromYear}
              onChange={e => setFromYear(Number(e.target.value))}
              className="bg-transparent font-mono cursor-pointer focus:outline-hidden"
            >
              {[2005, 2010, 2015].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span>To:</span>
            <select
              value={toYear}
              onChange={e => setToYear(Number(e.target.value))}
              className="bg-transparent font-mono cursor-pointer focus:outline-hidden"
            >
              {[2020, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conversion Transition Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Categorical Land Balance Sheet
          </h3>
          <span className="text-xs text-slate-400 font-mono">Area reported in Hectares (Ha)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Land Classification</th>
                <th className="py-2.5 px-3 font-mono">{fromYear} Share</th>
                <th className="py-2.5 px-3 font-mono">{fromYear} Extent</th>
                <th className="py-2.5 px-3 font-mono">{toYear} Share</th>
                <th className="py-2.5 px-3 font-mono">{toYear} Extent</th>
                <th className="py-2.5 px-3 font-mono">Net Delta</th>
                <th className="py-2.5 px-3 font-mono">Shift %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {conversionMatrix.map(row => (
                <tr key={row.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    {row.category}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{row.startPct}%</td>
                  <td className="py-3 px-3 text-slate-500">{row.startHa.toLocaleString()} Ha</td>
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{row.endPct}%</td>
                  <td className="py-3 px-3 text-slate-500">{row.endHa.toLocaleString()} Ha</td>
                  <td className={`py-3 px-3 font-bold ${row.deltaHa > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.deltaHa > 0 ? `+${row.deltaHa.toLocaleString()}` : row.deltaHa.toLocaleString()} Ha
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.changePct > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {row.changePct > 0 ? `+${row.changePct}%` : `${row.changePct}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transition Flow Matrix */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <LandConversionFlow stateName={stateName} fromYear={fromYear} toYear={toYear} />
      </div>
    </div>
  );
};
