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
  FileCheck2,
  ExternalLink
} from 'lucide-react';

export const ResearcherIdCardModal: React.FC = () => {
  const { isIdCardModalOpen, setIsIdCardModalOpen, userProfile, dedicatedFixedId } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isIdCardModalOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(dedicatedFixedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
            <span>National Cadastral Researcher Identity Card</span>
          </div>
          <button
            onClick={() => setIsIdCardModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical Badge Layout */}
        <div className="p-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-xl space-y-5">
            {/* Background Holographic Watermark */}
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
                    BHU-DRISHTI • GEOSPATIAL INTELLIGENCE
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium">
                    National Land Records Modernization & Research Framework
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  OFFICIAL CADRE
                </span>
              </div>
            </div>

            {/* Middle Section: Photo & Researcher Details */}
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative shrink-0">
                <img
                  src={userProfile?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Shashvat&backgroundColor=059669'}
                  alt="Researcher"
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-emerald-400 shadow-md bg-white/10"
                />
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white ring-2 ring-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white truncate">
                    {userProfile?.name || 'Dr. Shashvat Shukla'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Google Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-300">
                  {userProfile?.designation || 'Senior Cadastral Research Scientist'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-300 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{userProfile?.affiliation || 'ICAR & National Informatics Centre'}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Email: <span className="text-slate-200">{userProfile?.email || 'shashvatshukla81@gmail.com'}</span>
                </p>
              </div>
            </div>

            {/* Dedicated Fixed ID Highlight Ribbon */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/15 relative z-10 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                  DEDICATED FIXED RESEARCHER ID
                </span>
                <span className="font-mono text-base font-extrabold text-white tracking-widest">
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
                  <span>Valid Through: <strong className="text-slate-200">2026–2030 (Triennial Audit)</strong></span>
                </p>
                <p className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  <span>Auth Scope: <strong className="text-slate-200">Full Research Upload & Authoring</strong></span>
                </p>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/10 border border-white/10">
                <QrCode className="w-6 h-6 text-emerald-300" />
                <div className="text-[8px] text-slate-300 leading-tight">
                  <span className="font-bold text-white block">NIC-VERIFIED</span>
                  <span>SCAN TO AUDIT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-5 flex items-center justify-between text-xs">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export ID Card</span>
            </button>
            <p className="text-[11px] text-slate-500">
              Issued under Ministry of Agriculture & Farmers' Welfare Guidelines
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
