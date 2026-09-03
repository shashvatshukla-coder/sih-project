import React, { useState, useEffect } from 'react';
import { Policy } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { FileCheck2, ExternalLink, Sparkles, BookOpen, Layers } from 'lucide-react';

export const PolicyRepository: React.FC = () => {
  const { setActivePage } = useApp();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        const data = await api.getPolicies();
        setPolicies(data || []);
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>National Land Policy & Scheme Repository</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Central & State Land Governance Programs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Official mission guidelines, statutory targets, and longitudinal impact indicators across India&apos;s irrigation, cadastral modernization, and afforestation missions.
          </p>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="space-y-4">
        {policies.map(policy => (
          <div
            key={policy.id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4 text-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {policy.acronym}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {policy.ministry} • Launched {policy.launch_year}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {policy.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('policy')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Impact</span>
                </button>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {policy.description}
            </p>

            {/* Objectives */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Key Mission Objectives
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {policy.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Target Scope: <strong>{policy.target_region}</strong></span>
              <a
                href={policy.documents_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                <span>Official Guidelines</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
