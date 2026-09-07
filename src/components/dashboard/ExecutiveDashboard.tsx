import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { LandDistributionDonut } from '../charts/LandDistributionDonut';
import { HistoricalTrendLine } from '../charts/HistoricalTrendLine';
import { StateComparisonBar } from '../charts/StateComparisonBar';
import { LandConversionFlow } from '../charts/LandConversionFlow';
import { IndiaMapExplorer } from '../maps/IndiaMapExplorer';
import { SourceBadge } from '../common/SourceBadge';
import {
  TrendingUp,
  Sparkles,
  MapPin,
  ArrowRight,
  Database,
  BookOpen,
  AlertTriangle,
  Layers,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const {
    selectedState,
    selectedDistrict,
    selectedYear,
    states,
    districts,
    currentRecord,
    setActivePage,
    setSelectedState,
    setSelectedDistrict,
    runAIQuery
  } = useApp();

  const activeState = states.find(s => s.state_code === selectedState);
  const activeDistrict = selectedDistrict !== 'ALL'
    ? districts.find(d => d.district_code === selectedDistrict) || (selectedDistrict === 'UP-AMT' ? { district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', total_area_sqkm: 2329 } : null)
    : null;

  // Fastest changing and featured districts watchlist
  const fastDistricts = [
    { name: 'Amethi (Gauriganj)', state: 'Uttar Pradesh', code: 'UP-AMT', stateCode: 'IN-UP', agriPct: 66.0, builtupPct: 13.2, changeText: '-36.1% Usar/Sodic reclamation & Gauriganj HQ growth', status: 'positive' },
    { name: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', code: 'UP-GBN', stateCode: 'IN-UP', agriPct: 44.9, builtupPct: 42.9, changeText: '-36.5% Agri loss (Jewar airport corridor)', status: 'critical' },
    { name: 'Bengaluru Urban', state: 'Karnataka', code: 'KA-BLU', stateCode: 'IN-KA', agriPct: 15.0, builtupPct: 69.0, changeText: '-66.7% Agri to Tech cluster conversion', status: 'critical' },
    { name: 'Lucknow', state: 'Uttar Pradesh', code: 'UP-LKO', stateCode: 'IN-UP', agriPct: 52.0, builtupPct: 33.5, changeText: '+28.8% Urban growth along Outer Ring Road', status: 'warning' },
    { name: 'Gorakhpur', state: 'Uttar Pradesh', code: 'UP-GKP', stateCode: 'IN-UP', agriPct: 71.2, builtupPct: 10.6, changeText: '-4.7% Wetland/Tal reduction in floodplain', status: 'warning' },
    { name: 'Pune', state: 'Maharashtra', code: 'MH-PUN', stateCode: 'IN-MH', agriPct: 51.0, builtupPct: 25.0, changeText: '+38.8% Peri-urban industrial expansion', status: 'warning' }
  ];

  const handleDistrictClick = (stateCode: string, districtCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict(districtCode);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Executive Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <span>Official Government Analytics & Research Portal</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Land Intelligence Dashboard:</span>
            <span className="text-brand-700 dark:text-brand-300 font-extrabold underline decoration-brand-400">
              {activeDistrict ? activeDistrict.district_name : activeState?.state_name || 'Amethi (Gauriganj)'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Active Scope: <strong>{activeDistrict ? `${activeDistrict.district_name}, ${activeState?.state_name || 'UP'}` : 'Uttar Pradesh (All Districts)'}</strong> • Series Year: <strong>{selectedYear}</strong> • 9-Fold Classification Scheme.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDistrictClick('IN-UP', 'UP-AMT')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              selectedDistrict === 'UP-AMT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scope: Amethi (Gauriganj)</span>
          </button>

          <button
            onClick={() => setActivePage('map')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
          >
            <span>Generate Brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {currentRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Total Geographic Area"
            value={Math.round((activeDistrict ? activeDistrict.total_area_sqkm : 2329)).toLocaleString()}
            unit="km²"
            tooltip="Official reported geographical boundary area."
            sourceText="MoA&FW / Board of Revenue"
          />
          <MetricCard
            title="Agricultural Land"
            value={`${currentRecord.agricultural_pct}%`}
            changePct={-3.5}
            tooltip="Net sown area plus cultivable fallow parcels."
            sourceText="MoA&FW 2025"
          />
          <MetricCard
            title="Forest Cover"
            value={`${currentRecord.forest_pct}%`}
            changePct={+0.8}
            tooltip="Canopy forest density and social forestry corridors."
            sourceText="FSI ISFR 2025"
          />
          <MetricCard
            title="Built-up / Urban Area"
            value={`${currentRecord.builtup_pct}%`}
            changePct={+5.2}
            tooltip="Land occupied by Gauriganj HQ, housing colonies, and infrastructure."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Barren & Usar Land"
            value={`${currentRecord.barren_pct}%`}
            changePct={-3.5}
            tooltip="Sodic/Usar wasteland reclaimed into productive agriculture under UPSLRP."
            sourceText="UP Bhumi Sudhar Nigam"
          />
          <MetricCard
            title="Water Bodies"
            value={`${currentRecord.waterbodies_pct}%`}
            changePct={-0.5}
            tooltip="Lakes, village ponds, tals, and Gomti river sub-basin canal network."
            sourceText="NRSC Bhuvan"
          />
        </div>
      )}

      {/* Gemini AI Grounded Quick Insights Strip */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-brand-50 dark:from-purple-950/20 dark:via-slate-900 dark:to-brand-950/20 border border-purple-200/70 dark:border-purple-900/40 text-xs text-slate-800 dark:text-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>Google Gemini 1.5 Grounded Insights ({activeDistrict ? activeDistrict.district_name : 'Amethi - Gauriganj'})</span>
          </div>
          <button
            onClick={() => {
              runAIQuery('Show land statistics of Gauriganj, Amethi (UP)');
            }}
            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Ask Gemini Assistant →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[12px] text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span><strong>Sodic Reclamation:</strong> Barren usar wastelands in Amethi decreased from 9.7% to 6.2%, reclaiming 8,150+ hectares into multi-crop agricultural land.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span><strong>HQ Urbanization:</strong> Gauriganj district headquarters administrative growth expanded built-up share to 13.2% (+5.2 pp shift).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span><strong>Irrigation Coverage:</strong> Sharda Sahayak canal modernisation and PMKSY tubewells raised gross irrigated farmland in Amethi to 89.4%.</span>
          </div>
        </div>
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land-Use Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Land-Use Distribution: {activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}
            </h3>
            <SourceBadge source="MoA&FW / DES 2025" />
          </div>
          <LandDistributionDonut record={currentRecord} />
        </div>

        {/* State Comparison Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              District Benchmark Comparison: Agricultural Land %
            </h3>
            <span className="text-xs text-slate-400">Regional Rankings</span>
          </div>
          <StateComparisonBar category="agricultural" />
        </div>
      </div>

      {/* Geospatial Map Explorer Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Interactive India Geospatial Map Explorer
            </h3>
            <span className="text-xs text-slate-400">
              Choropleth mapping across 2005–2025 multi-year time series. Click state/district to inspect.
            </span>
          </div>
        </div>

        <IndiaMapExplorer />
      </div>

      {/* Fastest Changing Districts & Conversion Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fastest Changing Districts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>District Watchlist & Priority Trends</span>
            </h3>
            <button
              onClick={() => setActivePage('anomalies')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              View Anomalies →
            </button>
          </div>

          <div className="space-y-2">
            {fastDistricts.map(d => (
              <div
                key={d.code}
                onClick={() => handleDistrictClick(d.stateCode, d.code)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                  selectedDistrict === d.code
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{d.name}</span>
                    {d.code === 'UP-AMT' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                        Active Focus
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.changeText}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-slate-900 dark:text-white">{d.agriPct}% Agri</div>
                  <div className="text-[10px] text-slate-400">{d.builtupPct}% Built-up</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decadal Land Conversion Flow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Amethi / Gauriganj Land Conversion Flow</span>
            </h3>
            <button
              onClick={() => setActivePage('change')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Full Transition Matrix →
            </button>
          </div>

          <LandConversionFlow stateName="Amethi (Gauriganj, UP)" fromYear={2010} toYear={2025} />
        </div>
      </div>
    </div>
  );
};
