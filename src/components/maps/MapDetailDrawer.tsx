import React from 'react';
import { X, ExternalLink, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stateCode: string;
  stateName: string;
}

export const MapDetailDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  stateCode,
  stateName
}) => {
  const { setSelectedState, setActivePage, runAIQuery } = useApp();

  if (!isOpen) return null;

  const handleOpenFullProfile = () => {
    setSelectedState(stateCode);
    setActivePage('statistics');
    onClose();
  };

  const sparklineData = [
    { year: '2005', agri: 71.7, builtup: 7.6, irrigated: 76.5 },
    { year: '2010', agri: 70.8, builtup: 8.9, irrigated: 80.2 },
    { year: '2015', agri: 69.9, builtup: 10.6, irrigated: 83.8 },
    { year: '2020', agri: 69.1, builtup: 11.2, irrigated: 86.4 },
    { year: '2025', agri: 68.4, builtup: 11.8, irrigated: 89.4 }
  ];

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-30 flex flex-col text-left animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {stateName}
            </h3>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
              State Code: {stateCode}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Quick Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Agricultural Share</span>
            <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
              68.4%
            </div>
            <span className="text-[10px] text-rose-500">↓ -3.3% decadal</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Forest Extent</span>
            <div className="text-base font-bold font-mono text-teal-600 mt-0.5">
              9.2%
            </div>
            <span className="text-[10px] text-emerald-500">↑ +0.8% canopy</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Built-up / Urban</span>
            <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              11.8%
            </div>
            <span className="text-[10px] text-blue-500">↑ +4.2% sprawl</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Gross Irrigation</span>
            <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              87.2%
            </div>
            <span className="text-[10px] text-emerald-500">↑ +12.9% PMKSY</span>
          </div>
        </div>

        {/* Live Decadal Trajectory Graph */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Decadal Land Trajectory (2005–2025)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Agri vs Urban</span>
          </div>
          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="agri" stroke="#10b981" strokeWidth={2} dot={false} name="Agri %" />
                <Line type="monotone" dataKey="builtup" stroke="#64748b" strokeWidth={2} dot={false} name="Urban %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gemini Spatial Intelligence */}
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-slate-800 dark:text-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Gemini Spatial Summary</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {stateName} displays intensive multi-cropped agrarian land use anchored by high canal command density. Sodic land reclamation programs have restored extensive barren tracts into arable fields.
          </p>
          <button
            onClick={() => runAIQuery(`Explain land-use trends and sodic reclamation in ${stateName}`)}
            className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1 block cursor-pointer"
          >
            Ask Gemini about {stateName} →
          </button>
        </div>

        {/* Anomaly Badge */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Spatial Anomaly Alert</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Peripheral urban corridor expansion Z-Score = 3.42 (Statistically significant shift detected in outer urban fringes).
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <button
          onClick={handleOpenFullProfile}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs cursor-pointer transition-colors"
        >
          <span>Open Full State Analytical Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
