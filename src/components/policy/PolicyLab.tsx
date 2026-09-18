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
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { policyLabApi, PolicyLabScenarioRequest } from '../../services/policyLabApi';
import { interpretPolicyQuestion, PolicyInterpretation } from './policyQuestionInterpreter';

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

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function formatSigned(value: number) {
  if (Math.abs(value) < 0.005) return '0.00';
  return `${value > 0 ? '+' : ''}${formatNumber(value)}`;
}

export const PolicyLab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'prediction' | 'simulation' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [prompt, setPrompt] = useState('What if agricultural land conversion is restricted to 20%?');
  const [policy, setPolicy] = useState<PolicyLabScenarioRequest>(DEFAULT_POLICY);
  const [interpretation, setInterpretation] = useState<PolicyInterpretation | null>(null);

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
  const builtUpChange = bau && custom ? custom.built - bau.built : 0;
  const agricultureChange = bau && custom ? custom.agriculture - bau.agriculture : 0;
  const waterChange = bau && custom ? custom.water - bau.water : 0;

  const applyPrompt = () => {
    const interpreted = interpretPolicyQuestion(prompt, policy);
    setInterpretation(interpreted);
    if (interpreted.recognized) {
      setPolicy(interpreted.policy);
      setError(null);
    }
  };

  const runLab = async () => {
    setLoading(true);
    setError(null);
    setStage('prediction');
    try {
      const interpreted = interpretPolicyQuestion(prompt, policy);
      setInterpretation(interpreted);
      const nextPolicy = interpreted.recognized ? interpreted.policy : policy;
      if (!interpreted.recognized) {
        setStage('idle');
        setError(interpreted.summary);
        return;
      }
      setPolicy(nextPolicy);

      await policyLabApi.predict();
      setStage('simulation');
      const scenarios = await policyLabApi.scenarios(nextPolicy);
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
    setInterpretation(null);
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
              Ask a land-policy question in plain language. PolicyLab interprets the question, converts it into explicit assumptions, and compares the result with the 2030 baseline.
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
              <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="w-4 h-4 text-emerald-600" /> Ask a policy question</div>
              <p className="mt-1 text-xs text-slate-500">Try natural language: “What happens if I convert half of agricultural land to urbanisation?”</p>
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
              <span className="text-[11px] text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Natural language is translated into measurable simulation parameters.</span>
              <button onClick={applyPrompt} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                Interpret question <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_POLICIES.map((item) => (
              <button key={item.label} onClick={() => { setPrompt(item.text); setPolicy({ agriculture_protection: item.agriculture, water_protection: item.water, forest_protection: item.forest, policy_text: item.text }); setInterpretation({ policy: { agriculture_protection: item.agriculture, water_protection: item.water, forest_protection: item.forest, policy_text: item.text }, recognized: true, summary: `Quick policy selected: ${item.label}.`, details: [], warnings: [] }); }} className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:border-emerald-400 hover:text-emerald-700">
                {item.label}
              </button>
            ))}
          </div>
          {interpretation && (
            <div className={`mt-4 rounded-xl border p-4 ${interpretation.recognized ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 ${interpretation.recognized ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-bold">{interpretation.summary}</div>
                  {interpretation.details.map((detail) => <div key={detail} className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{detail}</div>)}
                  {interpretation.warnings.map((warning) => <div key={warning} className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">{warning}</div>)}
                </div>
              </div>
            </div>
          )}
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
              <p className="text-xs text-slate-500 mt-1">Compare projected land-use area across the baseline and policy scenarios.</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Built-up change vs BAU</div>
              <div className={`text-xl font-bold ${builtUpChange < 0 ? 'text-emerald-700 dark:text-emerald-300' : builtUpChange > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200'}`}>{formatSigned(builtUpChange)} km²</div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-bold">Built-up and agriculture</h3>
              <p className="mt-1 text-[11px] text-slate-500">Projected 2030 area in km².</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={totals} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `${formatNumber(Number(value))} km²`} />
                    <Legend />
                    <Bar dataKey="built" name="Built-up" />
                    <Bar dataKey="agriculture" name="Agriculture" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-bold">Water / wetland</h3>
              <p className="mt-1 text-[11px] text-slate-500">Projected 2030 water/wetland area in km².</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={totals} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `${formatNumber(Number(value))} km²`} />
                    <Legend />
                    <Bar dataKey="water" name="Water / Wetland" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
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

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" /><h3 className="text-sm font-bold">Custom policy change from BAU</h3></div>
            <p className="mt-1 text-[11px] text-slate-500">Positive values mean more projected area under the custom policy; negative values mean less.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['Built-up', builtUpChange],
                ['Agriculture', agricultureChange],
                ['Water / Wetland', waterChange],
              ].map(([label, value]: any) => (
                <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
                  <div className="mt-1 text-lg font-bold">{formatSigned(value)} km²</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full ${value < 0 ? 'bg-emerald-600' : value > 0 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(100, Math.max(3, Math.abs(value) * 10))}%` }} />
                  </div>
                </div>
              ))}
            </div>
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
