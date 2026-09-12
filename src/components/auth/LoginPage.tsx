import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Award,
  Users,
  Building2,
  ArrowRight,
  Copy,
  Check,
  Info,
  ExternalLink,
  IdCard,
  CreditCard
} from 'lucide-react';
import { MASTER_ADMIN_EMAIL } from '../../lib/firebase';

export const LoginPage: React.FC = () => {
  const {
    loginWithFirebasePopup,
    loginWithGoogle,
    logout,
    userProfile,
    isMasterUser,
    setActivePage,
    setIsIdCardModalOpen
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('researcher');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  // Auto-fill email if Inspection Directorate is selected
  useEffect(() => {
    if (selectedRole === 'inspector') {
      setEmailInput(MASTER_ADMIN_EMAIL);
      setNameInput('Dr. Shashvat Shukla');
    }
  }, [selectedRole]);

  const roles: { id: UserRole; title: string; desc: string; icon: React.ElementType; masterOnly?: boolean }[] = [
    {
      id: 'researcher',
      title: 'Cadastral Researcher',
      desc: 'Publish research, analyze telemetry & obtain Dedicated Researcher UID',
      icon: Award
    },
    {
      id: 'policymaker',
      title: 'Policy Maker',
      desc: 'Formulate land policies, set district targets & simulate scenarios',
      icon: Building2
    },
    {
      id: 'public',
      title: 'Public Citizen',
      desc: 'Explore open cadastral GIS maps, query Land AI & view public land records',
      icon: Users
    },
    {
      id: 'inspector',
      title: 'Inspection Directorate',
      desc: `Exclusive directorate privileges reserved for ${MASTER_ADMIN_EMAIL}`,
      icon: ShieldCheck,
      masterOnly: true
    }
  ];

  const handleCopyDomain = () => {
    const domain = unauthorizedDomain || window.location.hostname;
    navigator.clipboard.writeText(domain);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2500);
  };

  const handleDirectGoogleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetEmail = (emailInput || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setUnauthorizedDomain(null);
      setSuccessNotice(null);

      const profile = await loginWithGoogle(
        {
          email: targetEmail,
          name: nameInput.trim() || (targetEmail === MASTER_ADMIN_EMAIL ? 'Dr. Shashvat Shukla' : targetEmail.split('@')[0]),
          role: selectedRole
        },
        selectedRole
      );

      if (selectedRole === 'inspector' && profile.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(
          `Logged in as ${profile.email}. Note: Inspection Directorate is reserved for ${MASTER_ADMIN_EMAIL}. You have been assigned the Researcher role with ID: ${profile.dedicatedFixedId}`
        );
      } else {
        setSuccessNotice(`Welcome, ${profile.name}! Your dedicated ID ${profile.dedicatedFixedId} has been generated.`);
      }

      // Automatically open their generated ID card so they see their new official identity
      setIsIdCardModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirebasePopup = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setUnauthorizedDomain(null);
      setSuccessNotice(null);

      const profile = await loginWithFirebasePopup(selectedRole);

      if (selectedRole === 'inspector' && profile.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(
          `Logged in as ${profile.email}. Note: Inspection Directorate is reserved for ${MASTER_ADMIN_EMAIL}. You have been assigned the Researcher role with ID: ${profile.dedicatedFixedId}`
        );
      } else {
        setSuccessNotice(`Welcome, ${profile.name}! Your dedicated ID ${profile.dedicatedFixedId} has been generated.`);
      }

      // Open their ID badge
      setIsIdCardModalOpen(true);
    } catch (err: any) {
      console.warn('Firebase popup attempt:', err);
      const isDomainError =
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('Unauthorized domain');

      if (isDomainError) {
        setUnauthorizedDomain(window.location.hostname);
        setErrorMessage(null);
        if (!emailInput) {
          setEmailInput(selectedRole === 'inspector' ? MASTER_ADMIN_EMAIL : '');
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please select your Google account from the popup.');
      } else {
        setErrorMessage(err.message || 'Google popup sign-in encountered an issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-5 text-left">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign In to Bharat LandNet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            National Cadastral Land Intelligence Platform &bull; Instant ID Generation
          </p>
        </div>

        {/* Vercel or External Deployment Notice */}
        {isVercelHost && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="leading-snug">
              <span className="font-bold">Live Vercel Deployment</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Anyone can sign in with any Google email below to instantly generate their official Cadastral ID.
              </p>
            </div>
          </div>
        )}

        {/* Domain Notice (if user tried popup on an unregistered domain) */}
        {unauthorizedDomain && (
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2 text-blue-900 dark:text-blue-300 font-semibold">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <span>Direct Sign-In Active for {unauthorizedDomain}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Google OAuth popup requires Firebase whitelist registration. On Vercel, simply use the direct Google Account sign-in below — your official Cadastral ID will be generated and issued immediately!
            </p>
          </div>
        )}

        {/* Standard Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="flex-1">{successNotice}</span>
          </div>
        )}

        {/* Active Session Display */}
        {userProfile?.isGoogleVerified ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={userProfile.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={userProfile.name}
                  className="w-11 h-11 rounded-full border-2 border-emerald-500 object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {userProfile.name}
                    </p>
                    {isMasterUser && (
                      <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">
                        Master
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                    {userProfile.email}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ID: {userProfile.dedicatedFixedId}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                {userProfile.role}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsIdCardModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <IdCard className="w-4 h-4 text-emerald-600" />
                <span>View & Export Official ID Card</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (userProfile.role === 'inspector') setActivePage('inspection');
                    else if (userProfile.role === 'policymaker') setActivePage('decision-support');
                    else if (userProfile.role === 'researcher') setActivePage('research');
                    else setActivePage('dashboard');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setEmailInput('');
                    setSuccessNotice('Signed out successfully.');
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Select Cadastral Role
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{r.title}</span>
                            {r.masterOnly && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-semibold font-mono">
                                Master
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {r.desc}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Google Account Input & ID Generation */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. Enter Google Email to Generate ID
              </label>

              <form onSubmit={handleDirectGoogleLogin} className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Your Google Email
                    </span>
                    {selectedRole === 'inspector' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Chief Director Pre-set
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEmailInput(MASTER_ADMIN_EMAIL)}
                        className="text-[10px] text-slate-400 hover:text-emerald-600 underline cursor-pointer"
                      >
                        Use Master Account
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                  />
                </div>

                {/* 1-Click Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Quick sign-in:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('inspector');
                      setEmailInput(MASTER_ADMIN_EMAIL);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    👑 Dr. Shashvat Shukla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('researcher');
                      setEmailInput('researcher@cadastre.gov.in');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    🔬 Researcher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('policymaker');
                      setEmailInput('policy@niti.gov.in');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    🏛️ Policy Maker
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !emailInput.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>{loading ? 'Generating ID & Authenticating...' : 'Sign In & Issue National ID Card'}</span>
                </button>
              </form>

              {/* Optional Popup Fallback */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFirebasePopup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition-all cursor-pointer"
                >
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
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
                  <span>Or use Google OAuth Popup (if domain authorized)</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
          Encrypted Cadastral Access &bull; Bharat LandNet &bull; Government of India
        </div>
      </div>
    </div>
  );
};
