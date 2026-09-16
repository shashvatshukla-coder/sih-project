import React, { useState } from 'react';
import { ArrowRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId, UserRole } from '../../types';

const dashboardForRole = (role: UserRole): PageId => {
  if (role === 'inspector') return 'inspection';
  if (role === 'admin') return 'admin';
  if (role === 'policymaker') return 'decision-support';
  if (role === 'researcher') return 'research';
  return 'dashboard';
};

export const AccountModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, userProfile, logout, setActivePage } = useApp();
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const close = () => setIsAuthModalOpen(false);
  const openLogin = () => {
    close();
    setActivePage('login');
  };
  const continueToDashboard = (role: UserRole) => {
    close();
    setActivePage(dashboardForRole(role));
  };
  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={close} role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="account-dialog-title" className="font-bold text-slate-900 dark:text-white">Your account</h2>
              <p className="text-xs text-slate-500">Bharat LandNet</p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {userProfile.isGoogleVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <img src={userProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userProfile.name}</p>
                <p className="truncate text-xs text-slate-500">{userProfile.email}</p>
                <p className="mt-0.5 text-xs font-medium capitalize text-emerald-600">{userProfile.role}</p>
              </div>
            </div>
            <button type="button" onClick={() => continueToDashboard(userProfile.role)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={openLogin} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Change role</button>
              <button type="button" onClick={handleSignOut} disabled={loading} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Sign in to save work and use role-based tools.</p>
            <button type="button" onClick={openLogin} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Open sign-in
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
