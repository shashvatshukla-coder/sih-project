import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface HistoricalTrendProps {
  data: Array<{
    year: number;
    agricultural?: number;
    forest?: number;
    builtup?: number;
    water?: number;
    barren?: number;
    irrigated?: number;
    [key: string]: any;
  }>;
}

export const HistoricalTrendLine: React.FC<HistoricalTrendProps> = ({ data }) => {
  const [activeCategories, setActiveCategories] = useState<{ [key: string]: boolean }>({
    agricultural: true,
    forest: true,
    builtup: true,
    water: false,
    barren: false,
    irrigated: true
  });

  const categories = [
    { key: 'agricultural', label: 'Agricultural %', color: '#16a34a' },
    { key: 'forest', label: 'Forest %', color: '#059669' },
    { key: 'builtup', label: 'Built-up %', color: '#64748b' },
    { key: 'irrigated', label: 'Irrigated %', color: '#2563eb' },
    { key: 'water', label: 'Water Bodies %', color: '#0284c7' },
    { key: 'barren', label: 'Barren %', color: '#d97706' }
  ];

  const toggleCategory = (key: string) => {
    setActiveCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg bg-slate-900 text-white shadow-xl text-xs border border-slate-700 text-left space-y-1">
          <div className="font-bold text-brand-300 font-mono pb-1 border-b border-slate-700">
            Year: {label}
          </div>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}:
              </span>
              <span className="font-mono font-bold text-white">{p.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Category Toggle Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">Series:</span>
        {categories.map(c => {
          const isActive = activeCategories[c.key];
          return (
            <button
              key={c.key}
              onClick={() => toggleCategory(c.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-800 text-white dark:bg-slate-700 border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recharts Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            {categories.map(c => {
              if (!activeCategories[c.key]) return null;
              return (
                <Line
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  name={c.label.replace(' %', '')}
                  stroke={c.color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: c.color, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
