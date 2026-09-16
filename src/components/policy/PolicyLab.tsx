import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BarChart3, BrainCircuit, CheckCircle2, Download, FileText,
  Info, Loader2, Map, Play, Printer, RotateCcw, ShieldCheck, Sparkles, Trees, Waves,
} from 'lucide-react';
import { policyLabApi, PolicyLabModelMode, PolicyLabScenarioRequest } from '../../services/policyLabApi';

const DEFAULT_POLICY: PolicyLabScenarioRequest = { agriculture_protection: 80, water_protection: 80, forest_protection: 50 };
const QUICK_POLICIES = [
  { label: 'Protect agriculture', text: 'What if agricultural land conversion is restricted to 20%?', agriculture: 80, water: 0, forest: 0 },
  { label: 'Protect water', text: 'What if 90% of water and wetland areas are protected?', agriculture: 0, water: 90, forest: 0 },
  { label: 'Green growth', text: 'What if agricultural, water and forest conversion are strongly restricted?', agriculture: 80, water: 80, forest: 70 },
];
const LULC_COLORS: Record<number, string> = { 0: '#f1f5f9', 1: '#64748b', 2: '#eab308', 3: '#16a34a', 4: '#84cc16', 5: '#a16207', 6: '#0ea5e9', 7: '#cbd5e1' };
const TRANSITION_COLORS: Record<number, string> = { 0: '#f8fafc', 1: '#ef4444', 2: '#06b6d4', 3: '#22c55e', 4: '#f59e0b' };

function formatNumber(value: number) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value); }
function extractPercent(text: string) { const match = text.match(/(\d+(?:\.\d+)?)\s*%/); return match ? Number(match[1]) : 20; }
function parsePolicyText(text: string, current: PolicyLabScenarioRequest) {
  const lower = text.toLowerCase();
  const protection = 100 - Math.max(0, Math.min(100, extractPercent(text)));
  const next = { ...current, policy_text: text };
  if (lower.includes('agricultur') || lower.includes('farm') || lower.includes('cropland')) next.agriculture_protection = protection;
  if (lower.includes('water') || lower.includes('wetland') || lower.includes('lake')) next.water_protection = protection;
  if (lower.includes('forest') || lower.includes('green cover') || lower.includes('woodland')) next.forest_protection = protection;
  return next;
}

function RasterCanvas({ map, title, transition = false }: { map: any; title: string; transition?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!map || !ref.current) return;
    const canvas = ref.current; canvas.width = map.width; canvas.height = map.height;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const bytes = Uint8Array.from(atob(map.data), (c) => c.charCodeAt(0));
    const image = ctx.createImageData(map.width, map.height); const palette = transition ? TRANSITION_COLORS : LULC_COLORS;
    for (let i = 0; i < bytes.length; i++) {
      const rgb = (palette[bytes[i]] || '#fff').match(/[a-f\d]{2}/gi)?.map((v) => parseInt(v, 16)) || [255, 255, 255];
      image.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    }
    ctx.putImageData(image, 0, 0);
  }, [map, transition]);
  return <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50"><div className="px-3 py-2 text-xs font-bold border-b border-slate-200 dark:border-slate-700">{title}</div><canvas ref={ref} className="block w-full aspect-[1.38]" /></div>;
}

function makeMapDataUrl(map: any, transition = false) {
  if (!map) return '';
  const canvas = document.createElement('canvas'); canvas.width = map.width; canvas.height = map.height;
  const ctx = canvas.getContext('2d'); if (!ctx) return '';
  const bytes = Uint8Array.from(atob(map.data), (c) => c.charCodeAt(0)); const image = ctx.createImageData(map.width, map.height); const palette = transition ? TRANSITION_COLORS : LULC_COLORS;
  for (let i = 0; i < bytes.length; i++) {
    const rgb = (palette[bytes[i]] || '#fff').match(/[a-f\d]{2}/gi)?.map((v) => parseInt(v, 16)) || [255, 255, 255];
    image.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
  }
  ctx.putImageData(image, 0, 0); return canvas.toDataURL('image/png');
}

