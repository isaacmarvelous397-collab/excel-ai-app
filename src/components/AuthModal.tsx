import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        const res = await api.forgotPassword(email);
        setSuccessMsg(res.message);
      } catch (err: any) {
        setError(err.message || 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (!name || name.trim().length < 2) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify and re-type.');
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signup(name, email, password, confirmPassword);
        setSuccessMsg('Account created successfully! Redirecting...');
      } else {
        await login(email, password);
        setSuccessMsg('Logged in successfully! Redirecting...');
      }

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle('Test User', email || 'user@example.com');
      setSuccessMsg('Google authentication successful!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:text-left animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 text-left overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="text-center pt-1 sm:pt-0">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2.5 shadow-2xs">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {mode === 'signup'
                ? 'Create your ExcelAI account'
                : mode === 'login'
                ? 'Welcome back to ExcelAI'
                : 'Reset your password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {mode === 'signup'
                ? 'Start analyzing spreadsheets with AI in seconds'
                : mode === 'login'
                ? 'Enter your credentials to access your workspace'
                : "Enter your email and we'll send you a recovery link"}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 p-1"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    id="toggle-auth-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 transition-colors rounded-lg"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{strength.label}</span>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    id="toggle-signup-confirm-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 transition-colors rounded-lg"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              id="auth-submit-button"
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signup'
                      ? 'Create Account'
                      : mode === 'login'
                      ? 'Log In'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          {mode !== 'forgot' && (
            <>
              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-white px-3 text-slate-400">or</span>
                </div>
              </div>

              <button
                id="auth-google-button"
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-300 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}

          {/* Footer mode switch */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  id="switch-to-login"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 p-1"
                >
                  Log in
                </button>
              </p>
            )}
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button
                  id="switch-to-signup"
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 p-1"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button
                  id="switch-back-to-login"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 p-1"
                >
                  Back to Log In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
