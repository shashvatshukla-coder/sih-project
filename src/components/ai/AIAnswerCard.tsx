import React, { useState } from 'react';
import { AIQueryResponse } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Download,
  Bookmark,
  Check,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  GitCompare,
  FileText,
  Bot
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { WhySeeingThisModal } from '../common/WhySeeingThisModal';

interface AnswerCardProps {
  response: AIQueryResponse;
}

export const AIAnswerCard: React.FC<AnswerCardProps> = ({ response }) => {
  const { saveItem, isSaved, setActivePage, setSelectedState, setSelectedDistrict } = useApp();
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  const {
    query,
    intent,
    metrics,
    chartData,
    summary,
    potentialDrivers,
    notableDistrictsOrStates,
    anomaliesDetected,
    sources,
    confidence,
    aiModel,
    calculationBreakdown
  } = response;

  const saved = isSaved(`AI-QRY-${query}`);

  const handleSave = () => {
    saveItem({
      id: `AI-QRY-${query}`,
      type: 'analysis',
      title: `AI Analysis: ${intent.geographyName || 'Regional'} ${intent.indicator || 'Trend'}`,
      subtitle: query,
      data: response
    });
  };

  const handleDownloadCSV = () => {
    const headers = 'Year,Value,Agricultural,Forest,Builtup,Water,Barren\n';
    const rows = chartData
      .map(r => `${r.year},${r.value || ''},${r.agricultural || ''},${r.forest || ''},${r.builtup || ''},${r.water || ''},${r.barren || ''}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LandIntel-Analysis-${intent.geographyName}-${Date.now()}.csv`;
    a.click();
  };

  const handleCompare = () => {
    if (intent.stateCode) {
      setSelectedState(intent.stateCode);
    }
    if (intent.districtCode) {
      setSelectedDistrict(intent.districtCode);
    }
    setActivePage('comparison');
  };

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-left space-y-6">
      {/* Top Header & Structured Intent Badges */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex-wrap">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Analytical Query Result</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {aiModel || 'Google Gemini 1.5 Flash (Grounded)'}
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {intent.geographyName} — {intent.indicator?.toUpperCase()} Trend ({metrics.startYear}–{metrics.endYear})
          </h3>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query prompt: <span className="italic text-slate-700 dark:text-slate-300">&quot;{query}&quot;</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWhyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-purple-500" />
            <span>Why am I seeing this?</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              saved
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Baseline ({metrics.startYear})</span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
            {metrics.startValue}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Latest Value ({metrics.endYear})</span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
            {metrics.endValue}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Absolute Net Shift</span>
          <div className={`text-xl font-bold font-mono mt-0.5 flex items-center gap-1 ${
            (metrics.absoluteChange || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {(metrics.absoluteChange || 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {metrics.absoluteChange && metrics.absoluteChange > 0 ? `+${metrics.absoluteChange}` : metrics.absoluteChange} pp
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Decadal Relative Shift</span>
          <div className={`text-xl font-bold font-mono mt-0.5 ${
            (metrics.percentageChange || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {metrics.percentageChange && metrics.percentageChange > 0 ? `+${metrics.percentageChange}%` : `${metrics.percentageChange}%`}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {intent.geographyName}: Historical Series Trend ({metrics.startYear} → {metrics.endYear})
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            CAGR: {metrics.cagr}% p.a.
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="%" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700">
                        <div className="font-bold text-brand-300">Year {label}</div>
                        <div className="font-mono mt-1 font-semibold">{payload[0].value}% Area Share</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1F4D7E"
                strokeWidth={3}
                dot={{ r: 5, fill: '#1F4D7E', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary Text */}
      <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 text-slate-800 dark:text-slate-200 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-brand-900 dark:text-brand-300 text-xs">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Grounded Gemini Analytical Synthesis</span>
        </div>
        <p className="leading-relaxed text-xs md:text-[13px] whitespace-pre-line">
          {summary}
        </p>
      </div>

      {/* Potential Drivers & Notable Districts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drivers */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Potential Underlying Drivers to Investigate
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {potentialDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Notable Districts */}
        {notableDistrictsOrStates && notableDistrictsOrStates.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Significant District Level Variation
            </div>
            <div className="space-y-1.5">
              {notableDistrictsOrStates.map((dist, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{dist.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span>{dist.value}%</span>
                    <span className={`text-[10px] font-bold ${dist.changePct > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {dist.changePct > 0 ? `+${dist.changePct}%` : `${dist.changePct}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flagged Anomalies Alert */}
      {anomaliesDetected && anomaliesDetected.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Associated Anomalies Flagged in Region</span>
          </div>
          <div className="text-[11px] space-y-0.5 pl-5 list-disc">
            {anomaliesDetected.map((anom, idx) => (
              <div key={idx}>• {anom}</div>
            ))}
          </div>
        </div>
      )}

      {/* Sources & Methodology Provenance */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Confidence Score: <strong className="text-slate-800 dark:text-slate-200">{confidence}%</strong></span>
          <span>•</span>
          <span>Sources: {sources.map(s => s.name).join(', ')}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCompare}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare with another District/State →
          </button>
        </div>
      </div>

      {/* Why Am I Seeing This Modal */}
      <WhySeeingThisModal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        title="Land Intelligence Calculation Details"
        formula={calculationBreakdown.formula}
        rawValues={calculationBreakdown.rawValues}
        stepExplanation={calculationBreakdown.stepExplanation}
      />
    </div>
  );
};
