import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Building2, LogOut, Mail, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
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

export const LoginPage: React.FC = () => {
  const { login, logout, userProfile, userRole, setActivePage } = useApp();
  const initialRole = userRole === 'admin' ? 'inspector' : userRole;
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const continueToDashboard = (role: UserRole) => setActivePage(dashboardForRole(role));

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const profile = await login({ name, email }, selectedRole);
      continueToDashboard(profile.role);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMessage(null);
    await logout();
    setSelectedRole('public');
    setName('');
    setEmail('');
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
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your details and choose your role.</p>
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

            <button type="button" onClick={() => continueToDashboard(userProfile.role)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Continue to dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleSignOut} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
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
                      className={`rounded-xl border p-3 text-left transition-colors ${selected ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
                    >
                      <Icon className={`mb-2 h-4 w-4 ${selected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{role.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{role.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-3">
              <label className="relative block">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <label className="relative block">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in...' : 'Continue'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <button type="button" onClick={() => setActivePage('dashboard')} className="w-full text-center text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400">
              Continue as guest
            </button>

            <p className="text-center text-xs text-slate-400">Inspector access is granted only to the authorized email.</p>
          </form>
        )}
      </section>
    </div>
  );
};
