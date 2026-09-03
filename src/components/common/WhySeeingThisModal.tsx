import React from 'react';
import { Calculator, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  formula: string;
  rawValues: string;
  stepExplanation: string;
}

export const WhySeeingThisModal: React.FC<WhyModalProps> = ({
  isOpen,
  onClose,
  title = 'Algorithmic Calculation Breakdown',
  formula,
  rawValues,
  stepExplanation
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-left space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200">
            <div className="font-semibold text-[11px] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Mathematical Formula
            </div>
            <code className="font-mono text-xs text-purple-900 dark:text-purple-100 bg-white/70 dark:bg-slate-900/60 p-1.5 rounded block border border-purple-200 dark:border-purple-800">
              {formula}
            </code>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
              Raw Input Parameters
            </div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {rawValues}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
              Step-by-Step Logic
            </div>
            <p className="leading-relaxed text-xs">
              {stepExplanation}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Programmatic Code Execution (Zero LLM hallucinations)
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
