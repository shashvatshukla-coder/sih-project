import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { LandUseRecord } from '../../types';

interface DonutProps {
  record: LandUseRecord | null;
}

export const LandDistributionDonut: React.FC<DonutProps> = ({ record }) => {
  if (!record) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        No land-use distribution data available for current selection.
      </div>
    );
  }

  const data = [
    { name: 'Agricultural Land', value: record.agricultural_pct, areaHa: record.agricultural_area_ha, color: '#16a34a' },
    { name: 'Forest Cover', value: record.forest_pct, areaHa: record.forest_area_ha, color: '#059669' },
    { name: 'Built-up / Urban', value: record.builtup_pct, areaHa: record.builtup_area_ha, color: '#475569' },
    { name: 'Water Bodies', value: record.waterbodies_pct, areaHa: record.waterbodies_area_ha, color: '#0284c7' },
    { name: 'Barren / Uncultivable', value: record.barren_pct, areaHa: record.barren_area_ha, color: '#d97706' },
    { name: 'Other / Fallow', value: record.other_pct, areaHa: record.other_area_ha, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-2.5 rounded-lg bg-slate-900 text-white shadow-xl text-xs border border-slate-700 text-left">
          <div className="font-semibold">{d.name}</div>
          <div className="text-slate-300 font-mono mt-0.5">
            Share: <strong className="text-white">{d.value}%</strong>
          </div>
          <div className="text-slate-400 text-[11px] font-mono">
            Extent: {Math.round(d.areaHa).toLocaleString()} Ha
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-full">
      {/* Chart Canvas */}
      <div className="w-full md:w-1/2 h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Area
          </span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
            {Math.round(record.total_area_ha / 100).toLocaleString()} km²
          </span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="w-full md:w-1/2 space-y-1.5 text-xs text-left">
        {data.map(item => (
          <div
            key={item.name}
            className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {item.value}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                ({Math.round(item.areaHa / 1000).toLocaleString()}k Ha)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
