import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { LandDistributionDonut } from '../charts/LandDistributionDonut';
import { StateComparisonBar } from '../charts/StateComparisonBar';
import { SourceBadge } from '../common/SourceBadge';
import { MapPin, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export const LandStatisticsView: React.FC = () => {
  const { selectedState, selectedDistrict, setSelectedDistrict, selectedYear, states, districts, currentRecord } = useApp();

  const activeState = states.find(s => s.state_code === selectedState);
  const activeDistrict = selectedDistrict !== 'ALL'
    ? districts.find(d => d.district_code === selectedDistrict) || (selectedDistrict === 'UP-AMT' ? { district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', total_area_sqkm: 2329 } : null)
    : (selectedState === 'IN-UP' ? { district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', total_area_sqkm: 2329 } : null);

  return (
    <div className="space-y-6 text-left">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Comprehensive Administrative Profile</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>{activeDistrict ? `${activeDistrict.district_name} District (${activeState?.state_name || 'UP'})` : `${activeState?.state_name || 'Uttar Pradesh'} Land Profile`}</span>
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>Total Geographical Scope: <strong className="text-slate-700 dark:text-slate-200 font-mono">{(activeDistrict ? activeDistrict.total_area_sqkm : 2329).toLocaleString()} km² (232,900 Ha)</strong></span>
            <span>•</span>
            <span>Series Year: <strong className="text-slate-700 dark:text-slate-200 font-mono">{selectedYear}</strong></span>
            <span>•</span>
            <span>Classification Standard: <strong className="text-slate-700 dark:text-slate-200">MoA&FW 9-Fold Protocol</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDistrict('UP-AMT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              selectedDistrict === 'UP-AMT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Focus: Amethi (Gauriganj)</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Indicators */}
      {currentRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Agricultural Land"
            value={`${currentRecord.agricultural_pct}%`}
            changePct={-3.5}
            tooltip="Net sown area plus current and temporary cultivable fallow parcels."
            sourceText="MoA&FW 2025"
          />
          <MetricCard
            title="Forest Cover"
            value={`${currentRecord.forest_pct}%`}
            changePct={+0.8}
            tooltip="Classified state reserve and social forestry canopy extent."
            sourceText="FSI ISFR 2025"
          />
          <MetricCard
            title="Built-up / Urban Area"
            value={`${currentRecord.builtup_pct}%`}
            changePct={+5.2}
            tooltip="Area occupied by Gauriganj district HQ, housing colonies, transport, and commercial structures."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Gross Irrigation"
            value={`${currentRecord.irrigated_pct}%`}
            changePct={+12.9}
            tooltip="Share of cultivated land with assured Sharda Sahayak canal and tube-well irrigation."
            sourceText="MoA PMKSY"
          />
          <MetricCard
            title="Water Bodies"
            value={`${currentRecord.waterbodies_pct}%`}
            changePct={-0.5}
            tooltip="Lakes, village ponds, perennial tals, and Gomti river sub-basin canal systems."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Barren & Usar Land"
            value={`${currentRecord.barren_pct}%`}
            changePct={-3.5}
            tooltip="Alkaline/Sodic wastelands reclaimed into active crop production under UPSLRP."
            sourceText="UP Bhumi Sudhar"
          />
        </div>
      )}

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land-Use Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Land-Use Distribution: {activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}
            </h3>
            <SourceBadge source="Directorate of Economics & Statistics" />
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
    </div>
  );
};
