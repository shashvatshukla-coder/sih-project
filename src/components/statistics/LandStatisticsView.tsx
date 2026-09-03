import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { LandDistributionDonut } from '../charts/LandDistributionDonut';
import { StateComparisonBar } from '../charts/StateComparisonBar';
import { SourceBadge } from '../common/SourceBadge';
import { MapPin, TrendingUp, Sparkles } from 'lucide-react';

export const LandStatisticsView: React.FC = () => {
  const { selectedState, selectedDistrict, selectedYear, states, districts, currentRecord } = useApp();

  const activeState = states.find(s => s.state_code === selectedState);
  const activeDistrict = selectedDistrict !== 'ALL' ? districts.find(d => d.district_code === selectedDistrict) : null;

  return (
    <div className="space-y-6 text-left">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Comprehensive Administrative Profile</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            {activeDistrict ? `${activeDistrict.district_name} District (${activeState?.state_name})` : `${activeState?.state_name || 'All India'} Land Profile`}
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>Total Geographic Extent: <strong className="text-slate-700 dark:text-slate-200 font-mono">{(activeDistrict ? activeDistrict.total_area_sqkm : activeState?.total_area_sqkm || 3287263).toLocaleString()} km²</strong></span>
            <span>•</span>
            <span>Series Year: <strong className="text-slate-700 dark:text-slate-200 font-mono">{selectedYear}</strong></span>
            <span>•</span>
            <span>Classification: <strong className="text-slate-700 dark:text-slate-200">MoA&FW 9-Fold Standard</strong></span>
          </div>
        </div>
      </div>

      {/* Primary KPI Indicators */}
      {currentRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Agricultural Land"
            value={`${currentRecord.agricultural_pct}%`}
            changePct={-1.8}
            tooltip="Net sown area plus current and temporary fallow parcels."
            sourceText="MoA&FW 2025"
          />
          <MetricCard
            title="Forest Cover"
            value={`${currentRecord.forest_pct}%`}
            changePct={+0.3}
            tooltip="Classified state and private forest canopy extent."
            sourceText="FSI ISFR 2025"
          />
          <MetricCard
            title="Built-up / Urban"
            value={`${currentRecord.builtup_pct}%`}
            changePct={+2.8}
            tooltip="Area occupied by residential, industrial, roads, and non-agri structures."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Gross Irrigation"
            value={`${currentRecord.irrigated_pct}%`}
            changePct={+7.0}
            tooltip="Share of cultivated land with assured canal/tubewell irrigation."
            sourceText="MoA PMKSY"
          />
          <MetricCard
            title="Water Bodies"
            value={`${currentRecord.waterbodies_pct}%`}
            changePct={-0.3}
            tooltip="Lakes, ponds, rivers, reservoirs, and perennial wetlands."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Barren / Wasteland"
            value={`${currentRecord.barren_pct}%`}
            changePct={-0.5}
            tooltip="Uncultivable rocky outcrops, ravines, and saline lands."
            sourceText="MoA&FW 2025"
          />
        </div>
      )}

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land-Use Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Land-Use Distribution Breakdown
            </h3>
            <SourceBadge source="Directorate of Economics & Statistics" />
          </div>
          <LandDistributionDonut record={currentRecord} />
        </div>

        {/* State Comparison Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Inter-State Benchmark Comparison
            </h3>
            <span className="text-xs text-slate-400">All India Rankings</span>
          </div>
          <StateComparisonBar category="agricultural" />
        </div>
      </div>
    </div>
  );
};