export const PolicyLab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'prediction' | 'simulation' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [prompt, setPrompt] = useState('What if agricultural land conversion is restricted to 20%?');
  const [policy, setPolicy] = useState<PolicyLabScenarioRequest>(DEFAULT_POLICY);
  const [modelMode, setModelMode] = useState<PolicyLabModelMode>('optimized');

  const totals = useMemo(() => {
    if (!result?.area_summary) return [];
    return ['BAU', 'Custom Policy', 'Controlled Urban Growth', 'Sustainable Development'].map((scenario) => {
      const rows = result.area_summary.filter((r: any) => r.scenario === scenario); if (!rows.length) return null;
      return { scenario, built: rows.find((r: any) => r.land_use === 'Built-up')?.area_km2 ?? 0, agriculture: rows.find((r: any) => r.land_use === 'Agriculture')?.area_km2 ?? 0, water: rows.find((r: any) => r.land_use === 'Water/Wetland')?.area_km2 ?? 0 };
    }).filter(Boolean) as any[];
  }, [result]);
  const bau = totals.find((r) => r.scenario === 'BAU'); const custom = totals.find((r) => r.scenario === 'Custom Policy');
  const builtUpSaved = bau && custom ? bau.built - custom.built : 0;
  const transitions = result?.transition_summary || []; const ai = result?.ai_insights;

  const runLab = async () => {
    setLoading(true); setError(null); setStage('prediction');
    try { await policyLabApi.predict(modelMode); setStage('simulation'); const scenarios = await policyLabApi.scenarios({ ...policy, model_mode: modelMode }); setResult(scenarios.data || null); setStage('done'); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); setStage('idle'); }
    finally { setLoading(false); }
  };
  const reset = () => { setPolicy(DEFAULT_POLICY); setPrompt('What if agricultural land conversion is restricted to 20%?'); setResult(null); setError(null); setStage('idle'); };
  const applyPrompt = () => setPolicy(parsePolicyText(prompt, policy));

  const reportHtml = () => {
    const maps = result?.visuals?.maps || {};
    const map = (key: string, title: string, transition = false) => maps[key] ? `<div class="map"><h3>${title}</h3><img src="${makeMapDataUrl(maps[key], transition)}"/></div>` : '';
    const rows = totals.map((r) => `<tr><td>${r.scenario}</td><td>${formatNumber(r.built)}</td><td>${formatNumber(r.agriculture)}</td><td>${formatNumber(r.water)}</td></tr>`).join('');
    const insightList = (ai?.insights || []).map((x: string) => `<li>${x}</li>`).join('');
    const actionList = (ai?.suggested_actions || []).map((x: string) => `<li>${x}</li>`).join('');
    const transitionRows = transitions.slice(0, 10).map((x: any) => `<tr><td>${x.from}</td><td>${x.to}</td><td>${formatNumber(x.area_km2)}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>BHU-DRISHTI Ghaziabad 2030 Policy Report</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:40px;line-height:1.5}h1{font-size:30px}h2{margin-top:34px;border-bottom:2px solid #10b981;padding-bottom:8px}.hero{background:#0f172a;color:#fff;padding:28px;border-radius:16px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid #ddd;border-radius:12px;padding:16px}.map{page-break-inside:avoid;margin:20px 0}.map img{width:100%;max-width:900px;border:1px solid #ddd}.note{background:#fffbeb;border:1px solid #f59e0b;padding:14px;border-radius:10px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}.small{color:#64748b;font-size:12px}@media print{body{margin:20px}.map{break-inside:avoid}}</style></head><body><div class="hero"><h1>BHUMI UDYOG / BHU-DRISHTI</h1><p>Ghaziabad 2030 Land Governance Decision Report</p><p>From Land Data to Smarter Decisions</p></div><h2>1. Executive Summary</h2><p><b>Policy question:</b> ${policy.policy_text || prompt}</p><div class="grid"><div class="card"><b>Model</b><br/>Random Forest (${modelMode})</div><div class="card"><b>Built-up change vs BAU</b><br/>${formatNumber(builtUpSaved)} km²</div><div class="card"><b>Decision horizon</b><br/>2030</div></div><h2>2. Scenario Comparison</h2><table><tr><th>Scenario</th><th>Built-up km²</th><th>Agriculture km²</th><th>Water/Wetland km²</th></tr>${rows}</table><h2>3. Spatial Evidence</h2>${map('lulc_2015','2015 classified LULC')}${map('prediction_2030','2030 Random Forest baseline')}${map('transition_hotspots','2030 transition hotspots',true)}${map('custom_policy','Custom policy scenario')}${map('controlled_growth','Controlled urban growth')}${map('sustainable_development','Sustainable development')}${map('policy_difference','Policy intervention footprint',true)}<h2>4. AI-Assisted Evidence Interpretation</h2><ul>${insightList}</ul><h3>Suggested investigation actions</h3><ul>${actionList}</ul><h2>5. Major Transition Pathways</h2><table><tr><th>From</th><th>To</th><th>Area km²</th></tr>${transitionRows}</table><h2>6. Policy Assumptions</h2><p>Agriculture protection: ${policy.agriculture_protection}%. Water/Wetland protection: ${policy.water_protection}%. Forest protection: ${policy.forest_protection}%.</p><div class="note"><b>Interpretation note:</b> Policy simulations are explicit what-if assumptions applied to the Random Forest baseline, not certain future facts. The residual “Other” class requires additional validation before being interpreted as a specific land-use process.</div><h2>7. Evidence & Method</h2><p>Inputs: 2015 LULC, terrain slope and road distance. The model output is a 2030 baseline extrapolation. Spatial differences are intended to support GIS inspection, research and policy discussion.</p><p class="small">Generated by BHU-DRISHTI PolicyLab · Research Edition</p></body></html>`;
  };
  const downloadReport = () => { if (!result) return; const blob = new Blob([reportHtml()], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bhu-drishti-ghaziabad-2030-policy-report.html'; a.click(); URL.revokeObjectURL(url); };
  const printReport = () => { if (!result) return; const w = window.open('', '_blank'); if (!w) return; w.document.write(reportHtml()); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); };
  const downloadCsv = () => { if (!result?.comparison) return; const scenarios = ['BAU', 'Custom Policy', 'Controlled Urban Growth', 'Sustainable Development']; const lines = [['Land use', ...scenarios], ...Object.entries(result.comparison).map(([land, values]: any) => [land, ...scenarios.map((s) => values[s] ?? '')])]; const blob = new Blob([lines.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bhu-drishti-policy-scenario-comparison.csv'; a.click(); URL.revokeObjectURL(url); };

  return <div className="space-y-6 pb-10">
    <section className="rounded-3xl bg-slate-950 p-6 md:p-8 text-white shadow-lg"><div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"><div className="max-w-4xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300"><Sparkles className="w-3.5 h-3.5"/> Executive Policy Decision Support</div><h1 className="mt-4 text-3xl md:text-4xl font-bold">PolicyLab: From Data to Decision</h1><p className="mt-3 text-sm md:text-base leading-6 text-slate-300">Ask a land-policy question, run the 2030 evidence model, see spatial change, test interventions and generate a research-ready decision report.</p></div><div className="flex items-center gap-2 text-xs text-slate-300 rounded-xl border border-white/10 bg-white/5 px-4 py-3"><Map className="w-4 h-4 text-emerald-300"/> Ghaziabad · 2030 horizon</div></div></section>

    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="w-4 h-4 text-emerald-600"/> Ask the policy question</div><p className="mt-1 text-xs text-slate-500">Plain language is translated into explicit simulation parameters.</p></div><button onClick={reset} className="p-2 rounded-lg hover:bg-slate-100" title="Reset"><RotateCcw className="w-4 h-4"/></button></div><div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full resize-none bg-transparent outline-none text-sm leading-6"/><div className="mt-3 flex flex-wrap justify-between gap-3"><span className="text-[11px] text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5"/> Policy text becomes measurable assumptions.</span><button onClick={applyPrompt} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Interpret policy <ArrowRight className="w-3.5 h-3.5"/></button></div></div><div className="mt-4 flex flex-wrap gap-2">{QUICK_POLICIES.map((item) => <button key={item.label} onClick={() => { setPrompt(item.text); setPolicy({ agriculture_protection: item.agriculture, water_protection: item.water, forest_protection: item.forest, policy_text: item.text }); }} className="rounded-full border px-3 py-1.5 text-xs font-medium hover:border-emerald-400">{item.label}</button>)}</div></div>

      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="w-4 h-4 text-emerald-600"/> Policy controls</div><div className="mt-5 space-y-5">{[['Agriculture','agriculture_protection',Activity],['Water / Wetland','water_protection',Waves],['Forest','forest_protection',Trees]].map(([label,key,Icon]: any) => <label key={key} className="block"><div className="flex justify-between text-xs font-semibold mb-2"><span className="flex gap-2 items-center"><Icon className="w-4 h-4 text-emerald-600"/>{label}</span><span>{policy[key]}%</span></div><input type="range" min="0" max="100" step="5" value={policy[key]} onChange={(e) => setPolicy({ ...policy, [key]: Number(e.target.value) })} className="w-full accent-emerald-600"/></label>)}</div><div className="mt-5"><div className="text-xs font-semibold mb-2">Inference model</div><div className="grid grid-cols-2 gap-2"><button onClick={() => setModelMode('optimized')} className={`rounded-lg border p-3 text-left text-xs ${modelMode === 'optimized' ? 'border-emerald-500 bg-emerald-50' : ''}`}><b>Optimized</b><br/><span className="text-slate-500">Fast / ~55 MB</span></button><button onClick={() => setModelMode('full')} className={`rounded-lg border p-3 text-left text-xs ${modelMode === 'full' ? 'border-emerald-500 bg-emerald-50' : ''}`}><b>Full research</b><br/><span className="text-slate-500">Original ~1.5 GB RF</span></button></div></div><button onClick={runLab} disabled={loading} className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}{loading ? 'Running evidence model…' : 'Run full policy analysis'}</button></div></section>

    <section className="grid gap-4 md:grid-cols-4">{[['Prediction engine',`Random Forest · ${modelMode}`,BrainCircuit],['Evidence inputs','LULC + slope + roads',Activity],['Decision horizon','2030 baseline',Map],['Deliverable','Maps + AI + report',FileText]].map(([title,value,Icon]: any) => <div key={title} className="rounded-2xl border bg-white dark:bg-slate-900 p-4"><Icon className="w-5 h-5 text-emerald-600"/><div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">{title}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>)}</section>

    {stage !== 'idle' && <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4"><div className="flex flex-wrap gap-5 text-xs font-semibold"><span className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Prediction {stage === 'prediction' ? 'running' : 'complete'}</span><span className={`flex items-center gap-2 ${stage === 'simulation' || stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4"/> Scenario simulation</span><span className={`flex items-center gap-2 ${stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4"/> Decision report</span></div></div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    {result && <>
      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><div className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Executive summary</div><h2 className="mt-1 text-2xl font-bold">2030 Land Governance Evidence Brief</h2><p className="mt-2 text-sm text-slate-500">{policy.policy_text || prompt}</p></div><div className="flex flex-wrap gap-2"><button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white"><Download className="w-4 h-4"/> Download report</button><button onClick={printReport} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold"><Printer className="w-4 h-4"/> Print / Save PDF</button><button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold"><Download className="w-4 h-4"/> CSV evidence</button></div></div><div className="grid gap-3 md:grid-cols-4 mt-6"><div className="rounded-xl bg-slate-950 text-white p-4"><div className="text-[10px] uppercase text-slate-400">Model</div><div className="mt-1 font-bold">{result.model_mode} RF</div></div><div className="rounded-xl bg-emerald-50 p-4"><div className="text-[10px] uppercase text-emerald-700">Built-up change vs BAU</div><div className="mt-1 text-xl font-bold text-emerald-700">{formatNumber(builtUpSaved)} km²</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] uppercase text-slate-500">Pixel area</div><div className="mt-1 font-bold">{formatNumber(result?.prediction?.pixel_area_km2 || result?.pixel_area_km2 || 0)} km²</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] uppercase text-slate-500">Policy protection</div><div className="mt-1 font-bold">A {policy.agriculture_protection}% · W {policy.water_protection}% · F {policy.forest_protection}%</div></div></div></section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">Scenario impact dashboard</h2></div><p className="mt-1 text-xs text-slate-500">Spatial simulation results in km². Values are scenario outputs, not certainty claims.</p><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Scenario</th><th>Built-up km²</th><th>Agriculture km²</th><th>Water/Wetland km²</th></tr></thead><tbody>{totals.map((r) => <tr key={r.scenario} className="border-b last:border-0"><td className="py-3 font-semibold">{r.scenario}</td><td>{formatNumber(r.built)}</td><td>{formatNumber(r.agriculture)}</td><td>{formatNumber(r.water)}</td></tr>)}</tbody></table></div><div className="mt-5 space-y-3">{totals.map((r) => <div key={r.scenario}><div className="flex justify-between text-xs mb-1"><span className="font-semibold">{r.scenario}</span><span>{formatNumber(r.built)} km² built-up</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(3, r.built / Math.max(...totals.map((x) => x.built), 1) * 100)}%` }}/></div></div>)}</div></section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><Map className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">Spatial evidence maps</h2></div><p className="mt-1 text-xs text-slate-500">Compact map previews are generated from the same raster outputs used by the simulation.</p><div className="grid gap-4 md:grid-cols-2 mt-5"><RasterCanvas map={result.visuals?.maps?.lulc_2015} title="2015 classified LULC"/><RasterCanvas map={result.visuals?.maps?.prediction_2030} title="2030 Random Forest baseline"/><RasterCanvas map={result.visuals?.maps?.transition_hotspots} title="Transition hotspots" transition/><RasterCanvas map={result.visuals?.maps?.custom_policy} title="Custom policy scenario"/><RasterCanvas map={result.visuals?.maps?.controlled_growth} title="Controlled urban growth"/><RasterCanvas map={result.visuals?.maps?.sustainable_development} title="Sustainable development"/><RasterCanvas map={result.visuals?.maps?.policy_difference} title="Policy intervention footprint" transition/></div><div className="mt-5 flex flex-wrap gap-3 text-[11px] text-slate-500"><span>🟨 Agriculture</span><span>🟩 Forest/Grass</span><span>🟦 Water/Wetland</span><span>⬛ Built-up</span><span>🟥 Agriculture→Built-up hotspot</span><span>🟧 Other change</span></div></section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">AI-assisted evidence interpretation</h2></div><p className="mt-1 text-xs text-slate-500">Generated from the simulation outputs and framed for research and planning review.</p><ul className="mt-5 space-y-3">{(ai?.insights || []).map((x: string, i: number) => <li key={i} className="flex gap-3 text-sm leading-6"><span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 shrink-0"/>{x}</li>)}</ul><div className="mt-6 rounded-xl bg-emerald-50 p-4"><div className="font-bold text-sm text-emerald-900">Suggested investigation actions</div><ol className="mt-3 space-y-2 text-xs leading-5 text-emerald-900">{(ai?.suggested_actions || []).map((x: string, i: number) => <li key={i}>{i + 1}. {x}</li>)}</ol></div></div><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="font-bold text-sm">Top transition pathways</div><div className="mt-4 space-y-3">{transitions.slice(0, 7).map((x: any) => <div key={`${x.from}-${x.to}`} className="flex justify-between gap-3 text-xs"><span>{x.from} → {x.to}</span><b>{formatNumber(x.area_km2)} km²</b></div>)}</div></div></section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Info className="w-5 h-5 text-amber-600 shrink-0"/><div><h3 className="font-bold text-sm text-amber-900">Evidence and limitation note</h3><p className="mt-1 text-xs leading-5 text-amber-800">{result.note} {ai?.disclaimer} The “Other” class is a residual heuristic class, so Other → Built-up should not automatically be described as confirmed urban encroachment.</p></div></div></section>
    </>}
  </div>;
};
