import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { HistoricalTrendLine } from '../charts/HistoricalTrendLine';
import { MetricCard } from '../common/MetricCard';
import { TrendingUp, Sparkles, Filter, Download, Layers } from 'lucide-react';
import { LandCategory } from '../../types';

export const TrendAnalysisView: React.FC = () => {
  const { selectedState, selectedDistrict, states, districts } = useApp();
  const [trendData, setTrendData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<LandCategory>('agricultural');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrends() {
      try {
        setLoading(true);
        const data = await api.getTrendAnalysis(selectedState, selectedDistrict, selectedCategory);
        setTrendData(data);
      } catch (err) {
        console.error('Failed to load trend analysis:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, [selectedState, selectedDistrict, selectedCategory]);

  const summary = trendData?.summary;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Historical Multi-Decadal Time Series Analyzer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Land-Use Trend Dynamics & Structural Trajectories (2005–2025)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Examine compound annual growth rates (CAGR), decadal volatility, and absolute percentage point trajectories across agricultural, forest, urban, water, and barren land classifications.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as LandCategory)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <option value="agricultural">Agricultural Land</option>
            <option value="forest">Forest Cover</option>
            <option value="builtup">Built-up / Urban</option>
            <option value="waterbodies">Water Bodies</option>
            <option value="barren">Barren & Wasteland</option>
            <option value="irrigated">Gross Irrigated Area</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            title={`Baseline (${summary.startYear})`}
            value={`${summary.startValue}%`}
            tooltip="Initial recorded value in earliest baseline year."
            subtext="Baseline survey"
          />
          <MetricCard
            title={`Latest (${summary.endYear})`}
            value={`${summary.endValue}%`}
            tooltip="Most recently normalized land records value."
            subtext="2025 assessment"
          />
          <MetricCard
            title="Decadal Shift (pp)"
            value={`${summary.absoluteChange > 0 ? '+' : ''}${summary.absoluteChange} pp`}
            tooltip="Absolute percentage point difference between start and end years."
            changePct={summary.percentageChange}
            changePeriod="Relative shift %"
          />
          <MetricCard
            title="Annualized CAGR"
            value={`${summary.cagr}%`}
            unit="p.a."
            tooltip="Compound Annual Growth Rate over the 20-year span."
            subtext={`Trajectory: ${summary.direction}`}
          />
        </div>
      )}

      {/* Main Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Multi-Category Historical Trend Chart
            </h3>
            <span className="text-xs text-slate-500">
              Toggle individual indicator lines below to isolate comparative patterns.
            </span>
          </div>
        </div>

        {trendData?.data && (
          <HistoricalTrendLine data={trendData.data} />
        )}
      </div>
    </div>
  );
};
