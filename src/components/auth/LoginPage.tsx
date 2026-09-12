import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Building2, LogOut, Search, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId, UserRole } from '../../types';

const roles: Array<{
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  { id: 'researcher', title: 'Researcher', description: 'Publish and analyze research', icon: Search },
  { id: 'policymaker', title: 'Policy maker', description: 'Create and evaluate policies', icon: Building2 },
  { id: 'public', title: 'Public', description: 'Explore maps and public records', icon: Users },
  { id: 'inspector', title: 'Inspector', description: 'Authorized account only', icon: ShieldCheck }
];

const dashboardForRole = (role: UserRole): PageId => {
  if (role === 'inspector') return 'inspection';
  if (role === 'admin') return 'admin';
  if (role === 'policymaker') return 'decision-support';
  if (role === 'researcher') return 'research';
  return 'dashboard';
};

const getAuthError = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled. Please try again.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in window. Allow popups and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return `Google sign-in is not enabled for ${window.location.hostname}. Add this host to Firebase Authentication > Settings > Authorized domains.`;
  }

  return message || 'Google sign-in failed. Please try again.';
};

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { loginWithFirebasePopup, logout, userProfile, userRole, setActivePage } = useApp();
  const initialRole = userRole === 'admin' ? 'inspector' : userRole;
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const continueToDashboard = (role: UserRole) => setActivePage(dashboardForRole(role));

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const profile = await loginWithFirebasePopup(selectedRole);
      continueToDashboard(profile.role);
    } catch (error) {
      setErrorMessage(getAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMessage(null);
    await logout();
    setSelectedRole('public');
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-4 sm:p-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to Bharat LandNet</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a role, then continue with Google.</p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {userProfile.isGoogleVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <img
                src={userProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{userProfile.name}</p>
                <p className="truncate text-sm text-slate-500">{userProfile.email}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {userProfile.role}
              </span>
            </div>

            <button
              type="button"
              onClick={() => continueToDashboard(userProfile.role)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Continue to dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Select your role</legend>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedRole(role.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`mb-2 h-4 w-4 ${selected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{role.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{role.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              <GoogleIcon />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400"
            >
              Continue as guest
            </button>

            <p className="text-center text-xs text-slate-400">
              Inspector access is granted only to the authorized Google account.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
