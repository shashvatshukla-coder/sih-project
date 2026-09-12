import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Award,
  Users,
  Building2,
  FileCheck2,
  KeyRound,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Fingerprint,
  Info
} from 'lucide-react';
import { MASTER_ADMIN_EMAIL } from '../../lib/firebase';

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  features: string[];
  restrictedToMaster?: boolean;
}

export const LoginPage: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithFirebasePopup,
    userProfile,
    userRole,
    isMasterUser,
    setActivePage,
    setIsIdCardModalOpen
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('researcher');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Quick preset selector for custom test emails if running in sandboxed environment
  const [activeTab, setActiveTab] = useState<'firebase' | 'manual'>('firebase');
  const [manualEmail, setManualEmail] = useState(MASTER_ADMIN_EMAIL);
  const [manualName, setManualName] = useState('Dr. Shashvat Shukla');

  const ROLE_OPTIONS: RoleOption[] = [
    {
      id: 'researcher',
      title: 'Cadastral Researcher',
      subtitle: 'Open for any verified Google account',
      badge: 'Open Access',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300',
      icon: Award,
      description: 'Publish research papers, analyze 20-year district telemetry, upload datasets, and receive a permanent Cadastral Researcher UID.',
      features: [
        'Dedicated Fixed Researcher UID Attribution',
        'Direct Drag-and-Drop Research Paper Upload',
        'Official Digital ID Credential Badge',
        'State & District Land Telemetry Deep Dives'
      ]
    },
    {
      id: 'policymaker',
      title: 'Policy Maker & Planner',
      subtitle: 'Open for any verified Google account',
      badge: 'Open Access',
      badgeColor: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300',
      icon: Building2,
      description: 'Draft national & state land policies, calibrate agricultural targets, upload gazette notifications, and run decision support simulations.',
      features: [
        'Policy Document & Gazette Uploader',
        'District Agricultural Target Calibration',
        'Policy Impact Forecasting Lab (2030–2035)',
        'Multi-Ministry Comparative Land Matrices'
      ]
    },
    {
      id: 'public',
      title: 'Citizen Explorer / Public',
      subtitle: 'Open for any verified Google account',
      badge: 'Open Access',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
      icon: Users,
      description: 'Explore public land-use statistics, inspect nationwide maps, query the Land AI knowledge engine, and access GODL open datasets.',
      features: [
        'Nationwide Interactive GIS Map Explorer',
        'Ask Land AI Natural Language Engine',
        'GODL India Open Dataset Downloads',
        'Tehsil & District LULC Factsheets'
      ]
    },
    {
      id: 'inspector',
      title: 'Inspection Directorate (Chief Inspector)',
      subtitle: `Exclusive privilege for ${MASTER_ADMIN_EMAIL}`,
      badge: 'Restricted Master Access',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-400 font-bold',
      icon: ShieldCheck,
      description: 'The executive command center. Moderate uploaded policies, approve peer-reviewed research papers, inspect data anomalies, and calibrate user permissions.',
      features: [
        'Policy Upload Moderation & Official Verification',
        'Research Paper Peer-Review & Archival Control',
        'User Permission Calibration & UID Audits',
        'Universal Role Override & Full Directorate Powers'
      ],
      restrictedToMaster: true
    }
  ];

  const handleFirebaseSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessNotice(null);

      const profile = await loginWithFirebasePopup(selectedRole);

      if (selectedRole === 'inspector' && profile.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(`Restricted: Your account (${profile.email}) is logged in as ${profile.role}. Inspection Directorate access is exclusive to ${MASTER_ADMIN_EMAIL}.`);
      } else {
        setSuccessNotice(`Successfully authenticated as ${profile.name} (${profile.role.toUpperCase()})`);
        setTimeout(() => {
          if (profile.role === 'inspector') {
            setActivePage('inspection');
          } else if (profile.role === 'policymaker') {
            setActivePage('decision-support');
          } else if (profile.role === 'researcher') {
            setActivePage('research');
          } else {
            setActivePage('dashboard');
          }
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Firebase Google Sign-In failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAuth = async (emailToUse: string, nameToUse: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessNotice(null);

      const isTargetMaster = emailToUse.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      if (selectedRole === 'inspector' && !isTargetMaster) {
        setErrorMessage(`Restricted: Only master account ${MASTER_ADMIN_EMAIL} is authorized to access the Inspection Directorate.`);
        setLoading(false);
        return;
      }

      const profile = await loginWithGoogle(
        {
          email: emailToUse.trim(),
          name: nameToUse.trim(),
          role: selectedRole
        },
        selectedRole
      );

      setSuccessNotice(`Authenticated as ${profile.name} with ${profile.role.toUpperCase()} privileges.`);
      setTimeout(() => {
        if (profile.role === 'inspector') {
          setActivePage('inspection');
        } else if (profile.role === 'policymaker') {
          setActivePage('decision-support');
        } else if (profile.role === 'researcher') {
          setActivePage('research');
        } else {
          setActivePage('dashboard');
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>National Single Sign-On • Firebase Google Authentication</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Sign In to Bharat LandNet Portal
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Anyone can sign in with their Google account as <span className="font-semibold text-slate-900 dark:text-slate-200">Researcher</span>, <span className="font-semibold text-slate-900 dark:text-slate-200">Policy Maker</span>, or <span className="font-semibold text-slate-900 dark:text-slate-200">Public Observer</span>. Inspection Directorate and universal master rights are secured for <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{MASTER_ADMIN_EMAIL}</span>.
        </p>
      </div>

      {/* Alert / Notice Display */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto w-full mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successNotice && (
        <div className="max-w-3xl mx-auto w-full mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successNotice}</div>
        </div>
      )}

      {/* Main Grid: Role Selector & Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
        {/* Step 1: Choose Desired Role (7 Columns) */}
        <div className="lg:col-span-7 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              <span>Select Access Role</span>
            </h2>
            <span className="text-xs text-slate-500">
              Pick your objective on the platform
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.id;
              const isMasterRole = opt.restrictedToMaster;

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedRole(opt.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {opt.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                        {opt.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {opt.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>

                      {isMasterRole && (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Restricted: You must sign in with <strong>{MASTER_ADMIN_EMAIL}</strong> to activate this role.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sign-in Execution Card (5 Columns) */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <span>Authenticate with Google</span>
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            {/* Active Role Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Signing in as
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {selectedRole.toUpperCase()}
              </span>
            </div>

            {/* Authentication Mode Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('firebase')}
                className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-all ${
                  activeTab === 'firebase'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Firebase Google SSO
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Institutional Google ID
              </button>
            </div>

            {activeTab === 'firebase' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click below to open the official Google OAuth popup powered by Firebase Authentication.
                </p>

                {/* Primary Google Login Button */}
                <button
                  onClick={handleFirebaseSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white font-bold text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>{loading ? 'Authenticating...' : 'Sign in with Google (Firebase)'}</span>
                </button>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>Firebase Auth Project</span>
                  </div>
                  <p>
                    Configured with Firebase project <span className="font-mono text-emerald-600 dark:text-emerald-400">constant-fin-82ts5</span>. If your browser blocks popups in preview iframe, use the direct Google ID tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Authenticate your verified Google ID directly with role verification and immediate UID linkage.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Google Account Email
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      placeholder="name@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      User / Officer Full Name
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      placeholder="Dr. Full Name"
                    />
                  </div>

                  {/* One-click quick presets */}
                  <div className="pt-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Quick Identity Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualEmail(MASTER_ADMIN_EMAIL);
                          setManualName('Dr. Shashvat Shukla');
                          setSelectedRole('inspector');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        ⚡ My Master ID ({MASTER_ADMIN_EMAIL})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setManualEmail('researcher.icar@gmail.com');
                          setManualName('Prof. Arvind Raman');
                          setSelectedRole('researcher');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Researcher Preset
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setManualEmail('policy.advisor@niti.gov.in');
                          setManualName('Sunita Verma IAS');
                          setSelectedRole('policymaker');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Policy Maker Preset
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDirectAuth(manualEmail, manualName)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Authorize & Launch Workspace'}</span>
                </button>
              </div>
            )}

            {/* Currently Active Session Info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Current Session:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {userProfile?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Role:</span>
                <span className="capitalize font-bold text-emerald-600 dark:text-emerald-400">
                  {userRole}
                </span>
              </div>
              {isMasterUser && (
                <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Super Admin & Universal Role Switcher Enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
