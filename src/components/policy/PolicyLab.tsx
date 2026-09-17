import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BarChart3, BrainCircuit, CheckCircle2, Download, FileText,
  Info, Loader2, Map, Play, Printer, RotateCcw, ShieldCheck, Sparkles, Trees, Waves,
  ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { policyLabApi, PolicyLabModelMode, PolicyLabScenarioRequest } from '../../services/policyLabApi';

const DEFAULT_POLICY: PolicyLabScenarioRequest = { agriculture_protection: 80, water_protection: 80, forest_protection: 50 };
const QUICK_POLICIES = [
  { label: 'Protect agriculture', text: 'What if agricultural land conversion is restricted to 20%?', agriculture: 80, water: 0, forest: 0 },
  { label: 'Protect water', text: 'What if 90% of water and wetland areas are protected?', agriculture: 0, water: 90, forest: 0 },
  { label: 'Green growth', text: 'What if agricultural, water and forest conversion are strongly restricted?', agriculture: 80, water: 80, forest: 70 },
];

const LULC_COLORS: Record<number, string> = {
  0: '#f1f5f9', 1: '#64748b', 2: '#eab308', 3: '#16a34a',
  4: '#84cc16', 5: '#a16207', 6: '#0ea5e9', 7: '#cbd5e1',
};
const TRANSITION_COLORS: Record<number, string> = {
  0: '#f8fafc', 1: '#ef4444', 2: '#06b6d4', 3: '#22c55e', 4: '#f59e0b',
};
const LULC_LEGEND = [
  [1, 'Built-up'], [2, 'Agriculture'], [3, 'Forest'], [4, 'Grass'],
  [5, 'Barren/Wasteland'], [6, 'Water/Wetland'], [7, 'Other'],
] as const;
const TRANSITION_LEGEND = [
  [1, 'Agriculture → Built-up'], [2, 'Water/Wetland → Built-up'],
  [3, 'Forest → Built-up'], [4, 'Other land-use change'],
] as const;
const POLICY_LEGEND = [
  [1, 'Agriculture protected'], [2, 'Water/Wetland protected'],
  [3, 'Forest protected'], [4, 'Other policy-driven change'],
] as const;

type RasterLegendItem = readonly [number, string];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}
function formatPixelArea(value: number | undefined) {
  if (!Number.isFinite(value)) return '—';
  return `${(value as number) < 0.01 ? (value as number).toFixed(4) : (value as number).toFixed(2)} km²`;
}
function extractPercent(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : 20;
}
function parsePolicyText(text: string, current: PolicyLabScenarioRequest) {
  const lower = text.toLowerCase();
  const protection = 100 - Math.max(0, Math.min(100, extractPercent(text)));
  const next = { ...current, policy_text: text };
  if (lower.includes('agricultur') || lower.includes('farm') || lower.includes('cropland')) next.agriculture_protection = protection;
  if (lower.includes('water') || lower.includes('wetland') || lower.includes('lake')) next.water_protection = protection;
  if (lower.includes('forest') || lower.includes('green cover') || lower.includes('woodland')) next.forest_protection = protection;
  return next;
}

