import React, { useState } from 'react';
import { Dataset } from '../../types';
import { X, Download, ShieldCheck, Sparkles, Search, Filter } from 'lucide-react';
import { DataQualityBadge } from '../common/DataQualityBadge';
import { useApp } from '../../context/AppContext';

interface PreviewModalProps {
  dataset: Dataset;
  onClose: () => void;
}

export const DatasetPreviewModal: React.FC<PreviewModalProps> = ({ dataset, onClose }) => {
  const { runAIQuery } = useApp();
  const [rowSearch, setRowSearch] = useState('');

  const rows = dataset.sample_rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const filteredRows = rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(rowSearch.toLowerCase()))
  );

  const handleDownloadCSV = () => {
    if (rows.length === 0) return;
    const header = columns.join(',');
    const body = rows.map(r => columns.map(col => `"${r[col] || ''}"`).join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.id}-sample-data.csv`;
    a.click();
  };

  const handleRunAI = () => {
    onClose();
    runAIQuery(`Analyze key insights and statistical patterns in dataset: ${dataset.title}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 uppercase">
              {dataset.id}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {dataset.title}
            </h3>
            <span className="text-xs text-slate-400">{dataset.publisher}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quality Scorecard */}
          <DataQualityBadge
            completeness={dataset.data_quality.completeness}
            freshness={dataset.data_quality.freshness}
            coverageCount={dataset.data_quality.geographic_coverage_count}
            missingPct={dataset.data_quality.missing_values_pct}
            reliabilityTier={dataset.data_quality.reliability_tier}
          />

          {/* Table Search & Export Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter sample rows..."
                value={rowSearch}
                onChange={e => setRowSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAI}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Analyze</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-mono uppercase text-[10px]">
                  {columns.map(col => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {columns.map(col => (
                      <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
          <span>License: <strong>{dataset.license}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-semibold text-xs"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
