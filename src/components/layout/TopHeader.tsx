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
  Check
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
    setActivePage
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
      case 'ai-query': return 'Ask Land Intelligence (AI Research Assistant)';
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

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        collapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-white truncate">
            {getPageTitle()}
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>India National Framework</span>
            <span>•</span>
            <span className="text-brand-600 dark:text-brand-400 font-semibold">
              {selectedState === 'IN-ALL' ? 'All India' : states.find(s => s.state_code === selectedState)?.state_name || selectedState}
            </span>
            {selectedDistrict !== 'ALL' && (
              <>
                <span>/</span>
                <span>{districts.find(d => d.district_code === selectedDistrict)?.district_name || selectedDistrict}</span>
              </>
            )}
            <span>•</span>
            <span className="font-mono">{selectedYear}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Search Button (Cmd+K) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search indicators, states, papers...</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xs text-slate-400">
            ⌘K
          </span>
        </button>

        {/* Quick Ask AI CTA */}
        <button
          onClick={() => setActivePage('ai-query')}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Ask AI</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {userRole === 'policymaker' && <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            {userRole === 'researcher' && <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            {userRole === 'public' && <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            {userRole === 'admin' && <Shield className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
            <span className="hidden sm:inline capitalize font-semibold">{userRole}</span>
          </button>

          {roleMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 text-left"
              onMouseLeave={() => setRoleMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Persona View
              </div>
              <div className="space-y-1 mt-1">
                {roles.map(r => {
                  const Icon = r.icon;
                  const isSelected = userRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setUserRole(r.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span>{r.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon (Anomalies) */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Active Intelligence Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 text-left"
              onMouseLeave={() => setNotifOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Active System Alerts</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">4 Flagged</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div
                  onClick={() => { setActivePage('anomalies'); setNotifOpen(false); }}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Gautam Buddha Nagar</span>
                    <span className="text-[10px] text-red-600 font-bold">Critical (Z=3.4)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    +47.9% built-up expansion since 2015 exceeding decadal baseline.
                  </div>
                </div>

                <div
                  onClick={() => { setActivePage('anomalies'); setNotifOpen(false); }}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Bengaluru Urban</span>
                    <span className="text-[10px] text-red-600 font-bold">Critical (Z=-3.1)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Agricultural share dropped to 15.0% under peri-urban expansion.
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setActivePage('anomalies'); setNotifOpen(false); }}
                className="w-full mt-1 py-1.5 text-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View all detected anomalies →
              </button>
            </div>
          )}
        </div>

        {/* Dark/Light Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
