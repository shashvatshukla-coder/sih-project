import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Info,
  Loader2,
  Map,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trees,
  Waves,
} from 'lucide-react';
import { policyLabApi, PolicyLabScenarioRequest } from '../../services/policyLabApi';

const DEFAULT_POLICY: PolicyLabScenarioRequest = {
  agriculture_protection: 80,
  water_protection: 80,
  forest_protection: 50,
};

const QUICK_POLICIES = [
  { label: 'Protect agriculture', text: 'What if agricultural land conversion is restricted to 20%?', agriculture: 80, water: 0, forest: 0 },
  { label: 'Protect water', text: 'What if 90% of water and wetland areas are protected?', agriculture: 0, water: 90, forest: 0 },
  { label: 'Green growth', text: 'What if agricultural, water and forest conversion are strongly restricted?', agriculture: 80, water: 80, forest: 70 },
];

const scenarioColors: Record<string, string> = {
  BAU: 'bg-slate-900',
  'Custom Policy': 'bg-emerald-600',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

function extractPercent(text: string, fallback: number) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : fallback;
}

function parsePolicyText(text: string, current: PolicyLabScenarioRequest) {
  const lower = text.toLowerCase();
  const percent = extractPercent(text, 20);
  const protection = Math.max(0, Math.min(100, 100 - percent));
  const next = { ...current, policy_text: text };

  if (lower.includes('agricultur') || lower.includes('farm') || lower.includes('cropland')) {
    next.agriculture_protection = protection;
  }
  if (lower.includes('water') || lower.includes('wetland') || lower.includes('lake')) {
    next.water_protection = protection;
  }
  if (lower.includes('forest') || lower.includes('green cover') || lower.includes('woodland')) {
    next.forest_protection = protection;
  }
  return next;
}

