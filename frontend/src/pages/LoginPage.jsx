import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TruckIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        navigate(redirectUrl);
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      const res = err.response;
      const status = res?.status;
      const errData = res?.data;
      const debugHeader = res?.headers?.['x-debug-auth-failure'];

      let errorMsg = 'Invalid email or password';

      if (typeof errData === 'string' && errData.includes('<html')) {
        errorMsg = `Server Error (${status || 500}): HTML response received. Web server or WAF blocked the request. Check console.`;
      } else if (debugHeader === 'AccountDeactivated' || errData?.error?.includes('deactivated')) {
        errorMsg = '403 Forbidden: Account is deactivated. Contact administrator.';
      } else if (status === 403) {
        errorMsg = `403 Forbidden: ${errData?.error || 'Access denied by server security policy. Check browser console.'}`;
      } else if (typeof errData?.error === 'string') {
        errorMsg = errData.error;
      } else if (errData?.error?.message) {
        errorMsg = errData.error.message;
      } else if (errData?.message) {
        errorMsg = errData.message;
      }

      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in my-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-lg mb-3">
            <TruckIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-50 tracking-tight">PartTrack</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">Automotive Parts Tracking Portal</p>
        </div>

        {/* Login Card */}
        <div className="card p-6 sm:p-8 bg-surface-900/90 border border-surface-800 shadow-dropdown">
          <h2 className="text-lg sm:text-xl font-bold text-surface-100 mb-5">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="input-label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-800 text-center text-xs sm:text-sm text-surface-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign Up with Email
            </Link>
          </div>
        </div>

        {/* Public Lookup Quick Link */}
        <div className="mt-4 p-3 rounded-xl bg-surface-900/60 border border-surface-800 flex items-center justify-between gap-3 text-xs text-surface-400">
          <div className="flex items-center gap-2 truncate">
            <MagnifyingGlassIcon className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="truncate">Need to track without signing in?</span>
          </div>
          <Link
            to="/track"
            className="text-brand-400 hover:text-brand-300 font-medium shrink-0 hover:underline"
          >
            Track Lookup &rarr;
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-surface-500">
          PartTrack &copy; {new Date().getFullYear()} — Secure Automotive Logistics
        </p>
      </div>
    </div>
  );
}
