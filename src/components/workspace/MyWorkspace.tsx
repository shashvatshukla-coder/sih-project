import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bookmark, Trash2, ExternalLink, ArrowRight, FileText, Database, BookOpen, Sparkles } from 'lucide-react';

export const MyWorkspace: React.FC = () => {
  const { savedItems, removeItem, setActivePage, setSelectedState } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'analysis' | 'dataset' | 'paper'>('all');
  const [researchNotes, setResearchNotes] = useState<string>(
    '# Research Notes: Eastern UP Urbanization\n- Gautam Buddha Nagar and Gorakhpur show steady peri-urban encroachment.\n- PMKSY micro-irrigation expanded rabi acreage by 14% in Bundelkhand tehsils.'
  );

  const filtered = savedItems.filter(item => activeTab === 'all' || item.type === activeTab);

  return (
    <div className="space-y-6 text-left">
      {/* Workspace Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Personal Research Workspace & Bookmarks</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Saved Land Analyses, Datasets, Citations & Notes
          </h2>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          {(['all', 'analysis', 'dataset', 'paper'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? `All (${savedItems.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Saved Items (Left) + Notepad (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Items Column */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No items saved in this category
              </h4>
              <p className="text-xs text-slate-400">
                Bookmark datasets, AI query answers, or research papers across the platform to assemble your research package.
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 shrink-0">
                    {item.type === 'dataset' && <Database className="w-4 h-4" />}
                    {item.type === 'paper' && <BookOpen className="w-4 h-4" />}
                    {item.type === 'analysis' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {item.subtitle} • Saved {item.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Remove from Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Research Scratchpad Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Research Scratchpad
            </span>
            <span className="text-[10px] text-slate-400">Auto-saved</span>
          </div>

          <textarea
            value={researchNotes}
            onChange={e => setResearchNotes(e.target.value)}
            rows={14}
            className="w-full flex-1 p-3 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed"
            placeholder="Record hypotheses, citations, policy takeaways, or data queries..."
          />

          <button
            onClick={() => setActivePage('reports')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export to Comprehensive Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
