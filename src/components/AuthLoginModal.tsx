import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Github,
  Key,
  Lock,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

export interface UserSession {
  email: string;
  name: string;
  role: 'Lead SRE' | 'Cluster Admin' | 'DevOps Engineer' | 'Security Officer';
  avatarUrl: string;
  organization: string;
  lastLogin: string;
  token: string;
  rbacPermissions?: string[];
}

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLogin: (session: UserSession) => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  theme = 'dark',
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Lead SRE' | 'Cluster Admin' | 'DevOps Engineer' | 'Security Officer'>('Cluster Admin');
  const [organization, setOrganization] = useState('Enterprise Production Fleet');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLight = theme === 'light';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (authMode === 'signup' && !password.trim()) {
      setErrorMessage('Please choose a password for the new operator account.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || email.split('@')[0],
          role,
          organization: organization.trim() || 'Enterprise Production Fleet',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onLogin(data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to Express authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginAsRahul = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rahulyadav.RY16@gmail.com',
          name: 'Rahul Yadav',
          role: 'Cluster Admin',
          organization: 'Enterprise Production Fleet',
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        onLogin(data.user);
        onClose();
      } else {
        throw new Error(data.error || 'Quick login failed');
      }
    } catch (err: any) {
      // Fallback local session if offline
      const session: UserSession = {
        email: 'rahulyadav.RY16@gmail.com',
        name: 'Rahul Yadav',
        role: 'Cluster Admin',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=rahulyadav',
        organization: 'Enterprise Production Fleet',
        lastLogin: new Date().toISOString(),
        token: `sre_sec_rahul_${Date.now()}`,
      };
      onLogin(session);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerLogout = async () => {
    try {
      if (currentUser?.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
      }
    } catch (err) {
      console.warn('Server logout error:', err);
    } finally {
      onLogout();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
              : 'bg-[#0e121a] border-[#222a3e] text-white shadow-black/80'
          }`}
        >
          {/* Header */}
          <div
            className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1b2234] bg-[#0a0d14]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  {currentUser ? 'Active SRE Operator Session' : 'SentriX Operator Authentication'}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser ? 'Signed in with Express.js RBAC Session' : 'Express.js Authentication & RBAC Fleet Control'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-500 hover:bg-slate-200'
                  : 'border-slate-800 text-slate-400 hover:bg-[#181f30] hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {currentUser ? (
              // Logged in state
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-center gap-4 ${
                    isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#131926] border-[#20293d]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-800 p-1 flex items-center justify-center">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{currentUser.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.organization}</p>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0b0e15] border-[#181f30] text-slate-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Token:</span>
                    <span className="text-emerald-400 font-semibold">{currentUser.token.substring(0, 18)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Express Backend:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Node.js Authenticated
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Verified:</span>
                    <span className="text-slate-400">{new Date(currentUser.lastLogin).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleServerLogout}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Continue Working</span>
                  </button>
                </div>
              </div>
            ) : (
              // Login / Sign Up Form
              <div className="space-y-4">
                {/* Tab Selector: Sign In vs Sign Up */}
                <div
                  className={`p-1 rounded-xl flex items-center border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141926] border-[#222a3d]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      authMode === 'signin'
                        ? isLight
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'bg-emerald-600 text-white shadow-sm'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? isLight
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'bg-emerald-600 text-white shadow-sm'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up / Register</span>
                  </button>
                </div>

                {/* 1-Click Login Banner for Rahul Yadav (shown in signin mode) */}
                {authMode === 'signin' && (
                  <div
                    onClick={handleQuickLoginAsRahul}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-white hover:bg-emerald-500/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          RY
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Sign in as Rahul Yadav</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                              Cluster Admin
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">rahulyadav.RY16@gmail.com</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : '1-Click Login'}
                      </button>
                    </div>
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-700/50 w-full" />
                    <span
                      className={`px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500 ${
                        isLight ? 'bg-white' : 'bg-[#0e121a]'
                      }`}
                    >
                      Or Enter Password
                    </span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Additional fields for Sign Up */}
                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alex Mercer"
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-colors ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                                : 'bg-[#141926] border-[#222a3d] text-white focus:border-emerald-500/60'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Cluster Role
                          </label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                                : 'bg-[#141926] border-[#222a3d] text-white focus:border-emerald-500/60'
                            }`}
                          >
                            <option value="Cluster Admin">Cluster Admin</option>
                            <option value="Lead SRE">Lead SRE</option>
                            <option value="DevOps Engineer">DevOps Engineer</option>
                            <option value="Security Officer">Security Officer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Team / Org
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={organization}
                              onChange={(e) => setOrganization(e.target.value)}
                              placeholder="Production CloudOps"
                              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-colors ${
                                isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                                  : 'bg-[#141926] border-[#222a3d] text-white focus:border-emerald-500/60'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@enterprise.cloud"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                            : 'bg-[#141926] border-[#222a3d] text-white focus:border-emerald-500/60'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {authMode === 'signup' ? 'Create Password' : 'Password / Access Key'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required={authMode === 'signup'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                            : 'bg-[#141926] border-[#222a3d] text-white focus:border-emerald-500/60'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : authMode === 'signup' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Operator Account & Sign In</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In & Access Fleet</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Switcher Footer Link */}
                <div className="text-center pt-2">
                  {authMode === 'signin' ? (
                    <p className="text-xs text-slate-400">
                      New team member?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErrorMessage('');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 cursor-pointer ml-1"
                      >
                        Create an SRE account
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErrorMessage('');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 cursor-pointer ml-1"
                      >
                        Sign in instead
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
