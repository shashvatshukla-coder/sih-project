import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Menu,
  Sparkles,
  Shield,
  GraduationCap,
  Scale,
  Users,
  Check,
  MapPin,
  Bot
} from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  onOpenMobile: () => void;
}

export const TopHeader: React.FC<HeaderProps> = ({ collapsed, onOpenMobile }) => {
  const {
    activePage,
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedYear,
    setSelectedYear,
    states,
    districts,
    userRole,
    setUserRole,
    isDarkMode,
    toggleDarkMode,
    setIsSearchOpen,
    setActivePage,
    geminiStatus
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Executive Land Intelligence Dashboard';
      case 'statistics': return 'State & District Land Statistics';
      case 'map': return 'Interactive India Geospatial Map Explorer';
      case 'datasets': return 'National Land & Geospatial Dataset Repository';
      case 'trends': return 'Historical Land-Use Trend & CAGR Analyzer';
      case 'ai-query': return 'Ask Land Intelligence (Gemini AI Assistant)';
      case 'anomalies': return 'Statistical Anomaly Detection & Flagging';
      case 'change': return 'Multi-Period Land-Use Conversion & Matrix';
      case 'comparison': return 'Regional Comparative Assessment Engine';
      case 'policy': return 'Policy Impact Assessment (Pre vs Post Intervention)';
      case 'decision-support': return 'Executive Decision Support & Priority Zones';
      case 'research': return 'Land Governance Research Papers & Policy Library';
      case 'integration': return 'Government Data Connectors & Ingestion Hub';
      case 'reports': return 'Official Land Intelligence Report Generator';
      case 'workspace': return 'My Saved Analyses & Bookmarked Datasets';
      case 'admin': return 'Data Pipeline Ingestion & Schema Mapper';
      default: return 'Land Intelligence Platform';
    }
  };

  const roles: Array<{ id: UserRole; title: string; desc: string; icon: any }> = [
    { id: 'policymaker', title: 'Policy Maker', desc: 'Decision support, priority zone alerts, policy briefs', icon: Scale },
    { id: 'researcher', title: 'Researcher', desc: 'Deep data tables, econometric metrics, paper citations', icon: GraduationCap },
    { id: 'public', title: 'Public User', desc: 'High-level summaries, interactive choropleths, public open data', icon: Users },
    { id: 'admin', title: 'Administrator', desc: 'Dataset ingest pipeline, column mapper, data provenance audit', icon: Shield }
  ];

  const activeDistrictName = selectedDistrict !== 'ALL'
    ? districts.find(d => d.district_code === selectedDistrict)?.district_name || (selectedDistrict === 'UP-AMT' ? 'Amethi (Gauriganj)' : selectedDistrict)
    : 'All Districts';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300 w-full">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-white truncate">
            {getPageTitle()}
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            <span>India Framework</span>
            <span>•</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">
              {selectedState === 'IN-ALL' ? 'All India' : states.find(s => s.state_code === selectedState)?.state_name || 'Uttar Pradesh'}
            </span>
            <span>/</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              📍 {activeDistrictName}
            </span>
            <span>•</span>
            <span className="font-mono">{selectedYear}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Gemini AI Status Badge */}
        <button
          onClick={() => setActivePage('ai-query')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors"
          title="Google Gemini AI Engine is active"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>Gemini AI 1.5 Active</span>
        </button>

        {/* Global Search Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Search data, districts (Amethi)...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          title="Toggle Dark / Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
          >
            <span className="capitalize">{userRole}</span>
          </button>

          {roleMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setRoleMenuOpen(false)}
            >
              <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Persona View
              </div>
              <div className="space-y-1">
                {roles.map(r => {
                  const Icon = r.icon;
                  const isSelected = userRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setUserRole(r.id)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{r.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
