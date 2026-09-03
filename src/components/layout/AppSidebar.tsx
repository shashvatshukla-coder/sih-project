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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => handleNav('dashboard')}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold shadow-md shrink-0">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <div className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
                  <span>BHU-DRISHTI</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono font-semibold border border-brand-500/30">IND</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Land Intelligence Platform
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'AI'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.badge === '4'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
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
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {userRole === 'admin' ? 'AD' : userRole === 'policymaker' ? 'PM' : userRole === 'researcher' ? 'RS' : 'PB'}
            </div>
            {!collapsed && (
              <div className="truncate text-left leading-tight flex-1">
                <div className="text-xs font-semibold text-slate-200 capitalize truncate">
                  {userRole === 'policymaker' ? 'Policy Officer' : userRole === 'researcher' ? 'Lead Researcher' : userRole === 'admin' ? 'System Admin' : 'Public Explorer'}
                </div>
                <div className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-mono">
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
