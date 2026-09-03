import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Database, Calendar, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SourceBadgeProps {
  source: string;
  year?: string;
  datasetId?: string;
  sourceUrl?: string;
  isOfficial?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  year = '2025',
  datasetId = 'DS-DES-LUS',
  sourceUrl = 'https://desagri.gov.in',
  isOfficial = true
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { setActivePage } = useApp();

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
        title="View Official Source & Metadata Provenance"
      >
        <span className="truncate max-w-[100px] sm:max-w-[130px]">{source}</span>
        <span className="text-slate-400">↗</span>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-left space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Data Provenance & Citation Metadata
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Primary Source Provider
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {source}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Series Year</span>
                  <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">{year}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Dataset Identifier</span>
                  <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">{datasetId}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200">
                <div className="font-semibold text-[11px] mb-0.5">Methodology & Authenticity Note</div>
                <div className="text-[11px] leading-relaxed">
                  Synthesized normalized series structured per Directorate of Economics and Statistics (MoA&FW) 9-fold land classification standard. Every record preserves geographic identifiers and decadal boundaries.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setActivePage('datasets');
                }}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5" />
                Open in Dataset Explorer
              </button>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
