import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';
import { MASTER_ADMIN_EMAIL } from '../../lib/firebase';
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
  UserCheck,
  Database,
  Fingerprint,
  Award,
  ShieldCheck,
  LogOut,
  ChevronDown,
  KeyRound,
  Lock
} from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  onOpenMobile: () => void;
}

export const TopHeader: React.FC<HeaderProps> = ({ collapsed, onOpenMobile }) => {
  const {
    userRole,
    setUserRole,
    userProfile,
    dedicatedFixedId,
    setIsAuthModalOpen,
    setIsIdCardModalOpen,
    logout,
    isDarkMode,
    toggleDarkMode,
    setIsSearchOpen,
    setActivePage,
    isMasterUser
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    api.getDbStatus().then(status => {
      if (status) setDbStatus(status);
    }).catch(() => {});
  }, []);

  const roles: Array<{ id: UserRole; title: string; desc: string; icon: any }> = [
    { id: 'researcher', title: 'Researcher', desc: 'Author research, drag-and-drop upload, econometric metrics', icon: GraduationCap },
    { id: 'policymaker', title: 'Policy Maker', desc: 'Decision support, priority zone alerts, policy briefs', icon: Scale },
    { id: 'public', title: 'Public User', desc: 'High-level summaries, interactive choropleths, open data', icon: Users },
    { id: 'admin', title: 'Administrator', desc: 'Dataset ingest pipeline, column mapper, data provenance audit', icon: Shield },
    { id: 'inspector', title: 'Inspection Directorate', desc: 'Full ombudsman control, census statistics, star/verify, priority & power oversight', icon: ShieldCheck }
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
            placeholder="Search datasets, research papers, cadastral maps, policies..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none transition-all cursor-pointer placeholder:text-slate-400 font-normal"
          />
          <kbd className="hidden sm:inline-flex absolute right-3 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-4">
        {/* Dedicated Fixed ID Badge */}
        <button
          onClick={() => setIsIdCardModalOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all cursor-pointer shadow-2xs group"
          title="Click to view Official Cadastral Researcher ID Badge"
        >
          <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <div className="text-left leading-none">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Fixed Researcher ID
            </span>
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              {dedicatedFixedId}
            </span>
          </div>
          <Award className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
        </button>

        {/* Supabase Status Pill */}
        <button
          onClick={() => setActivePage('admin')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Database status (click to open Admin Storage Console)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3 h-3 text-emerald-600" />
          <span>{dbStatus?.supabase_connected ? 'Supabase Cloud' : (dbStatus?.postgres_connected ? 'PostgreSQL' : 'Hybrid DB')}</span>
        </button>

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
                  <p className="font-semibold">Research Feature Active</p>
                  <p className="text-[11px] opacity-80">Authoring studio & drag-and-drop file ingestion enabled.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">Dedicated Researcher UID</p>
                  <p className="text-[11px] opacity-80">{dedicatedFixedId} bound to Google profile.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google User Profile & Role Switcher */}
        <div className="relative">
          {userProfile?.isGoogleVerified ? (
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <div className="relative">
                <img
                  src={userProfile.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Shashvat&backgroundColor=059669'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/60"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                  <Check className="w-2 h-2" />
                </span>
              </div>
              <div className="hidden sm:block leading-tight min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                    {userProfile.name}
                  </p>
                  <span className="text-[9px] font-bold px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    G
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate capitalize">
                  {currentRoleObj.title}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={() => setActivePage('login')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Login Page</span>
            </button>
          )}

          {/* User Menu Dropdown */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 text-left space-y-2">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userProfile?.name}
                  </p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Google
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{userProfile?.email}</p>
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
                      Dedicated Fixed ID
                    </span>
                    <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      {dedicatedFixedId}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      setIsIdCardModalOpen(true);
                    }}
                    className="p-1 rounded bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50"
                    title="View ID Badge"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Profile Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    setIsIdCardModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Official Researcher ID Badge</span>
                </button>
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Account Credentials</span>
                </button>
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    setActivePage('login');
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors font-semibold"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Login / Switch Role Portal</span>
                </button>
              </div>

              {/* Role Switcher */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-3 pb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Platform Role
                  </p>
                  {isMasterUser && (
                    <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                      Master Key
                    </span>
                  )}
                </div>
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isRestrictedRole = r.id === 'inspector' || r.id === 'admin';
                  const isLockedForCurrent = isRestrictedRole && !isMasterUser;

                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (isLockedForCurrent) {
                          alert(`Access Denied: Inspection Directorate is reserved for Master Account (${MASTER_ADMIN_EMAIL}).`);
                          return;
                        }
                        setUserRole(r.id);
                        if (r.id === 'inspector') {
                          setActivePage('inspection');
                        }
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        userRole === r.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                          : isLockedForCurrent
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{r.title}</span>
                      </div>
                      {userRole === r.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isLockedForCurrent ? (
                        <Lock className="w-3 h-3 text-slate-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    logout();
                    setRoleMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Google</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

