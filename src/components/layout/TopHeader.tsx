import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  onOpenMobile: () => void;
}

export const TopHeader: React.FC<HeaderProps> = ({ collapsed, onOpenMobile }) => {
  const {
    userRole,
    setUserRole,
    isDarkMode,
    toggleDarkMode,
    setIsSearchOpen,
    setActivePage
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roles: Array<{ id: UserRole; title: string; desc: string; icon: any }> = [
    { id: 'researcher', title: 'Researcher', desc: 'Deep data tables, econometric metrics, paper citations', icon: GraduationCap },
    { id: 'policymaker', title: 'Policy Maker', desc: 'Decision support, priority zone alerts, policy briefs', icon: Scale },
    { id: 'public', title: 'Public User', desc: 'High-level summaries, interactive choropleths, public open data', icon: Users },
    { id: 'admin', title: 'Administrator', desc: 'Dataset ingest pipeline, column mapper, data provenance audit', icon: Shield }
  ];

  const currentRoleObj = roles.find(r => r.id === userRole) || roles[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 w-full">
      {/* Mobile Toggle */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center/Left: Wide Search Input */}
      <div className="flex-1 max-w-2xl">
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative flex items-center w-full cursor-pointer group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors absolute left-3.5" />
          <input
            type="text"
            readOnly
            placeholder="Search datasets, research, policies, maps, case studies..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none transition-all cursor-pointer placeholder:text-slate-400 font-normal"
          />
          <kbd className="hidden sm:inline-flex absolute right-3 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Notification, Dark Mode & User Profile */}
      <div className="flex items-center gap-3 ml-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Live Updates</span>
                <span className="text-[10px] text-emerald-600 font-medium">Synced Just Now</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">DES 2025 Series Live</p>
                  <p className="text-[11px] opacity-80">9-Fold classification benchmarks updated.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">Amethi Cadastral Layers</p>
                  <p className="text-[11px] opacity-80">Gauriganj HQ sodic reclamation synced.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill (Ayushman Researcher) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 shadow-2xs">
              <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="hidden sm:block leading-tight min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Ayushman
              </p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate capitalize">
                {currentRoleObj.title}
              </p>
            </div>
          </button>

          {/* Role Changer Menu */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-left">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Session</p>
                <p className="text-[11px] text-slate-500">ayushman.researcher@nic.in</p>
              </div>
              <div className="py-1 space-y-1">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setUserRole(r.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        userRole === r.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{r.title}</span>
                      </div>
                      {userRole === r.id && <Check className="w-3.5 h-3.5" />}
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
