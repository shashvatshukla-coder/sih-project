import React, { useState } from 'react';
import { AlertCircle, ArrowRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId, UserRole } from '../../types';

const dashboardForRole = (role: UserRole): PageId => {
  if (role === 'inspector') return 'inspection';
  if (role === 'admin') return 'admin';
  if (role === 'policymaker') return 'decision-support';
  if (role === 'researcher') return 'research';
  return 'dashboard';
};

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

export const GoogleAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    userProfile,
    loginWithFirebasePopup,
    logout,
    setActivePage,
    userRole
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const close = () => {
    setAuthError(null);
    setIsAuthModalOpen(false);
  };

  const continueToDashboard = (role: UserRole) => {
    close();
    setActivePage(dashboardForRole(role));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const profile = await loginWithFirebasePopup(userRole);
      continueToDashboard(profile.role);
    } catch (error: any) {
      const code = error?.code || '';
      const message = error?.message || '';
      if (code === 'auth/popup-closed-by-user') setAuthError('Sign-in was cancelled. Please try again.');
      else if (code === 'auth/popup-blocked') setAuthError('Allow popups in your browser, then try again.');
      else if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        setAuthError(`Google sign-in is not enabled for ${window.location.hostname}. Add this host to Firebase Authorized domains.`);
      } else setAuthError(message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={close}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
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

        {authError && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {userProfile.isGoogleVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <img
                src={userProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`}
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
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
              <button
                type="button"
                onClick={() => {
                  close();
                  setActivePage('login');
                }}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Change role
              </button>
              <button type="button" onClick={handleSignOut} disabled={loading} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Sign in with Google to save work and use role-based tools.</p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              <GoogleIcon />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                setActivePage('login');
              }}
              className="w-full text-center text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Choose a different role
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
