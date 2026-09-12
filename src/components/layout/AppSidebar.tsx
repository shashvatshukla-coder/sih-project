import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  Database,
  FileText,
  Shield,
  Map,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Users,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sprout,
  Award,
  ShieldCheck,
  KeyRound
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
  const { activePage, setActivePage, userRole, dedicatedFixedId, setIsIdCardModalOpen, isMasterUser } = useApp();

  interface NavItem {
    id: PageId;
    label: string;
    icon: any;
    badge?: string;
  }

  // Bharat LandNet navigation with Inspection Directorate and Login Page
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'research', label: 'Research Publications', icon: FileText },
    { id: 'policy', label: 'Policy Repository', icon: Shield },
    { id: 'map', label: 'GIS & Maps', icon: Map },
    { id: 'case-studies', label: 'Case Studies', icon: BookOpen },
    { id: 'trends', label: 'Analytics Tools', icon: TrendingUp },
    { id: 'decision-support', label: 'Policy Innovation Lab', icon: Lightbulb },
    { id: 'collaboration', label: 'Collaboration Hub', icon: Users },
    { id: 'news-events', label: 'News & Events', icon: Newspaper },
    { id: 'inspection', label: 'Inspection Directorate', icon: ShieldCheck, badge: isMasterUser ? 'Master' : 'Protected' },
    { id: 'login', label: 'Login & Roles', icon: KeyRound, badge: 'Auth' }
  ];

  const handleNav = (id: PageId) => {
    setActivePage(id);
    setMobileOpen(false);
  };

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
        className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-sm`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none text-left overflow-hidden group"
          >
            {/* National Emblem / Logo Icon */}
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <img
                src="/bhu-drishti-logo.png"
                alt="Emblem"
                className="w-full h-full object-cover object-top rounded-lg"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                  <span>Bharat LandNet</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight mt-0.5">
                  National Digital Platform for Research & Policy Innovation
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  Empowering Land Governance for a Sustainable India
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 text-left custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Handle equivalent active states
            const isActive =
              activePage === item.id ||
              (item.id === 'case-studies' && activePage === 'research') ||
              (item.id === 'collaboration' && activePage === 'workspace') ||
              (item.id === 'news-events' && activePage === 'reports');

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#1b5e3a] text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Sustainability & Researcher ID Banner */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {!collapsed ? (
            <>
              {/* Dedicated Fixed ID quick button */}
              <button
                onClick={() => setIsIdCardModalOpen(true)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all group flex items-center justify-between cursor-pointer"
                title="Click to view your Dedicated Fixed Researcher ID Card"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Researcher UID
                    </span>
                    <span className="font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                      {dedicatedFixedId}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Land for People,
                  </p>
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
                    Prosperity & Sustainable Future
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 p-1">
              <button
                onClick={() => setIsIdCardModalOpen(true)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
                title={`Researcher ID: ${dedicatedFixedId}`}
              >
                <Award className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sprout className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
