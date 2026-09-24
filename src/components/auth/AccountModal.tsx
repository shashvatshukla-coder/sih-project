import React, { useState } from 'react';
import { Camera, LogOut, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export const AccountModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, userProfile, setUserProfile, logout, setActivePage } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [affiliation, setAffiliation] = useState(userProfile.affiliation);
  const [designation, setDesignation] = useState(userProfile.designation);
  const [avatar, setAvatar] = useState(userProfile.avatar || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!isAuthModalOpen) return null;

  const close = () => setIsAuthModalOpen(false);
  const choosePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1_500_000) { setError('Choose an image smaller than 1.5 MB.'); return; }
    const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result || '')); reader.readAsDataURL(file);
  };
  const save = async () => {
    setBusy(true); setError('');
    try { const updated = await api.updateMyAccount({ name, affiliation, designation, avatar }); const profile = { ...userProfile, ...updated, isGoogleVerified: true, authProvider: 'email-otp' as const }; setUserProfile(profile); localStorage.setItem('bhu_user_profile', JSON.stringify(profile)); setEditing(false); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm('Permanently delete your BHU-DRISHTI account? This cannot be undone.')) return;
    setBusy(true); setError('');
    try { await api.deleteMyAccount(); await logout(); close(); setActivePage('dashboard'); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={close}><section onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="text-emerald-600"/><h2 className="font-bold text-slate-900 dark:text-white">Manage account</h2></div><button onClick={close}><X className="h-5 w-5 text-slate-400"/></button></div>
    {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    {!userProfile.isGoogleVerified ? <><p className="text-sm text-slate-500">Sign in to manage your account.</p><button onClick={() => { close(); setActivePage('login'); }} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white">Open sign-in</button></> : <div className="space-y-4">
      <div className="flex items-center gap-3"><div className="relative"><img src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`} className="h-16 w-16 rounded-full object-cover" alt="Profile"/>{editing && <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-emerald-600 p-1.5 text-white"><Camera className="h-3.5 w-3.5"/><input type="file" accept="image/*" className="hidden" onChange={choosePhoto}/></label>}</div><div><p className="font-semibold text-slate-900 dark:text-white">{userProfile.email}</p><p className="text-xs capitalize text-emerald-600">{userProfile.role} · verified</p></div></div>
      {editing ? <div className="space-y-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border bg-transparent px-3 py-2 dark:border-slate-700"/><input value={affiliation} onChange={e => setAffiliation(e.target.value)} placeholder="Affiliation" className="w-full rounded-xl border bg-transparent px-3 py-2 dark:border-slate-700"/><input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Designation" className="w-full rounded-xl border bg-transparent px-3 py-2 dark:border-slate-700"/><button disabled={busy} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white"><Save className="h-4 w-4"/>Save changes</button></div> : <button onClick={() => setEditing(true)} className="w-full rounded-xl border py-2.5 text-sm font-semibold dark:border-slate-700">Edit profile and photo</button>}
      <div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={async () => { await logout(); close(); }} className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm dark:border-slate-700"><LogOut className="h-4 w-4"/>Sign out</button>{userProfile.role !== 'admin' && <button disabled={busy} onClick={remove} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm text-red-600 dark:border-red-900"><Trash2 className="h-4 w-4"/>Delete account</button>}</div>
    </div>}
  </section></div>;
};
