import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Search,
  ArrowRight,
  Loader2,
  Key,
  CheckCircle2,
  AlertCircle,
  Zap,
  Bot,
  RefreshCw,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { AIAnswerCard } from './AIAnswerCard';

export const AskLandAI: React.FC = () => {
  const {
    activeAIQuery,
    setActiveAIQuery,
    aiResponse,
    runAIQuery,
    aiLoading,
    geminiApiKey,
    setGeminiApiKey,
    geminiStatus,
    testGeminiConnection
  } = useApp();

  const [inputQuery, setInputQuery] = useState(activeAIQuery || 'Show land statistics of Gauriganj, Amethi (UP)');
  const [keyInput, setKeyInput] = useState(geminiApiKey || '');
  const [testingKey, setTestingKey] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  useEffect(() => {
    if (activeAIQuery) {
      setInputQuery(activeAIQuery);
    }
  }, [activeAIQuery]);

  // If no AI response loaded yet, auto-run the default query for Amethi
  useEffect(() => {
    if (!aiResponse && !aiLoading) {
      runAIQuery(inputQuery);
    }
  }, []);

  const quickAmethiQueries = [
    { label: '🌾 Agricultural Land Trend', query: 'Show agricultural land statistics of Gauriganj, Amethi (UP)' },
    { label: '🏙️ Gauriganj HQ Urban Sprawl', query: 'What is the built-up urban area expansion in Gauriganj Amethi?' },
    { label: '🧪 Sodic/Usar Soil Reclamation', query: 'Explain Sodic/Usar land reclamation in Gauriganj Amethi under UPSLRP' },
    { label: '💧 Sharda Sahayak Canal Irrigation', query: 'How much gross irrigated land is in Amethi under PMKSY & Sharda Sahayak?' },
    { label: '🌳 Forest & Agro-Forestry Canopy', query: 'What is the forest and tree cover in Amethi district?' }
  ];

  const suggestedQueries = [
    'Show land statistics of Gauriganj, Amethi (UP)',
    'Amethi mein agricultural land-use ka trend kya hai?',
    'Explain Sodic/Usar land reclamation in Gauriganj Amethi',
    'Which UP districts have experienced the highest urban expansion?',
    'Compare forest cover in MP and Maharashtra',
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

  const handleTestGemini = async () => {
    setTestingKey(true);
    try {
      await testGeminiConnection(keyInput);
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-brand-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Google Gemini 1.5 Land Intelligence Assistant</span>
            </div>

            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-purple-200 transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>{showKeyConfig ? 'Hide Gemini API Settings' : 'Configure / Test Gemini API'}</span>
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Ask anything about India&apos;s land records, Amethi / Gauriganj data & decadal shifts
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Powered by Google Gemini 1.5 Flash grounded on verified Ministry of Agriculture (MoA&FW) and UP Board of Revenue datasets. Supports English, Hindi, and Hinglish.
          </p>

          {/* Gemini API Testing Panel */}
          {showKeyConfig && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/30 space-y-3 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Google Gemini 1.5 Flash Connection Tester
                </span>
                {geminiStatus && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                    geminiStatus.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {geminiStatus.model} {geminiStatus.latencyMs ? `(${geminiStatus.latencyMs}ms)` : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="password"
                    placeholder="Enter Google Gemini API Key (Optional — default server engine active)..."
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                  />
                </div>
                <button
                  onClick={handleTestGemini}
                  disabled={testingKey}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
                  <span>{testingKey ? 'Testing Connection...' : 'Test Gemini AI'}</span>
                </button>
              </div>

              {geminiStatus && (
                <div className="text-[11px] text-purple-200/90 font-mono bg-white/5 p-2 rounded border border-white/10">
                  Response: {geminiStatus.message}
                </div>
              )}
            </div>
          )}

          {/* Big Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="e.g., Show land statistics of Gauriganj, Amethi (UP)..."
                className="w-full pl-10 pr-4 py-3 text-xs md:text-sm font-medium rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 backdrop-blur-md focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white/15 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !inputQuery.trim()}
              className="flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
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

          {/* Specialized Quick Topic Chips */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-purple-300 mr-2 flex items-center gap-1 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Amethi (Gauriganj) Priority Inquiries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickAmethiQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item.query)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/30 text-purple-200 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other Regional Suggested Prompts */}
          <div className="pt-1 border-t border-white/10">
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestedQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 transition-colors truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Loading Skeleton State */}
      {aiLoading && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-white">
            Querying Google Gemini AI & Executing Grounded Statistical Analysis...
          </div>
          <div className="text-xs text-slate-500 max-w-md mx-auto">
            Extracting spatial coordinates for Amethi / Gauriganj, cross-referencing multi-decadal 9-fold land records, and computing CAGR & Z-score matrices.
          </div>
        </div>
      )}

      {/* Render Answer Card */}
      {!aiLoading && aiResponse && (
        <AIAnswerCard response={aiResponse} />
      )}
    </div>
  );
};
