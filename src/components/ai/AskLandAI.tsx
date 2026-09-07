import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Search, ArrowRight, HelpCircle, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { AIAnswerCard } from './AIAnswerCard';

export const AskLandAI: React.FC = () => {
  const {
    activeAIQuery,
    setActiveAIQuery,
    aiResponse,
    runAIQuery,
    aiLoading
  } = useApp();

  const [inputQuery, setInputQuery] = useState(activeAIQuery || '');

  const suggestedQueries = [
    'Show land statistics of Gauriganj, Amethi (UP)',
    'UP mein agricultural land-use ka trend kya hai?',
    'Which districts have experienced the highest urban expansion?',
    'Compare forest cover in MP and Maharashtra',
    'Which states experienced the largest agricultural land decline?',
    'Show land-use changes in Gorakhpur since 2010',
    'Has irrigation expansion affected agricultural productivity under PMKSY?'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      runAIQuery(inputQuery.trim());
    }
  };

  const handleSuggestionClick = (q: string) => {
    setInputQuery(q);
    runAIQuery(q);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-brand-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered Land Intelligence Assistant</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Ask anything about India&apos;s land-use data, historical trends, and policy impacts
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Multi-lingual intent parser supporting English, Hindi, and Hinglish. Analyzes verified government datasets and calculates mathematical decadal shifts with complete transparency.
          </p>

          {/* Big Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="e.g., UP mein agricultural land-use ka trend kya hai? or Gorakhpur urban growth..."
                className="w-full pl-10 pr-4 py-3 text-xs md:text-sm font-medium rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 backdrop-blur-md focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white/15 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !inputQuery.trim()}
              className="flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-md disabled:opacity-50 shrink-0"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Suggested Prompts */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 mr-2">Suggested Inquiries:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestedQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subtle decorative background blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Loading Skeleton State */}
      {aiLoading && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-white">
            Parsing Query & Executing Statistical Analysis...
          </div>
          <div className="text-xs text-slate-500 max-w-md mx-auto">
            Extracting spatial coordinates, querying time-series land records, calculating CAGR & Z-scores, and cross-referencing policy impact databases.
          </div>
        </div>
      )}

      {/* Render Answer Card */}
      {!aiLoading && aiResponse && (
        <AIAnswerCard response={aiResponse} />
      )}

      {/* Fallback prompt if no answer yet */}
      {!aiLoading && !aiResponse && (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Ask Land Intelligence Assistant
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Type any question in Hindi, Hinglish, or English to retrieve structured datasets, analytical charts, and evidence-backed summaries.
          </p>
        </div>
      )}
    </div>
  );
};
