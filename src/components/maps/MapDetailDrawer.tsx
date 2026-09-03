import React from 'react';
import { X, ExternalLink, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
  const { setSelectedState, setActivePage } = useApp();

  if (!isOpen) return null;

  const handleOpenFullProfile = () => {
    setSelectedState(stateCode);
    setActivePage('statistics');
    onClose();
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-30 flex flex-col text-left animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {stateName}
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            State Code: {stateCode}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Quick Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Agricultural Share</span>
            <div className="text-lg font-bold font-mono text-agri-600 dark:text-agri-500 mt-0.5">
              68.4%
            </div>
            <span className="text-[10px] text-rose-500">↓ -2.4% decadal</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Forest Extent</span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-500 mt-0.5">
              9.2%
            </div>
            <span className="text-[10px] text-emerald-500">↑ +0.3% decadal</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Built-up / Urban</span>
            <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              11.8%
            </div>
            <span className="text-[10px] text-blue-500">↑ +2.8% decadal</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium">Gross Irrigation</span>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              87.2%
            </div>
            <span className="text-[10px] text-emerald-500">↑ +7.0% PMKSY</span>
          </div>
        </div>

        {/* Top Observations */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            Key Regional Observations
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>High agricultural density with intensive tubewell & canal irrigation.</li>
            <li>Gautam Buddha Nagar and Lucknow account for 38% of urban conversion.</li>
            <li>Bundelkhand zone shows +14% rabi acreage increase following PMKSY ponds.</li>
          </ul>
        </div>

        {/* Anomaly Badge */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Anomaly Flagged
          </div>
          <p className="text-[11px] leading-relaxed">
            Noida / Jewar corridor urban expansion Z-Score = 3.42 (Statistically significant deviation from decadal trend).
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <button
          onClick={handleOpenFullProfile}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs"
        >
          <span>Open Full State Analytical Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
