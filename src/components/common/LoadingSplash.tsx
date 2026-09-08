import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Activity, Globe } from 'lucide-react';

interface LoadingSplashProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({
  onComplete,
  minDurationMs = 2800
}) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const steps = [
    { title: 'Connecting to National Spatial Data Infrastructure (NSDI)...', tag: 'GEOSPATIAL' },
    { title: 'Ingesting MoA&FW 9-Fold Land Classification Series (2005–2025)...', tag: 'RECORDS' },
    { title: 'Calibrating Amethi (Gauriganj) Cadastral & Tehsil Matrix...', tag: 'CADASTRAL' },
    { title: 'Grounding Google Gemini 1.5 Flash Land Intelligence Model...', tag: 'GEMINI AI' },
    { title: 'Synchronizing Decision Support & Anomaly Flagging Hub...', tag: 'COMPLETE' }
  ];

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));
      setProgress(calculatedProgress);

      const calculatedStep = Math.min(
        steps.length - 1,
        Math.floor((calculatedProgress / 100) * steps.length)
      );
      setStepIndex(calculatedStep);

      if (elapsed >= minDurationMs) {
        clearInterval(timer);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 600);
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDurationMs, onComplete, steps.length]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 bg-slate-950 text-white overflow-hidden select-none transition-all duration-700 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono shadow-sm">
          <Globe className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>GOVERNMENT OF INDIA • OPEN DATA FRAMEWORK</span>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Hero Visual & Emblem Animation */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl my-auto space-y-6">
        {/* Animated Brand Emblem Container */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Outer Pulsing Aura Rings */}
          <div className="absolute -inset-8 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -inset-16 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          {/* Core Official Bhu-Drishti Logo Emblem */}
          <div className="relative z-10 p-3 rounded-3xl bg-white shadow-2xl shadow-emerald-950/50 border-2 border-emerald-500/30 animate-float">
            <img
              src="/bhu-drishti-logo.png"
              alt="Bhu-Drishti Emblem"
              className="w-48 sm:w-60 md:w-72 h-auto object-contain rounded-2xl drop-shadow-lg"
            />
          </div>
        </div>

        {/* Live System Initialization Status Ticker */}
        <div className="w-full max-w-lg space-y-3 pt-2">
          {/* Progress Bar */}
          <div className="relative w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 transition-all duration-150 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 animate-shimmer-sweep opacity-60" />
            </div>
          </div>

          {/* Progress Percentage & Step Indicator */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-semibold">{steps[stepIndex]?.tag || 'INITIALIZING'}</span>
            </div>
            <span className="text-slate-400 font-bold">{progress}%</span>
          </div>

          {/* Current Action Label */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide animate-fade-in truncate">
              {steps[stepIndex]?.title || 'Preparing Platform...'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Credits & Provenance */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 pt-4 border-t border-slate-900 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MoA&FW 9-Fold Standard • GODL India • Gemini 1.5 Grounded</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Amethi (Gauriganj) Geospatial Edition</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">v1.0.0 Production</span>
        </div>
      </div>
    </div>
  );
};
