import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CreativeGroup } from '../types';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  Camera,
  Palette,
  Video,
  Layers,
  KeyRound,
  ArrowLeft,
  Clock,
  Check,
  Calendar,
} from 'lucide-react';
import { getTodayIsoDate, isValidBirthdate } from '../utils/dateUtils';

const BATCH_PRESETS = ['Batch Uno', 'Batch Dos', 'Batch Tres', 'Batch Sony'];

export const AuthScreen: React.FC = () => {
  const { login, loginWithGoogle, submitRegistration, systemSettings } = useApp();

  // Mode: Sign in or Self-Registration
  const [mode, setMode] = useState<'signin' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('register') || search.includes('invite')) {
        return 'register';
      }
    }
    return 'signin';
  });

  // Sign In States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-Registration States
  const [regFullName, setRegFullName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGradeSection, setRegGradeSection] = useState('Grade 11 - STEM');
  const [regBatch, setRegBatch] = useState('Batch Tres');
  const [regRegistrationDate, setRegRegistrationDate] = useState(() => getTodayIsoDate());
  const [regBirthdate, setRegBirthdate] = useState('');
  const [regCreativeGroup, setRegCreativeGroup] = useState<CreativeGroup>('photography');
  const [regTagsInput, setRegTagsInput] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regInviteCode, setRegInviteCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const match = hash.match(/invite=([a-zA-Z0-9_-]+)/) || search.match(/invite=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return systemSettings.inviteCode || 'fpc-creative-2026';
  });
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Auto-fill nickname and username as user types full name if untouched
  const handleFullNameChange = (val: string) => {
    setRegFullName(val);
    if (!regNickname) {
      const first = val.trim().split(' ')[0];
      if (first) setRegNickname(first);
    }
    if (!regUsername) {
      const clean = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      if (clean) setRegUsername(clean);
    }
  };

  // Sign In submit handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username, full name, or email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setErrorMessage(result.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Registration submit handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check invite code
    const validInviteCode = (systemSettings.inviteCode || 'fpc-creative-2026').toLowerCase().trim();
    if (regInviteCode.toLowerCase().trim() !== validInviteCode) {
      setErrorMessage('Invalid invite code. Please request the official invite link from a Flashpoint administrator.');
      return;
    }

    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('Please enter a password with at least 4 characters.');
      return;
    }
    if (!regBirthdate || !isValidBirthdate(regBirthdate)) {
      setErrorMessage('Please enter a valid birthdate (must not be in the future).');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = regTagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const result = await submitRegistration({
        fullName: regFullName.trim(),
        nickname: regNickname.trim() || regFullName.trim().split(' ')[0],
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        gradeSection: regGradeSection.trim(),
        batch: regBatch,
        registrationDate: regRegistrationDate,
        birthdate: regBirthdate,
        creativeGroup: regCreativeGroup,
        creativeTags: tags,
        bio: regBio.trim(),
      });

      if (result.success) {
        setRegSubmitted(true);
        setRegSuccessMessage(result.message);
      } else {
        setErrorMessage(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-slate-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-md mb-3 bg-white p-1">
            <img
              src={systemSettings.logoUrl}
              alt="First Peek Creatives Emblem"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{systemSettings.appName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xs font-medium">
            {systemSettings.schoolName}
          </p>
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold mt-1">
            <span>First Peek Creatives</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{systemSettings.academicYear}</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODE: SIGN IN */}
        {/* ============================================================== */}
        {mode === 'signin' && (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Member Sign In</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your credentials to access the hub.
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="System Online" />
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username, Full Name, or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. superadmin or your username"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to FPC Hub'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100" />
                <span className="shrink mx-3 text-[11px] font-medium text-slate-400">or</span>
                <div className="flex-grow border-t border-slate-100" />
              </div>
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Invite Registration Link / Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verified FPC Access</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('register');
                }}
                className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join with Invite Link →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE: SELF-REGISTRATION VIA INVITE CODE / LINK */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md">
            {regSubmitted ? (
              /* Success / Awaiting Approval Screen */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Application Submitted!</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                    {regSuccessMessage ||
                      'Your registration has been sent to the administrator. An officer will review your account, assign your starting baseline PKS, and activate your login.'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs space-y-1.5 text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Administrator Approval Required</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    You registered under username <strong className="font-mono">@{regUsername}</strong>. Once approved, you can sign in directly using this username and your chosen password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRegSubmitted(false);
                    setMode('signin');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            ) : systemSettings.inviteRegistrationActive === false ? (
              /* Registration Currently Paused */
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registration Currently Paused</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Member self-registration via invite link has been temporarily closed by the club administrator.
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Please contact the SuperAdmin or club officers if you need an account created.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      <span>Member Registration</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Join First Peek Creatives via club invite
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('signin');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Invite Code Verification Box */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Club Invite Code</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid Invite
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={regInviteCode}
                        onChange={(e) => setRegInviteCode(e.target.value)}
                        placeholder="fpc-creative-2026"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Full Name & Nickname */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        placeholder="e.g. Maria Santos"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nickname / Call Sign
                      </label>
                      <input
                        type="text"
                        value={regNickname}
                        onChange={(e) => setRegNickname(e.target.value)}
                        placeholder="e.g. Maria"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Username & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Desired Username *
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. maria_santos"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Account Password *
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Grade & Section & Batch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Grade & Section *
                      </label>
                      <input
                        type="text"
                        value={regGradeSection}
                        onChange={(e) => setRegGradeSection(e.target.value)}
                        placeholder="e.g. Grade 11 - STEM A"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Batch
                      </label>
                      <select
                        value={regBatch}
                        onChange={(e) => setRegBatch(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      >
                        {BATCH_PRESETS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date of Birth & Date of Registration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Birthdate *</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Type or pick</span>
                      </label>
                      <input
                        type="date"
                        min="1950-01-01"
                        max={getTodayIsoDate()}
                        value={regBirthdate}
                        onChange={(e) => setRegBirthdate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Date of Registration *</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        max={getTodayIsoDate()}
                        value={regRegistrationDate}
                        onChange={(e) => setRegRegistrationDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Creative Group Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Creative Specialization *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegCreativeGroup('photography')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          regCreativeGroup === 'photography'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-[11px]">Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegCreativeGroup('design')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          regCreativeGroup === 'design'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Palette className="w-4 h-4" />
                        <span className="text-[11px]">Design</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegCreativeGroup('videography')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          regCreativeGroup === 'videography'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-[11px]">Video</span>
                      </button>
                    </div>
                  </div>

                  {/* Skills & Tags */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Skills & Tags (optional)</span>
                      <span className="text-[10px] text-slate-400">Comma-separated</span>
                    </label>
                    <input
                      type="text"
                      value={regTagsInput}
                      onChange={(e) => setRegTagsInput(e.target.value)}
                      placeholder="e.g. portraits, lightroom, canva, drone"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Short Bio */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Short Bio / Statement (optional)
                    </label>
                    <textarea
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      placeholder="Why would you like to join Flashpoint Creatives?"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Application...' : 'Submit Member Registration'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* School Footer Note */}
        <p className="text-[11px] text-slate-500 text-center mt-6">
          San Jose National High School · Student Multimedia Arts Organization
        </p>
      </div>
    </div>
  );
};
