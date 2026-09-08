import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  Database,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  GitCompare,
  FileCheck2,
  BookOpen,
  Layers,
  FileText,
  Bookmark,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Scale,
  ActivitySquare
} from 'lucide-react';

import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export const AppSidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { activePage, setActivePage, userRole, savedItems } = useApp();

  const navItems: Array<{ id: PageId; label: string; icon: any; badge?: string | number; roleReq?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'statistics', label: 'Land Statistics', icon: BarChart3 },
    { id: 'map', label: 'Map Explorer', icon: MapPin },
    { id: 'datasets', label: 'Dataset Explorer', icon: Database },
    { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { id: 'ai-query', label: 'Ask Land AI', icon: Sparkles, badge: 'AI' },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: '4' },
    { id: 'change', label: 'Land-Use Change', icon: ActivitySquare },
    { id: 'comparison', label: 'Comparison Tool', icon: GitCompare },
    { id: 'policy', label: 'Policy Impact', icon: FileCheck2 },
    { id: 'decision-support', label: 'Decision Support', icon: Scale, badge: 'Executive' },
    { id: 'research', label: 'Research Library', icon: BookOpen },
    { id: 'integration', label: 'Data Integration', icon: Layers },
    { id: 'reports', label: 'Report Generator', icon: FileText },
    { id: 'workspace', label: 'My Workspace', icon: Bookmark, badge: savedItems.length || undefined },
    { id: 'admin', label: 'Admin Pipeline', icon: ShieldCheck, roleReq: 'admin' }
  ];

  const handleNav = (id: PageId) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  const visibleItems = navItems.filter(item => !item.roleReq || userRole === 'admin');

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-emerald-50/95 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 border-r border-emerald-200/90 dark:border-emerald-800/60 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Branding with Official Bhu-Drishti Logo */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-100/50 dark:bg-emerald-900/40">
          <div
            className="flex items-center gap-2 cursor-pointer overflow-hidden flex-1"
            onClick={() => handleNav('dashboard')}
          >
            {collapsed ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-xs shrink-0 border border-emerald-300 dark:border-emerald-700">
                <img src="/bhu-drishti-logo.png" alt="Bhu-Drishti" className="w-full h-full object-cover object-top" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 shadow-xs shrink-0 border border-emerald-300 dark:border-emerald-700">
                  <img src="/bhu-drishti-logo.png" alt="Bhu-Drishti" className="w-full h-full object-cover object-top" />
                </div>
                <div className="leading-tight truncate">
                  <div className="font-extrabold text-emerald-950 dark:text-emerald-50 tracking-wide text-xs flex items-center gap-1.5">
                    <span>BHU-DRISHTI</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 font-mono font-bold border border-emerald-300 dark:border-emerald-600">IND</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                    One evidence layer
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-emerald-800">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/25'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 hover:text-emerald-950 dark:hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-950 dark:group-hover:text-emerald-100'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : item.badge === 'AI'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                        : item.badge === '4'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                        : 'bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User/Docs Section */}
        <div className="p-3 border-t border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-100/40 dark:bg-emerald-900/20">
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-white/70 dark:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
              {userRole === 'admin' ? 'AD' : userRole === 'policymaker' ? 'PM' : userRole === 'researcher' ? 'RS' : 'PB'}
            </div>
            {!collapsed && (
              <div className="truncate text-left leading-tight flex-1">
                <div className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 capitalize truncate">
                  {userRole === 'policymaker' ? 'Policy Officer' : userRole === 'researcher' ? 'Lead Researcher' : userRole === 'admin' ? 'System Admin' : 'Public Explorer'}
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate uppercase tracking-wider font-mono">
                  {userRole} Mode
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
