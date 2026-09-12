import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Award,
  Fingerprint,
  QrCode,
  Download,
  Calendar,
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ResearcherIdCardModal: React.FC = () => {
  const { isIdCardModalOpen, setIsIdCardModalOpen, userProfile, dedicatedFixedId, setActivePage } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isIdCardModalOpen) return null;

  const role = userProfile?.role || 'researcher';

  // Role-specific badge styling and labels
  const roleConfig = {
    inspector: {
      cardTitle: 'National Cadastral Inspection Directorate Identification',
      badgeLabel: 'CHIEF INSPECTOR GENERAL',
      idLabel: 'DIRECTORATE AUDIT UID',
      headerBg: 'from-slate-900 via-amber-950 to-slate-900',
      badgeBorder: 'border-amber-500/40',
      accentColor: 'text-amber-400',
      badgeTagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    policymaker: {
      cardTitle: 'National Land Policy Advisory Credential',
      badgeLabel: 'POLICY COMMISSION CADRE',
      idLabel: 'POLICY ADVISORY UID',
      headerBg: 'from-slate-900 via-blue-950 to-slate-900',
      badgeBorder: 'border-blue-500/40',
      accentColor: 'text-blue-400',
      badgeTagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    },
    public: {
      cardTitle: 'National Cadastral Public Access Credential',
      badgeLabel: 'CITIZEN REGISTRY CADRE',
      idLabel: 'CITIZEN ACCESS UID',
      headerBg: 'from-slate-900 via-teal-950 to-slate-900',
      badgeBorder: 'border-teal-500/40',
      accentColor: 'text-teal-400',
      badgeTagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    },
    researcher: {
      cardTitle: 'National Cadastral Researcher Identity Card',
      badgeLabel: 'OFFICIAL RESEARCH CADRE',
      idLabel: 'DEDICATED RESEARCHER UID',
      headerBg: 'from-slate-900 via-slate-800 to-emerald-950',
      badgeBorder: 'border-emerald-500/30',
      accentColor: 'text-emerald-400',
      badgeTagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  }[role];

  const handleCopyId = () => {
    navigator.clipboard.writeText(dedicatedFixedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEnterDashboard = () => {
    setIsIdCardModalOpen(false);
    if (role === 'inspector') setActivePage('inspection');
    else if (role === 'policymaker') setActivePage('decision-support');
    else if (role === 'researcher') setActivePage('research');
    else setActivePage('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>{roleConfig.cardTitle}</span>
          </div>
          <button
            onClick={() => setIsIdCardModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical Badge Layout */}
        <div className="p-6 space-y-4">
          <div className={`relative overflow-hidden rounded-2xl border-2 ${roleConfig.badgeBorder} bg-gradient-to-br ${roleConfig.headerBg} text-white p-6 shadow-xl space-y-5`}>
            {/* Background Holographic Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Badge Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                    BHU-DRISHTI &bull; BHARAT LANDNET
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium">
                    National Geospatial Land Intelligence Directorate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleConfig.badgeTagColor}`}>
                  {roleConfig.badgeLabel}
                </span>
              </div>
            </div>

            {/* Middle Section: Photo & User Details */}
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative shrink-0">
                <img
                  src={userProfile?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=059669'}
                  alt="User"
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-emerald-400 shadow-md bg-white/10"
                />
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white ring-2 ring-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white truncate">
                    {userProfile?.name || 'Verified User'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Google Verified
                  </span>
                </div>
                <p className={`text-xs font-semibold ${roleConfig.accentColor}`}>
                  {userProfile?.designation || 'Cadastral Specialist'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-300 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{userProfile?.affiliation || 'National Cadastral Authority'}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  Email: <span className="text-slate-200">{userProfile?.email || 'user@gmail.com'}</span>
                </p>
              </div>
            </div>

            {/* Dedicated Fixed ID Highlight Ribbon */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/15 relative z-10 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                  {roleConfig.idLabel}
                </span>
                <span className="font-mono text-base font-extrabold text-white tracking-widest select-all">
                  {dedicatedFixedId}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>

            {/* Bottom Footer: Verification QR & Clearance */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 relative z-10">
              <div className="space-y-0.5">
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>Valid Through: <strong className="text-slate-200">2026–2030 (Triennial Cycle)</strong></span>
                </p>
                <p className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  <span>Status: <strong className="text-emerald-300">Active &bull; Tamper-Proof Cryptographic ID</strong></span>
                </p>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/10 border border-white/10">
                <QrCode className="w-6 h-6 text-emerald-300" />
                <div className="text-[8px] text-slate-300 leading-tight">
                  <span className="font-bold text-white block">NIC-AUDIT</span>
                  <span>SCAN TO VERIFY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Badge</span>
            </button>
            <button
              onClick={handleEnterDashboard}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Enter Bharat LandNet Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
