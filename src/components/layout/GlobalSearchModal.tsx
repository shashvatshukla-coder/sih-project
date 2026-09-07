import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId, District } from '../../types';
import {
  Search,
  X,
  MapPin,
  Database,
  FileCheck2,
  BookOpen,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    states,
    allDistricts,
    setSelectedState,
    setSelectedDistrict,
    setActivePage,
    runAIQuery
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  // Search states
  const matchedStates = states.filter(s =>
    s.state_name.toLowerCase().includes(q) || s.capital.toLowerCase().includes(q)
  );

  // Search districts
  const matchedDistricts = allDistricts.filter(d =>
    d.district_name.toLowerCase().includes(q) || d.state_name.toLowerCase().includes(q)
  );

  // Datasets
  const staticDatasets = [
    { id: 'DS-DES-LUS', title: 'Land Use Statistics At A Glance', cat: 'Land Use' },
    { id: 'DS-FSI-ISFR', title: 'India State of Forest Report (ISFR)', cat: 'Forestry' },
    { id: 'DS-NRSC-BHUVAN', title: 'National Land Use / Land Cover 50K (Bhuvan)', cat: 'Satellite' },
    { id: 'DS-DILRMP-CAD', title: 'Digital India Land Records Cadastral Gateway', cat: 'Cadastral' }
  ].filter(d => d.title.toLowerCase().includes(q) || d.cat.toLowerCase().includes(q));

  // Policies
  const staticPolicies = [
    { id: 'POL-PMKSY', name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)', ministry: 'Ministry of Jal Shakti' },
    { id: 'POL-DILRMP', name: 'Digital India Land Records Modernization Programme (DILRMP)', ministry: 'DoLR' },
    { id: 'POL-GIM', name: 'National Mission for a Green India (GIM)', ministry: 'MoEFCC' }
  ].filter(p => p.name.toLowerCase().includes(q) || p.ministry.toLowerCase().includes(q));

  // Research Papers
  const staticPapers = [
    { id: 'PAP-001', title: 'Decadal Dynamics of Agricultural Land Conversion (Indo-Gangetic Plain)', author: 'Sharma et al., 2024' },
    { id: 'PAP-002', title: 'Evaluating Cadastral Digitization on Agricultural Credit Inflows', author: 'Sundaram et al., 2023' },
    { id: 'PAP-003', title: 'Groundwater Irrigation Dynamics and Agricultural Productivity Under PMKSY', author: 'Ghosh & Nair, 2025' }
  ].filter(p => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));

  const handleSelectState = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict('ALL');
    setActivePage('statistics');
    setIsSearchOpen(false);
  };

  const handleSelectDistrict = (districtCode: string, stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict(districtCode);
    setActivePage('statistics');
    setIsSearchOpen(false);
  };

  const handleNav = (page: PageId) => {
    setActivePage(page);
    setIsSearchOpen(false);
  };

  const handleAskAIPrompt = () => {
    if (query.trim()) {
      runAIQuery(query.trim());
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
          <input
            type="text"
            placeholder="Search across states, districts, datasets, policies, or ask a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                handleAskAIPrompt();
              }
            }}
            autoFocus
            className="flex-1 text-sm text-slate-800 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-hidden focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ask AI Prompt if Query present */}
          {query && (
            <div
              onClick={handleAskAIPrompt}
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Ask Land AI: &quot;{query}&quot;
                  </div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400">
                    Run natural language statistical inference & trend calculation
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          )}

          {/* States */}
          {matchedStates.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> States ({matchedStates.length})
              </div>
              <div className="space-y-1">
                {matchedStates.slice(0, 4).map(s => (
                  <button
                    key={s.state_code}
                    onClick={() => handleSelectState(s.state_code)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.state_name}
                      <span className="text-[11px] font-normal text-slate-400 ml-2">Capital: {s.capital} • Area: {s.total_area_sqkm.toLocaleString()} km²</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 font-mono">
                      {s.state_code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Districts */}
          {matchedDistricts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Districts ({matchedDistricts.length})
              </div>
              <div className="space-y-1">
                {matchedDistricts.slice(0, 4).map(d => (
                  <button
                    key={d.district_code}
                    onClick={() => handleSelectDistrict(d.district_code, d.state_code)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {d.district_name}
                      <span className="text-[11px] font-normal text-slate-400 ml-2">State: {d.state_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {d.district_code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Datasets */}
          {staticDatasets.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Datasets
              </div>
              <div className="space-y-1">
                {staticDatasets.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleNav('datasets')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {d.title}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {d.cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Policies */}
          {staticPolicies.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" /> Government Policies
              </div>
              <div className="space-y-1">
                {staticPolicies.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleNav('policy')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </div>
                    <span className="text-[10px] text-slate-400">{p.ministry}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Research */}
          {staticPapers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Research Papers
              </div>
              <div className="space-y-1">
                {staticPapers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleNav('research')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.title}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{p.author}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <span>Navigate with arrows / Click to select</span>
          <span className="flex items-center gap-2">
            <span>Press <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> to Ask AI</span>
          </span>
        </div>
      </div>
    </div>
  );
};