export const PolicyLab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'prediction' | 'simulation' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [prompt, setPrompt] = useState('What if agricultural land conversion is restricted to 20%?');
  const [policy, setPolicy] = useState<PolicyLabScenarioRequest>(DEFAULT_POLICY);

  const totals = useMemo(() => {
    if (!result?.area_summary) return [];
    const names = ['BAU', 'Custom Policy', 'Controlled Urban Growth', 'Sustainable Development'];
    return names.map((scenario) => {
      const rows = result.area_summary.filter((row: any) => row.scenario === scenario);
      if (!rows.length) return null;
      return {
        scenario,
        built: rows.find((row: any) => row.land_use === 'Built-up')?.area_km2 ?? 0,
        agriculture: rows.find((row: any) => row.land_use === 'Agriculture')?.area_km2 ?? 0,
        water: rows.find((row: any) => row.land_use === 'Water/Wetland')?.area_km2 ?? 0,
      };
    }).filter(Boolean);
  }, [result]);

  const bau = totals.find((row: any) => row.scenario === 'BAU');
  const custom = totals.find((row: any) => row.scenario === 'Custom Policy');
  const builtUpSaved = bau && custom ? bau.built - custom.built : 0;

  const applyPrompt = () => {
    setPolicy(parsePolicyText(prompt, policy));
  };

  const runLab = async () => {
    setLoading(true);
    setError(null);
    setStage('prediction');
    try {
      await policyLabApi.predict();
      setStage('simulation');
      const scenarios = await policyLabApi.scenarios(policy);
      setResult(scenarios.data || null);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage('idle');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPolicy(DEFAULT_POLICY);
    setPrompt('What if agricultural land conversion is restricted to 20%?');
    setResult(null);
    setError(null);
    setStage('idle');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" /> Executive Policy Decision Support
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">PolicyLab: Ask “What if?”</h1>
            <p className="mt-3 text-sm md:text-base leading-6 text-slate-300">
              Test a land-policy idea against the 2030 Random Forest baseline, quantify the land-use impact, and turn the result into an evidence-backed decision.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Map className="w-4 h-4 text-emerald-300" /> Ghaziabad · 2030 horizon
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="w-4 h-4 text-emerald-600" /> Describe your policy</div>
              <p className="mt-1 text-xs text-slate-500">Use plain language. Example: “Restrict agricultural land conversion to 20%.”</p>
            </div>
            <button onClick={reset} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-slate-400"
              placeholder="What policy do you want to test?"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Policy text is translated into explicit simulation parameters.</span>
              <button onClick={applyPrompt} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                Interpret policy <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_POLICIES.map((item) => (
              <button key={item.label} onClick={() => { setPrompt(item.text); setPolicy({ agriculture_protection: item.agriculture, water_protection: item.water, forest_protection: item.forest, policy_text: item.text }); }} className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:border-emerald-400 hover:text-emerald-700">
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Policy controls</div>
          <p className="mt-1 text-xs text-slate-500">Protection level applied to conversion pressure.</p>
          <div className="mt-5 space-y-5">
            {[
              ['Agriculture', 'agriculture_protection', Activity],
              ['Water / Wetland', 'water_protection', Waves],
              ['Forest', 'forest_protection', Trees],
            ].map(([label, key, Icon]: any) => (
              <label key={key} className="block">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-emerald-600" />{label}</span>
                  <span>{policy[key]}%</span>
                </div>
                <input type="range" min="0" max="100" step="5" value={policy[key]} onChange={(e) => setPolicy({ ...policy, [key]: Number(e.target.value) })} className="w-full accent-emerald-600" />
              </label>
            ))}
          </div>
          <button onClick={runLab} disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 dark:bg-white px-5 py-3 text-sm font-bold text-white dark:text-slate-950 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Running evidence model…' : 'Run policy simulation'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Prediction engine', 'Random Forest', BrainCircuit],
          ['Evidence inputs', 'LULC + slope + roads', Activity],
          ['Decision horizon', '2030 baseline', Map],
          ['Output', 'Impact + comparison', BarChart3],
        ].map(([title, value, Icon]: any) => (
          <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <Icon className="w-5 h-5 text-emerald-600" />
            <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">{title}</div>
            <div className="mt-1 text-sm font-semibold">{value}</div>
          </div>
        ))}
      </section>

      {stage !== 'idle' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap gap-5 text-xs font-semibold">
            <span className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> RF prediction {stage === 'prediction' ? 'running' : 'complete'}</span>
            <span className={`flex items-center gap-2 ${stage === 'simulation' || stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4" /> Policy simulation</span>
            <span className={`flex items-center gap-2 ${stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4" /> Decision impact</span>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {totals.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-lg">2030 impact comparison</h2></div>
              <p className="text-xs text-slate-500 mt-1">BAU is compared with the policy parameters selected above.</p>
            </div>
            {builtUpSaved > 0 && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-right"><div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Built-up area avoided</div><div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(builtUpSaved)} km²</div></div>}
          </div>

          <div className="space-y-4">
            {totals.map((row: any) => {
              const maxBuilt = Math.max(...totals.map((item: any) => item.built), 1);
              return (
                <div key={row.scenario} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">{row.scenario}</span><span className="text-xs text-slate-500">Built-up: {formatNumber(row.built)} km²</span></div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${scenarioColors[row.scenario] || 'bg-emerald-600'}`} style={{ width: `${Math.max(4, (row.built / maxBuilt) * 100)}%` }} /></div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><span className="text-slate-400">Agriculture</span><div className="font-semibold mt-1">{formatNumber(row.agriculture)} km²</div></div><div><span className="text-slate-400">Water / Wetland</span><div className="font-semibold mt-1">{formatNumber(row.water)} km²</div></div></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {result && (
        <section className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-5">
          <div className="flex items-start gap-3"><Info className="w-5 h-5 text-amber-600 mt-0.5" /><div><h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">Evidence note</h3><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">{result.note || 'Results are baseline model projections and should be interpreted as decision-support evidence, not a certain future forecast.'}</p></div></div>
        </section>
      )}
    </div>
  );
};

export default PolicyLab;
