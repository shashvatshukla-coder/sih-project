import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { FileCheck2, AlertCircle, TrendingUp, CheckCircle2, Info, Building2, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { PolicyRepository } from './PolicyRepository';

export const PolicyImpactAnalyzer: React.FC = () => {
  const { selectedState, states } = useApp();
  const [activeTab, setActiveTab] = useState<'repository' | 'impact'>('repository');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('POL-PMKSY');
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpact() {
      try {
        setLoading(true);
        const data = await api.getPolicyImpact(selectedPolicyId, selectedState);
        setImpactData(data);
      } catch (err) {
        console.error('Failed to load policy impact:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, [selectedPolicyId, selectedState]);

  const policy = impactData?.policy;
  const indicators = impactData?.indicators || [];
  const timeSeries = impactData?.timeSeries || [];

  return (
    <div className="space-y-6 text-left">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-fit border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('repository')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'repository'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Policy & Scheme Repository (Area Targets & Gazette Ingestion)</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Before vs After Impact Simulation</span>
        </button>
      </div>

      {activeTab === 'repository' ? (
        <PolicyRepository />
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Before vs After Policy Intervention Assessment</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {policy?.name || 'Policy Impact Analysis'}
              </h2>
              <span className="text-xs text-slate-400">
                Launched: <strong className="text-slate-700 dark:text-slate-200 font-mono">{policy?.launch_year}</strong> • Ministry: {policy?.ministry}
              </span>
            </div>

            {/* Policy Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPolicyId}
                onChange={e => setSelectedPolicyId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <option value="POL-PMKSY">PMKSY (Irrigation Mission)</option>
                <option value="POL-DILRMP">DILRMP (Digital Cadastre)</option>
                <option value="POL-GIM">Green India Mission (Forests)</option>
              </select>
            </div>
          </div>

          {/* Mandatory Scientific Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Methodological Notice:</strong> {impactData?.disclaimer || 'Observed association does not necessarily imply direct causation. Other macroeconomic, rainfall, and state-level factors may influence observed land-use shifts.'}
            </div>
          </div>

          {/* Indicators Before/After Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((ind: any) => (
              <div
                key={ind.name}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500">{ind.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    ind.pctChange > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {ind.pctChange > 0 ? `+${ind.pctChange}%` : `${ind.pctChange}%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Before Intervention</span>
                    <span className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono">
                      {ind.before}{ind.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">After Intervention</span>
                    <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono">
                      {ind.after}{ind.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Long-Term Time Series Trajectory */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Decadal Trajectory with Policy Intervention Marker
              </h3>
              <p className="text-xs text-slate-500">
                Shows state land-use categories across 1970–2024 with a vertical guideline marking the policy launch year.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg text-xs">
                            <span className="font-bold block mb-1">Year {label}</span>
                            {payload.map((p: any) => (
                              <div key={p.dataKey} className="font-mono mt-0.5">
                                {p.name}: <strong>{p.value}%</strong>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    x={policy?.launch_year || 2015}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{ value: `Rollout (${policy?.launch_year})`, fill: '#ef4444', fontSize: 10, position: 'top' }}
                  />
                  <Line type="monotone" dataKey="irrigated" name="Irrigated Land %" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="agricultural" name="Agricultural Land %" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
