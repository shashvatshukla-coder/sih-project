import React, { useMemo, useState } from 'react';
import { Activity, BrainCircuit, CheckCircle2, Loader2, Map, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { policyLabApi } from '../../services/policyLabApi';

const scenarioNames = ['BAU', 'Controlled Urban Growth', 'Sustainable Development'];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

export const PolicyLab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'prediction' | 'scenarios' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const totals = useMemo(() => {
    if (!result?.area_summary) return [];
    return scenarioNames.map((scenario) => {
      const rows = result.area_summary.filter((row: any) => row.scenario === scenario);
      const built = rows.find((row: any) => row.land_use === 'Built-up')?.area_km2 ?? 0;
      const agriculture = rows.find((row: any) => row.land_use === 'Agriculture')?.area_km2 ?? 0;
      const water = rows.find((row: any) => row.land_use === 'Water/Wetland')?.area_km2 ?? 0;
      return { scenario, built, agriculture, water };
    });
  }, [result]);

  const runLab = async () => {
    setLoading(true);
    setError(null);
    setStage('prediction');
    try {
      await policyLabApi.predict();
      setStage('scenarios');
      const scenarios = await policyLabApi.scenarios();
      setResult(scenarios.data || null);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" /> PolicyLab
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Land Policy Simulation & Decision Support</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Run the existing Ghaziabad Random Forest pipeline, generate a 2030 baseline, and compare policy simulations without replacing the existing BHU-DRISHTI workflow.
            </p>
          </div>
          <button
            onClick={runLab}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-slate-900 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Running PolicyLab…' : 'Run PolicyLab'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Model', 'Random Forest', BrainCircuit],
          ['Inputs', 'LULC + Slope + Roads', Activity],
          ['Horizon', '2030 baseline', Map],
          ['Scenarios', '3 policy paths', ShieldCheck],
        ].map(([title, value, Icon]: any) => (
          <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <Icon className="w-5 h-5 text-emerald-600" />
            <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">{title}</div>
            <div className="mt-1 text-sm font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {stage !== 'idle' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`inline-flex items-center gap-2 ${stage !== 'idle' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4" /> Prediction</span>
            <span className={`inline-flex items-center gap-2 ${stage === 'scenarios' || stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4" /> Scenario simulation</span>
            <span className={`inline-flex items-center gap-2 ${stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4" /> Results</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {totals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold">2030 Policy Scenario Comparison</h2>
              <p className="text-xs text-slate-500 mt-1">Areas are derived from the PolicyLab simulation raster output.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                  <th className="py-3 pr-4">Scenario</th>
                  <th className="py-3 pr-4">Built-up km²</th>
                  <th className="py-3 pr-4">Agriculture km²</th>
                  <th className="py-3">Water/Wetland km²</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((row) => (
                  <tr key={row.scenario} className="border-b last:border-0 border-slate-100 dark:border-slate-800/70">
                    <td className="py-3 pr-4 font-medium">{row.scenario}</td>
                    <td className="py-3 pr-4">{formatNumber(row.built)}</td>
                    <td className="py-3 pr-4">{formatNumber(row.agriculture)}</td>
                    <td className="py-3">{formatNumber(row.water)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
          <strong>Simulation note:</strong> {result.note}
        </div>
      )}
    </div>
  );
};

export default PolicyLab;
