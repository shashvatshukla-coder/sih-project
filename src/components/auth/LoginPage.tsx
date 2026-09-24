import React, { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { PageId, UserProfile, UserRole } from '../../types';

const dashboardForRole = (role: UserRole): PageId => role === 'admin' ? 'admin' : role === 'policymaker' ? 'decision-support' : role === 'researcher' ? 'research' : 'dashboard';

function toProfile(user: any): UserProfile {
  return {
    id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role,
    affiliation: user.affiliation || '', designation: user.designation || '', isGoogleVerified: true,
    emailVerified: user.emailVerified, status: user.status, issuedAt: new Date().toISOString(),
    authProvider: 'email-otp', isMasterSuperAdmin: user.role === 'admin', is_inspection_verified: user.role === 'admin',
    features_granted: user.role === 'admin' ? ['full_inspection', 'user_management'] : []
  };
}

export const LoginPage: React.FC = () => {
  const { login, logout, userProfile, setActivePage } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [role, setRole] = useState<UserRole>('public');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const finish = async (result: any) => {
    const profile = toProfile(result.user);
    await login(profile, result.token);
    setActivePage(dashboardForRole(profile.role));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try {
      if (mode === 'admin') await finish(await api.adminLogin(email, password));
      else if (step === 'details') {
        await api.requestAuthOtp({ email, password, name: mode === 'signup' ? name : undefined, role, mode });
        setStep('otp'); setMessage(`A 6-digit code was sent to ${email}.`);
      } else await finish(await api.verifyAuthOtp(email, otp));
    } catch (e: any) { setError(e.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  if (userProfile.isGoogleVerified) return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center p-4"><section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3"><img src={userProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`} className="h-14 w-14 rounded-full object-cover" alt=""/><div><h1 className="font-bold text-slate-900 dark:text-white">{userProfile.name}</h1><p className="text-sm text-slate-500">{userProfile.email}</p></div></div>
      <button onClick={() => setActivePage(dashboardForRole(userProfile.role))} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white">Continue to dashboard</button>
      <button onClick={() => logout()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm dark:border-slate-700"><LogOut className="h-4 w-4"/>Sign out</button>
    </section></div>
  );

  return <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-4"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
    <div className="mb-5 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><ShieldCheck/></div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Secure BHU-DRISHTI access</h1><p className="mt-1 text-sm text-slate-500">Every user verifies their email with OTP.</p></div>
    <div className="mb-5 grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{(['login','signup','admin'] as const).map(item => <button key={item} type="button" onClick={() => { setMode(item); setStep('details'); setError(''); }} className={`rounded-lg px-2 py-2 text-sm font-semibold capitalize ${mode === item ? 'bg-white text-emerald-700 shadow dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500'}`}>{item}</button>)}</div>
    {error && <div className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
    {message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</div>}
    <form onSubmit={submit} className="space-y-3">
      {mode === 'signup' && step === 'details' && <label className="relative block"><UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border bg-transparent py-2.5 pl-10 pr-3 dark:border-slate-700"/></label>}
      <label className="relative block"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required value={email} onChange={e => setEmail(e.target.value)} type={mode === 'admin' ? 'text' : 'email'} placeholder={mode === 'admin' ? 'Administrator ID' : 'Email address'} disabled={step === 'otp'} className="w-full rounded-xl border bg-transparent py-2.5 pl-10 pr-3 disabled:opacity-60 dark:border-slate-700"/></label>
      {step === 'details' ? <label className="relative block"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required minLength={8} value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password (minimum 8 characters)" className="w-full rounded-xl border bg-transparent py-2.5 pl-10 pr-3 dark:border-slate-700"/></label> : <label className="block"><input required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" placeholder="6-digit OTP" className="w-full rounded-xl border bg-transparent px-3 py-3 text-center text-xl tracking-[.35em] dark:border-slate-700"/></label>}
      {mode === 'signup' && step === 'details' && <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full rounded-xl border bg-transparent px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"><option value="public">Public user</option><option value="researcher">Researcher</option><option value="policymaker">Policy maker</option></select>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Please wait…' : mode === 'admin' ? 'Administrator login' : step === 'otp' ? 'Verify OTP' : 'Send OTP'}<ArrowRight className="h-4 w-4"/></button>
      {step === 'otp' && <button type="button" onClick={() => { setStep('details'); setOtp(''); }} className="w-full text-sm text-slate-500">Change email or resend code</button>}
    </form>
    {mode === 'admin' && <p className="mt-4 text-center text-xs text-slate-400">The administrator signs in without OTP.</p>}
  </section></div>;
};
