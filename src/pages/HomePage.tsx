import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Landmark,
  Sparkles,
  BarChart3,
  MapPin,
  Database,
  FileCheck2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  TrendingUp,
  Scale
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActivePage, runAIQuery } = useApp();
  const [heroPrompt, setHeroPrompt] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroPrompt.trim()) {
      runAIQuery(heroPrompt.trim());
    } else {
      setActivePage('dashboard');
    }
  };

  const featureCards = [
    {
      page: 'statistics' as const,
      title: 'Land Statistics',
      desc: 'Explore state and district-level land indicators across 9-fold classifications.',
      icon: BarChart3,
      tag: '9-Fold Schema'
    },
    {
      page: 'map' as const,
      title: 'Interactive Maps',
      desc: 'Visualize geographic patterns, choropleth gradients, and multi-year land transitions.',
      icon: MapPin,
      tag: '2005–2025 Timeline'
    },
    {
      page: 'datasets' as const,
      title: 'Dataset Explorer',
      desc: 'Search government, satellite, and agricultural datasets with verifiable provenance.',
      icon: Database,
      tag: 'GODL India'
    },
    {
      page: 'ai-query' as const,
      title: 'AI Intelligence',
      desc: 'Ask questions in English, Hindi, or Hinglish with evidence-backed structured answers.',
      icon: Sparkles,
      tag: 'NLP Assistant'
    },
    {
      page: 'policy' as const,
      title: 'Policy Analysis',
      desc: 'Study indicator changes before and after PMKSY, DILRMP, and Green India Mission.',
      icon: FileCheck2,
      tag: 'Interrupted Series'
    },
    {
      page: 'research' as const,
      title: 'Research Library',
      desc: 'Discover relevant empirical studies, journal papers, reports, and APA citations.',
      icon: BookOpen,
      tag: 'Peer-Reviewed'
    }
  ];

  return (
    <div className="space-y-12 text-left pb-12">
      {/* Hero Section */}
      <section className="relative p-8 md:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white shadow-2xl overflow-hidden border border-slate-800">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>National Land Records & Geospatial Intelligence Platform (India)</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              India&apos;s Land Data, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-blue-300 bg-clip-text text-transparent">
                Made Understandable.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              Explore multi-decadal land-use trends, government datasets, research papers, and policy insights across 700+ districts in India through one unified, evidence-backed intelligence platform.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 max-w-xl flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-amber-400" />
              <div>
                <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">Official Platform Motto</div>
                <div className="text-xs text-slate-200 italic font-serif">"One evidence layer for every land decision."</div>
              </div>
            </div>

            {/* Quick AI Search Form */}
            <form onSubmit={handlePromptSubmit} className="pt-2 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={heroPrompt}
                  onChange={e => setHeroPrompt(e.target.value)}
                  placeholder="Ask e.g. 'Show land statistics of Gauriganj, Amethi' or 'UP land trend'..."
                  className="w-full pl-10 pr-4 py-3 text-xs md:text-sm font-medium rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 backdrop-blur-md focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm transition-all shadow-md shrink-0 cursor-pointer"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Key Metric Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-xs">
              <div>
                <div className="text-lg md:text-xl font-bold font-mono text-emerald-400">3.28M km²</div>
                <div className="text-slate-400 text-[11px]">Geographic Scope</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold font-mono text-blue-400">20 Years</div>
                <div className="text-slate-400 text-[11px]">Longitudinal Series</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold font-mono text-purple-400">5 Gateways</div>
                <div className="text-slate-400 text-[11px]">Govt Connectors</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold font-mono text-amber-400">100% Provenance</div>
                <div className="text-slate-400 text-[11px]">Verifiable Citations</div>
              </div>
            </div>
          </div>

          {/* Right: Emblem Feature Card */}
          <div className="lg:col-span-4 flex justify-center items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative p-3 rounded-2xl bg-white shadow-2xl border border-slate-200">
                <img
                  src="/bhu-drishti-logo.png"
                  alt="BHU-DRISHTI Emblem"
                  className="w-56 sm:w-64 md:w-72 h-auto object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Six Key Capabilities Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              Platform Core Capabilities
            </h2>
            <p className="text-xs text-slate-500">
              Designed for Researchers, Urban Planners, Policy Makers, and Academic Institutions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureCards.map(c => {
            const Icon = c.icon;
            return (
              <div
                key={c.page}
                onClick={() => setActivePage(c.page)}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-brand-500/50 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {c.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {c.desc}
                </p>

                <div className="pt-2 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
