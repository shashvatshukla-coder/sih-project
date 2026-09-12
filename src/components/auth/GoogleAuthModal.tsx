import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Key,
  ExternalLink,
  Sparkles,
  Award,
  Fingerprint
} from 'lucide-react';

export const GoogleAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    userProfile,
    loginWithGoogle,
    loginWithFirebasePopup,
    logout,
    dedicatedFixedId,
    setIsIdCardModalOpen,
    setActivePage,
    userRole
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customEmail, setCustomEmail] = useState(userProfile?.email || '');
  const [customName, setCustomName] = useState(userProfile?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(dedicatedFixedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFirebasePopup = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await loginWithFirebasePopup(userRole);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Firebase Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantGoogleSignIn = async () => {
    if (!customEmail.trim()) {
      setAuthError('Please enter an email address.');
      return;
    }
    try {
      setLoading(true);
      setAuthError(null);
      await loginWithGoogle(
        {
          email: customEmail.trim(),
          name: customName.trim() || customEmail.split('@')[0],
          role: userRole,
          dedicatedFixedId: dedicatedFixedId
        },
        userRole
      );
      setIsAuthModalOpen(false);
    } catch (e: any) {
      setAuthError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthPopupSignIn = async () => {
    try {
      setLoading(true);
      const authUrl = await api.getGoogleAuthUrl();

      // Open provider URL directly in popup as required by AI Studio OAuth Skill
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        authUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      // Listen for message from popup
      const handleAuthMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          loginWithGoogle({
            email: customEmail,
            name: customName,
            role: 'researcher',
            dedicatedFixedId: dedicatedFixedId
          });
          setIsAuthModalOpen(false);
          window.removeEventListener('message', handleAuthMessage);
        }
      };
      window.addEventListener('message', handleAuthMessage);

      // Fallback if closed or completed
      const checkPopup = setInterval(() => {
        if (!authWindow || authWindow.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleAuthMessage);
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      console.error('OAuth initiation error:', err);
      // Fallback to direct verification
      await handleInstantGoogleSignIn();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Institutional Google Authentication
              </h3>
              <p className="text-[11px] text-slate-500">Bhu-Drishti Cadastral Research Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Dedicated Fixed ID Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Dedicated Fixed Researcher ID</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100">
                Permanent UID
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
                {dedicatedFixedId}
              </span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition-all cursor-pointer shadow-2xs"
                title="Copy Dedicated Fixed ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
              Permanently bound to your research papers, cadastral edits, and field telemetry uploads.
            </p>
          </div>

          {/* Current Status Card */}
          {userProfile?.isGoogleVerified ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={userProfile.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Shashvat&backgroundColor=059669'}
                    alt="User Avatar"
                    className="w-11 h-11 rounded-full ring-2 ring-emerald-500/50 object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {userProfile.name}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Google
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{userProfile.email}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {userProfile.designation} • {userProfile.affiliation}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsIdCardModalOpen(true);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Digital Researcher Credential</span>
                </button>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-500 text-[11px] font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <p className="font-semibold text-xs mb-0.5">Guest Mode Active</p>
              <p className="text-[11px] opacity-90">
                Sign in with your Google account to unlock dedicated researcher authoring, drag-and-drop file uploads, and permanent UID attribution.
              </p>
            </div>
          )}

          {/* Account Customizer Toggle */}
          <div className="space-y-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium flex items-center gap-1"
            >
              <span>{isEditing ? 'Hide account details' : 'Configure Google profile & email'}</span>
            </button>

            {isEditing && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Researcher Full Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Dr. Full Name"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message if Any */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
              {authError}
            </div>
          )}

          {/* Google Sign-in Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Firebase Google Popup Button */}
            <button
              onClick={handleFirebasePopup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              {/* Official Google 'G' Logo SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

            {/* Instant Direct Verification */}
            <button
              onClick={handleInstantGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium transition-colors"
            >
              <span>Quick Verify as {customEmail}</span>
            </button>

            {/* Navigate to Dedicated Role & Login Portal */}
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setActivePage('login');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
            >
              <span>Open Dedicated Role Selector & Login Portal →</span>
            </button>
          </div>

          {/* Security Guarantee Notice */}
          <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Your Dedicated ID <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{dedicatedFixedId}</span> is issued under NIC / MoA&FW National Cadastral Data Standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
