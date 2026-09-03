import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';

interface StateComparisonProps {
  category?: string;
}

export const StateComparisonBar: React.FC<StateComparisonProps> = ({ category = 'agricultural' }) => {
  const { selectedState, setSelectedState } = useApp();

  const comparisonData = [
    { code: 'IN-UP', name: 'Uttar Pradesh', agricultural: 68.4, forest: 9.2, builtup: 11.8, irrigated: 87.2 },
    { code: 'IN-BR', name: 'Bihar', agricultural: 55.5, forest: 7.7, builtup: 19.5, irrigated: 67.5 },
    { code: 'IN-RJ', name: 'Rajasthan', agricultural: 53.0, forest: 8.3, builtup: 8.0, irrigated: 44.0 },
    { code: 'IN-MH', name: 'Maharashtra', agricultural: 53.8, forest: 17.5, builtup: 13.0, irrigated: 27.8 },
    { code: 'IN-KA', name: 'Karnataka', agricultural: 52.5, forest: 20.5, builtup: 12.0, irrigated: 41.0 },
    { code: 'IN-MP', name: 'Madhya Pradesh', agricultural: 49.2, forest: 28.5, builtup: 8.0, irrigated: 58.2 },
    { code: 'IN-TN', name: 'Tamil Nadu', agricultural: 43.5, forest: 21.5, builtup: 17.5, irrigated: 62.0 },
    { code: 'IN-GJ', name: 'Gujarat', agricultural: 52.0, forest: 10.5, builtup: 12.0, irrigated: 56.5 },
    { code: 'IN-WB', name: 'West Bengal', agricultural: 59.0, forest: 14.5, builtup: 17.5, irrigated: 66.0 },
    { code: 'IN-ALL', name: 'National Avg', agricultural: 52.6, forest: 22.0, builtup: 10.7, irrigated: 56.8 }
  ];

  const nationalAvg = comparisonData.find(d => d.code === 'IN-ALL')?.[category as keyof typeof comparisonData[0]] as number || 52.6;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-2.5 rounded-lg bg-slate-900 text-white shadow-xl text-xs border border-slate-700 text-left">
          <div className="font-bold">{d.name}</div>
          <div className="text-slate-300 font-mono mt-0.5">
            {category.toUpperCase()}: <strong className="text-white">{payload[0].value}%</strong>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            vs National Avg (52.6%): {Number((payload[0].value - nationalAvg).toFixed(1)) > 0 ? `+${(payload[0].value - nationalAvg).toFixed(1)}%` : `${(payload[0].value - nationalAvg).toFixed(1)}%`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={comparisonData.filter(d => d.code !== 'IN-ALL')}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis type="number" unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={nationalAvg}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ position: 'top', value: `National Avg (${nationalAvg}%)`, fill: '#ef4444', fontSize: 10 }}
          />
          <Bar dataKey={category} radius={[0, 4, 4, 0]}>
            {comparisonData.filter(d => d.code !== 'IN-ALL').map(entry => (
              <Cell
                key={entry.code}
                fill={entry.code === selectedState ? '#1F4D7E' : '#94A3B8'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedState(entry.code)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
