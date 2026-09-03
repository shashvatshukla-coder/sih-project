import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PolicyDecisionDashboard: React.FC = () => {
  const { setSelectedState, setSelectedDistrict, setActivePage } = useApp();

  const handleInspect = (stateCode: string, districtCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict(districtCode);
    setActivePage('statistics');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Executive Decision Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300">
          <Scale className="w-4 h-4" />
          <span>Executive Policy Decision Support System</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          Priority Land Governance Alerts & Critical Strategic Zones
        </h2>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Aggregates real-time anomaly thresholds, agricultural land loss warnings, and irrigation expansion milestones for administrative intervention.
        </p>
      </div>

      {/* Traffic Light State Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Critical Alerts Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-900/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Critical Attention
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">3 Districts</span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Rapid Agricultural Farmland Contraction
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Districts exhibiting accelerated conversion of fertile double-cropped alluvial parcels into industrial and highway ribbons (&gt;35% decadal loss).
          </p>

          <div className="space-y-1.5 pt-1">
            <div
              onClick={() => handleInspect('IN-UP', 'UP-GBN')}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Gautam Buddha Nagar</span>
                <span className="text-[10px] text-slate-400 block">Agri share down to 44.9%</span>
              </div>
              <span className="text-rose-600 font-bold font-mono text-[11px]">-36.5% shift</span>
            </div>

            <div
              onClick={() => handleInspect('IN-KA', 'KA-BLU')}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Bengaluru Urban</span>
                <span className="text-[10px] text-slate-400 block">Agri share down to 15.0%</span>
              </div>
              <span className="text-rose-600 font-bold font-mono text-[11px]">-66.7% shift</span>
            </div>
          </div>
        </div>

        {/* Needs Attention Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-900/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs Attention
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">2 Regions</span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Surface Water Body & Tal Siltation
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Perennial wetlands, oxbow tals, and village water tanks showing net surface reduction of 4.5% to 6.2% across Rapti and Ganga basins.
          </p>

          <div className="space-y-1.5 pt-1">
            <div
              onClick={() => handleInspect('IN-UP', 'UP-GKP')}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Gorakhpur Floodplain</span>
                <span className="text-[10px] text-slate-400 block">Water bodies at 6.1%</span>
              </div>
              <span className="text-amber-600 font-bold font-mono text-[11px]">-4.7% extent</span>
            </div>
          </div>
        </div>

        {/* Healthy Progress Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-900/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Positive Milestones
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">7 States</span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            PMKSY Irrigation & Cadastral Coverage
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gross irrigated land expanded past 87% in UP and 58% in MP, alongside 91% geo-referencing of village cadastral maps under DILRMP.
          </p>

          <div className="space-y-1.5 pt-1">
            <div
              onClick={() => { setSelectedState('IN-UP'); setActivePage('policy'); }}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Bundelkhand Irrigation</span>
                <span className="text-[10px] text-slate-400 block">Fallow land down to 11.4%</span>
              </div>
              <span className="text-emerald-600 font-bold font-mono text-[11px]">+14.5% Rabi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Strip for Officers */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All statistics backed by verified MoA&FW, NRSC, and FSI series datasets.</span>
        </div>
        <button
          onClick={() => setActivePage('reports')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Generate Executive Brief</span>
        </button>
      </div>
    </div>
  );
};