function InteractiveRasterCanvas({
  map,
  title,
  transition = false,
  legend,
  pixelArea,
}: {
  map: any;
  title: string;
  transition?: boolean;
  legend: readonly RasterLegendItem[];
  pixelArea?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; code: number } | null>(null);
  const palette = transition ? TRANSITION_COLORS : LULC_COLORS;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTooltip(null);
  }, [map]);

  useEffect(() => {
    if (!map || !ref.current) return;
    const canvas = ref.current;
    canvas.width = map.width;
    canvas.height = map.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bytes = Uint8Array.from(atob(map.data), (c) => c.charCodeAt(0));
    const image = ctx.createImageData(map.width, map.height);
    for (let i = 0; i < bytes.length; i++) {
      const hex = palette[bytes[i]] || '#ffffff';
      const rgb = hex.match(/[a-f\d]{2}/gi)?.map((v) => parseInt(v, 16)) || [255, 255, 255];
      image.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    }
    ctx.putImageData(image, 0, 0);
  }, [map, transition, palette]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const zoomBy = (delta: number) => setZoom((value) => Math.max(1, Math.min(4, Number((value + delta).toFixed(1)))));
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 0.25 : -0.25);
  };
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const canvas = ref.current;
    if (!canvas || !map) return;
    if (dragging) setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = Math.max(0, Math.min(map.width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * map.width)));
    const py = Math.max(0, Math.min(map.height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * map.height)));
    const bytes = Uint8Array.from(atob(map.data), (c) => c.charCodeAt(0));
    setTooltip({ x: px, y: py, code: bytes[py * map.width + px] ?? 0 });
  };

  if (!map) return null;
  const label = legend.find(([code]) => code === tooltip?.code)?.[1] || 'No-data / background';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <div>
          <div className="text-xs font-bold">{title}</div>
          <div className="text-[10px] text-slate-500">Scroll to zoom · drag to pan · hover a cell for details</div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => zoomBy(0.25)} className="rounded-md border p-1.5 hover:bg-slate-100" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => zoomBy(-0.25)} className="rounded-md border p-1.5 hover:bg-slate-100" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={resetView} className="rounded-md border p-1.5 hover:bg-slate-100" title="Reset view"><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div
        className="relative h-[390px] overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerUp={(event) => { setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => setDragging(false)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTooltip(null)}
      >
        <canvas
          ref={ref}
          className="absolute left-1/2 top-1/2 max-w-none origin-center"
          style={{
            width: 'min(560px, 88%)',
            height: 'auto',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            imageRendering: 'pixelated',
          }}
        />
        <div className="absolute left-3 top-3 max-w-[235px] rounded-lg border border-white/70 bg-white/92 p-2.5 shadow-sm backdrop-blur-sm">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Map legend</div>
          <div className="space-y-1">
            {legend.map(([code, name]) => (
              <div key={code} className="flex items-center gap-2 text-[10px] font-medium text-slate-700">
                <span className="h-3 w-3 shrink-0 rounded-sm border border-slate-300" style={{ backgroundColor: palette[code] }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
        {tooltip && (
          <div className="pointer-events-none absolute right-3 bottom-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] shadow-sm">
            <div className="font-bold">{label}</div>
            <div className="text-slate-500">Raster cell: {tooltip.x}, {tooltip.y}</div>
            {!transition && pixelArea !== undefined && <div className="text-slate-500">Source pixel area: {formatPixelArea(pixelArea)}</div>}
          </div>
        )}
      </div>
    </div>
  );
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
      const rows = result.area_summary.filter((r: any) => r.scenario === scenario);
      if (!rows.length) return null;
      return {
        scenario,
        built: rows.find((r: any) => r.land_use === 'Built-up')?.area_km2 ?? 0,
        agriculture: rows.find((r: any) => r.land_use === 'Agriculture')?.area_km2 ?? 0,
        forest: rows.find((r: any) => r.land_use === 'Forest')?.area_km2 ?? 0,
        water: rows.find((r: any) => r.land_use === 'Water/Wetland')?.area_km2 ?? 0,
      };
    }).filter(Boolean) as any[];
  }, [result]);

  const bau = totals.find((r) => r.scenario === 'BAU');
  const custom = totals.find((r) => r.scenario === 'Custom Policy');
  const builtUpSaved = bau && custom ? bau.built - custom.built : 0;
  const transitions = result?.transition_summary || [];
  const ai = result?.ai_insights;

  const pixelArea = useMemo(() => {
    const direct = Number(result?.pixel_area_km2 ?? result?.source_2015?.pixel_area_km2 ?? result?.prediction?.pixel_area_km2);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const size = result?.pixel_size_m ?? result?.source_2015?.pixel_size_m;
    if (Array.isArray(size) && size.length >= 2 && Number(size[0]) > 0 && Number(size[1]) > 0) {
      return (Number(size[0]) * Number(size[1])) / 1_000_000;
    }
    return undefined;
  }, [result]);

  const get2015Area = (landUse: string) => {
    const comparisonValue = result?.comparison_2015_2030?.[landUse]?.['2015'];
    const sourceValue = result?.source_2015?.area_km2?.[landUse];
    const value = comparisonValue ?? sourceValue;
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  };
  const get2030Area = (landUse: string) => {
    const comparisonValue = result?.comparison_2015_2030?.[landUse]?.['2030_BAU'];
    if (comparisonValue !== undefined) return Number(comparisonValue);
    if (landUse === 'Built-up') return Number(bau?.built ?? 0);
    if (landUse === 'Agriculture') return Number(bau?.agriculture ?? 0);
    if (landUse === 'Forest') return Number(bau?.forest ?? 0);
    if (landUse === 'Water/Wetland') return Number(bau?.water ?? 0);
    return 0;
  };

  const chart2015vs2030 = useMemo(() => {
    return ['Built-up', 'Agriculture', 'Forest', 'Water/Wetland'].map((landUse) => ({
      landUse,
      '2015': get2015Area(landUse),
      '2030 BAU': get2030Area(landUse),
    }));
  }, [result, totals]);

  const changeChart = useMemo(() => {
    return ['Built-up', 'Agriculture', 'Forest', 'Water/Wetland'].map((landUse) => {
      const change = result?.comparison_2015_2030?.[landUse]?.change;
      return { landUse, change: Number(change ?? (get2030Area(landUse) - get2015Area(landUse))) };
    });
  }, [result, totals]);

  const mapInfo: Record<string, { title: string; transition: boolean; legend: readonly RasterLegendItem[] }> = {
    lulc_2015: { title: '2015 classified LULC', transition: false, legend: LULC_LEGEND },
    prediction_2030: { title: '2030 Random Forest baseline', transition: false, legend: LULC_LEGEND },
    transition_hotspots: { title: '2030 transition hotspots', transition: true, legend: TRANSITION_LEGEND },
    custom_policy: { title: 'Custom policy scenario', transition: false, legend: LULC_LEGEND },
    policy_difference: { title: 'Policy intervention footprint', transition: true, legend: POLICY_LEGEND },
    controlled_growth: { title: 'Controlled urban growth', transition: false, legend: LULC_LEGEND },
    sustainable_development: { title: 'Sustainable development', transition: false, legend: LULC_LEGEND },
  };
  const mapKeys = ['lulc_2015', 'prediction_2030', 'transition_hotspots', 'custom_policy', 'policy_difference'];

  const runLab = async (requestedPolicy: PolicyLabScenarioRequest = policy) => {
    setLoading(true);
    setError(null);
    setStage('prediction');
    try {
      await policyLabApi.predict(modelMode);
      setStage('simulation');
      const scenarios = await policyLabApi.scenarios({ ...requestedPolicy, model_mode: modelMode });
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
  const applyPolicy = (nextPolicy: PolicyLabScenarioRequest) => {
    setPolicy(nextPolicy);
    void runLab(nextPolicy);
  };
  const applyPrompt = () => {
    const nextPolicy = parsePolicyText(prompt, policy);
    applyPolicy(nextPolicy);
  };

  const reportHtml = () => {
    const rows = totals.map((r) => `<tr><td>${r.scenario}</td><td>${formatNumber(r.built)}</td><td>${formatNumber(r.agriculture)}</td><td>${formatNumber(r.water)}</td></tr>`).join('');
    const insightList = (ai?.insights || []).map((x: string) => `<li>${x}</li>`).join('');
    const actionList = (ai?.suggested_actions || []).map((x: string) => `<li>${x}</li>`).join('');
    const transitionRows = transitions.slice(0, 10).map((x: any) => `<tr><td>${x.from}</td><td>${x.to}</td><td>${formatNumber(x.area_km2)}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>BHU-DRISHTI Ghaziabad 2030 Policy Report</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:40px;line-height:1.5}h1{font-size:30px}h2{margin-top:34px;border-bottom:2px solid #10b981;padding-bottom:8px}.hero{background:#0f172a;color:#fff;padding:28px;border-radius:16px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid #ddd;border-radius:12px;padding:16px}.note{background:#fffbeb;border:1px solid #f59e0b;padding:14px;border-radius:10px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}.small{color:#64748b;font-size:12px}</style></head><body><div class="hero"><h1>BHUMI UDYOG / BHU-DRISHTI</h1><p>Ghaziabad 2030 Land Governance Decision Report</p><p>From Land Data to Smarter Decisions</p></div><h2>1. Executive Summary</h2><p><b>Policy question:</b> ${policy.policy_text || prompt}</p><div class="grid"><div class="card"><b>Model</b><br/>Random Forest (${modelMode})</div><div class="card"><b>Built-up change vs BAU</b><br/>${formatNumber(builtUpSaved)} km²</div><div class="card"><b>Pixel area</b><br/>${formatPixelArea(pixelArea)}</div></div><h2>2. 2015 vs 2030 Baseline</h2><table><tr><th>Land use</th><th>2015 km²</th><th>2030 BAU km²</th><th>Change km²</th></tr>${changeChart.map((x: any) => `<tr><td>${x.landUse}</td><td>${formatNumber(get2015Area(x.landUse))}</td><td>${formatNumber(get2030Area(x.landUse))}</td><td>${formatNumber(x.change)}</td></tr>`).join('')}</table><h2>3. Scenario Comparison</h2><table><tr><th>Scenario</th><th>Built-up km²</th><th>Agriculture km²</th><th>Water/Wetland km²</th></tr>${rows}</table><h2>4. Spatial Evidence</h2><p>The application shows five spatial evidence maps with in-map legends, zoom, pan and hover inspection.</p><h2>5. AI-Assisted Evidence Interpretation</h2><ul>${insightList}</ul><h3>Suggested investigation actions</h3><ul>${actionList}</ul><h2>6. Major Transition Pathways</h2><table><tr><th>From</th><th>To</th><th>Area km²</th></tr>${transitionRows}</table><h2>7. Policy Assumptions</h2><p>Agriculture protection: ${policy.agriculture_protection}%. Water/Wetland protection: ${policy.water_protection}%. Forest protection: ${policy.forest_protection}%.</p><div class="note"><b>Interpretation note:</b> Policy simulations are explicit what-if assumptions applied to the Random Forest baseline, not certain future facts. The residual “Other” class requires additional validation before being interpreted as a specific land-use process.</div><h2>8. Evidence & Method</h2><p>Inputs: 2015 LULC, terrain slope and road distance. The model output is a 2030 baseline extrapolation. Spatial differences are intended to support GIS inspection, research and policy discussion.</p><p class="small">Generated by BHU-DRISHTI PolicyLab · Research Edition</p></body></html>`;
  };
  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([reportHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bhu-drishti-ghaziabad-2030-policy-report.html'; a.click(); URL.revokeObjectURL(url);
  };
  const printReport = () => {
    if (!result) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(reportHtml()); w.document.close(); w.focus(); setTimeout(() => w.print(), 500);
  };
  const downloadCsv = () => {
    if (!result?.comparison) return;
    const scenarios = ['BAU', 'Custom Policy', 'Controlled Urban Growth', 'Sustainable Development'];
    const lines = [['Land use', ...scenarios], ...Object.entries(result.comparison).map(([land, values]: any) => [land, ...scenarios.map((s) => values[s] ?? '')])];
    const blob = new Blob([lines.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bhu-drishti-policy-scenario-comparison.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6 pb-10">
    <section className="rounded-3xl bg-slate-950 p-6 md:p-8 text-white shadow-lg"><div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"><div className="max-w-4xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300"><Sparkles className="w-3.5 h-3.5"/> Executive Policy Decision Support</div><h1 className="mt-4 text-3xl md:text-4xl font-bold">PolicyLab: From Data to Decision</h1><p className="mt-3 text-sm md:text-base leading-6 text-slate-300">Ask a land-policy question, run the 2030 evidence model, explore spatial change, compare 2015 and 2030, test interventions and generate a research-ready decision report.</p></div><div className="flex items-center gap-2 text-xs text-slate-300 rounded-xl border border-white/10 bg-white/5 px-4 py-3"><Map className="w-4 h-4 text-emerald-300"/> Ghaziabad · 2030 horizon</div></div></section>

    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="w-4 h-4 text-emerald-600"/> Ask the policy question</div><p className="mt-1 text-xs text-slate-500">Plain language is translated into explicit simulation parameters.</p></div><button onClick={reset} className="p-2 rounded-lg hover:bg-slate-100" title="Reset"><RotateCcw className="w-4 h-4"/></button></div><div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full resize-none bg-transparent outline-none text-sm leading-6"/><div className="mt-3 flex flex-wrap justify-between gap-3"><span className="text-[11px] text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5"/> Policy text becomes measurable assumptions.</span><button onClick={applyPrompt} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ArrowRight className="w-3.5 h-3.5"/>}{loading ? 'Running…' : 'Interpret & run'}</button></div></div><div className="mt-4 flex flex-wrap gap-2">{QUICK_POLICIES.map((item) => <button key={item.label} disabled={loading} onClick={() => { const nextPolicy: PolicyLabScenarioRequest = { agriculture_protection: item.agriculture, water_protection: item.water, forest_protection: item.forest, policy_text: item.text }; setPrompt(item.text); applyPolicy(nextPolicy); }} className="rounded-full border px-3 py-1.5 text-xs font-medium hover:border-emerald-400 disabled:opacity-60">{item.label}</button>)}</div></div>

      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="w-4 h-4 text-emerald-600"/> Policy controls</div><div className="mt-5 space-y-5">{[['Agriculture','agriculture_protection',Activity],['Water / Wetland','water_protection',Waves],['Forest','forest_protection',Trees]].map(([label,key,Icon]: any) => <label key={key} className="block"><div className="flex justify-between text-xs font-semibold mb-2"><span className="flex gap-2 items-center"><Icon className="w-4 h-4 text-emerald-600"/>{label}</span><span>{policy[key]}%</span></div><input type="range" min="0" max="100" step="5" value={policy[key]} onChange={(e) => setPolicy({ ...policy, [key]: Number(e.target.value) })} className="w-full accent-emerald-600"/></label>)}</div><div className="mt-5"><div className="text-xs font-semibold mb-2">Inference model</div><div className="grid grid-cols-2 gap-2"><button onClick={() => setModelMode('optimized')} className={`rounded-lg border p-3 text-left text-xs ${modelMode === 'optimized' ? 'border-emerald-500 bg-emerald-50' : ''}`}><b>Optimized</b><br/><span className="text-slate-500">Fast / ~55 MB</span></button><button onClick={() => setModelMode('full')} className={`rounded-lg border p-3 text-left text-xs ${modelMode === 'full' ? 'border-emerald-500 bg-emerald-50' : ''}`}><b>Full research</b><br/><span className="text-slate-500">Original ~1.5 GB RF</span></button></div></div><button onClick={() => runLab()} disabled={loading} className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}{loading ? 'Running evidence model…' : 'Run full policy analysis'}</button></div></section>

    <section className="grid gap-4 md:grid-cols-4">{[['Prediction engine',`Random Forest · ${modelMode}`,BrainCircuit],['Evidence inputs','LULC + slope + roads',Activity],['Decision horizon','2030 baseline',Map],['Deliverable','Maps + charts + AI + report',FileText]].map(([title,value,Icon]: any) => <div key={title} className="rounded-2xl border bg-white dark:bg-slate-900 p-4"><Icon className="w-5 h-5 text-emerald-600"/><div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">{title}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>)}</section>

    {stage !== 'idle' && <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4"><div className="flex flex-wrap gap-5 text-xs font-semibold"><span className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Prediction {stage === 'prediction' ? 'running' : 'complete'}</span><span className={`flex items-center gap-2 ${stage === 'simulation' || stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4"/> Scenario simulation</span><span className={`flex items-center gap-2 ${stage === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4"/> Decision report</span></div></div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    {result && <>
      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><div className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Executive summary</div><h2 className="mt-1 text-2xl font-bold">2030 Land Governance Evidence Brief</h2><p className="mt-2 text-sm text-slate-500">{policy.policy_text || prompt}</p></div><div className="flex flex-wrap gap-2"><button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white"><Download className="w-4 h-4"/> Download report</button><button onClick={printReport} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold"><Printer className="w-4 h-4"/> Print / Save PDF</button><button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold"><Download className="w-4 h-4"/> CSV evidence</button></div></div><div className="grid gap-3 md:grid-cols-4 mt-6"><div className="rounded-xl bg-slate-950 text-white p-4"><div className="text-[10px] uppercase text-slate-400">Model</div><div className="mt-1 font-bold">{result.model_mode} RF</div></div><div className="rounded-xl bg-emerald-50 p-4"><div className="text-[10px] uppercase text-emerald-700">Built-up change vs BAU</div><div className="mt-1 text-xl font-bold text-emerald-700">{formatNumber(builtUpSaved)} km²</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] uppercase text-slate-500">Pixel area</div><div className="mt-1 font-bold">{formatPixelArea(pixelArea)}</div><div className="mt-1 text-[10px] text-slate-500">Actual raster-cell area</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] uppercase text-slate-500">Policy protection</div><div className="mt-1 font-bold">A {policy.agriculture_protection}% · W {policy.water_protection}% · F {policy.forest_protection}%</div></div></div></section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">2015 → 2030 land-use change</h2></div><p className="mt-1 text-xs text-slate-500">Direct comparison of the observed 2015 classified raster and the 2030 Random Forest BAU baseline. Areas are km².</p><div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart2015vs2030} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="landUse" tick={{ fontSize: 11 }}/><YAxis tick={{ fontSize: 11 }}/><Tooltip/><Legend/><Bar dataKey="2015" fill="#94a3b8" name="2015" radius={[4,4,0,0]}/><Bar dataKey="2030 BAU" fill="#10b981" name="2030 BAU" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><Map className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">Interactive spatial evidence — 5 maps</h2></div><p className="mt-1 text-xs text-slate-500">2015 is the fixed observed baseline. The 2030 baseline stays fixed; Custom Policy and Policy Difference update whenever you run a new policy question. Each map has its own legend, zoom, pan and hover inspection.</p><div className="mt-5 grid gap-5 xl:grid-cols-2">{mapKeys.map((key) => { const info = mapInfo[key]; return <InteractiveRasterCanvas key={key} map={result?.visuals?.maps?.[key]} title={info.title} transition={info.transition} legend={info.legend} pixelArea={pixelArea}/>; })}</div></section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">Scenario impact dashboard</h2></div><p className="mt-1 text-xs text-slate-500">Spatial simulation results in km². Values are scenario outputs, not certainty claims.</p><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Scenario</th><th>Built-up km²</th><th>Agriculture km²</th><th>Forest km²</th><th>Water/Wetland km²</th></tr></thead><tbody>{totals.map((r) => <tr key={r.scenario} className="border-b last:border-0"><td className="py-3 font-semibold">{r.scenario}</td><td>{formatNumber(r.built)}</td><td>{formatNumber(r.agriculture)}</td><td>{formatNumber(r.forest)}</td><td>{formatNumber(r.water)}</td></tr>)}</tbody></table></div></section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-emerald-600"/><h2 className="text-lg font-bold">AI-assisted evidence interpretation</h2></div><p className="mt-1 text-xs text-slate-500">Generated from the simulation outputs and framed for research and planning review.</p><ul className="mt-5 space-y-3">{(ai?.insights || []).map((x: string, i: number) => <li key={i} className="flex gap-3 text-sm leading-6"><span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 shrink-0"/>{x}</li>)}</ul><div className="mt-6 rounded-xl bg-emerald-50 p-4"><div className="font-bold text-sm text-emerald-900">Suggested investigation actions</div><ol className="mt-3 space-y-2 text-xs leading-5 text-emerald-900">{(ai?.suggested_actions || []).map((x: string, i: number) => <li key={i}>{i + 1}. {x}</li>)}</ol></div></div><div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm"><div className="font-bold text-sm">Top transition pathways</div><div className="mt-4 space-y-3">{transitions.slice(0, 7).map((x: any) => <div key={`${x.from}-${x.to}`} className="flex justify-between gap-3 text-xs"><span>{x.from} → {x.to}</span><b>{formatNumber(x.area_km2)} km²</b></div>)}</div></div></section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Info className="w-5 h-5 text-amber-600 shrink-0"/><div><h3 className="font-bold text-sm text-amber-900">Evidence and limitation note</h3><p className="mt-1 text-xs leading-5 text-amber-800">{result.note} {ai?.disclaimer} The “Other” class is a residual heuristic class, so Other → Built-up should not automatically be described as confirmed urban encroachment.</p></div></div></section>
    </>}
  </div>;
};
