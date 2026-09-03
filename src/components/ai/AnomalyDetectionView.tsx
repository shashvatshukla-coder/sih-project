import React, { useState, useEffect } from 'react';
import { Anomaly } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, ShieldAlert, Sparkles, Filter, CheckCircle2, ArrowRight } from 'lucide-react';
import { WhySeeingThisModal } from '../common/WhySeeingThisModal';

export const AnomalyDetectionView: React.FC = () => {
  const { selectedState, setSelectedState, setActivePage } = useApp();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModalAnom, setActiveModalAnom] = useState<Anomaly | null>(null);

  useEffect(() => {
    async function loadAnomalies() {
      try {
        setLoading(true);
        const data = await api.getAnomalies(selectedState);
        setAnomalies(data || []);
      } catch (err) {
        console.error('Failed to load anomalies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnomalies();
  }, [selectedState]);

  const filtered = anomalies.filter(a => selectedSeverity === 'All' || a.severity.toLowerCase() === selectedSeverity.toLowerCase());

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>AI & Statistical Anomaly Detection Module</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Flagged Statistical Outliers & Unprecedented Land Shifts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Identifies administrative divisions exhibiting statistical deviations exceeding 2 standard deviations (|Z| &gt; 2.0) against historical decadal baselines. AI generates hypothesized research factors without asserting unverified causal certainty.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          {['All', 'Critical', 'Warning', 'Informational'].map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedSeverity === sev
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(anom => {
          const isCritical = anom.severity === 'Critical';
          const isWarning = anom.severity === 'Warning';

          return (
            <div
              key={anom.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs space-y-4 transition-all hover:shadow-md ${
                isCritical
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {anom.severity} Alert
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Z-Score: {anom.deviation_zscore > 0 ? `+${anom.deviation_zscore}` : anom.deviation_zscore}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {anom.geography_name} ({anom.state_code})
                  </h3>
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    Indicator: {anom.indicator} ({anom.year_range})
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalAnom(anom)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="View Statistical Formula & Confidence Breakdown"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </button>
              </div>

              {/* Observed vs Expected Values Box */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Observed Value</span>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {anom.observed_value}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Expected Benchmark</span>
                  <div className="font-medium text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                    {anom.expected_range}
                  </div>
                </div>
              </div>

              {/* Hypothesized Research Factors */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Potential Contributing Factors to Verify
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  {anom.possible_factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span className="font-mono">Confidence: {anom.confidence}%</span>
                <button
                  onClick={() => {
                    setSelectedState(anom.state_code);
                    setActivePage('statistics');
                  }}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <span>Analyze district</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Modal */}
      {activeModalAnom && (
        <WhySeeingThisModal
          isOpen={!!activeModalAnom}
          onClose={() => setActiveModalAnom(null)}
          title={`Anomaly Breakdown: ${activeModalAnom.geography_name}`}
          formula="Z = (Observed_Change - Historical_Mean) / Standard_Deviation"
          rawValues={`Observed: ${activeModalAnom.observed_value} | Baseline: ${activeModalAnom.expected_range} | Z-Score: ${activeModalAnom.deviation_zscore}`}
          stepExplanation={activeModalAnom.methodology}
        />
      )}
    </div>
  );
};
