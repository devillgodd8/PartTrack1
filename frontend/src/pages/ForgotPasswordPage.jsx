import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  TruckIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/request-otp', {
        email: email.trim().toLowerCase(),
      });

      toast.success('Password reset code sent to your email!');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    if (password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      });

      toast.success(data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/request-otp', {
        email: email.trim().toLowerCase(),
      });

      toast.success('New reset code sent to your email!');
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-lg mb-3">
            <TruckIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-50 tracking-tight">PartTrack</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">Automotive Parts Tracking Portal</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step === 1 ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30' : 'bg-surface-900 text-surface-400'}`}>
            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">1</span>
            Request Code
          </div>
          <span className="text-surface-600">&rarr;</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step === 2 ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30' : 'bg-surface-900 text-surface-400'}`}>
            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">2</span>
            New Password
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 bg-surface-900/90 border border-surface-800 shadow-dropdown">
          {step === 1 ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-surface-100 mb-1">Reset Password</h2>
              <p className="text-xs text-surface-400 mb-5">
                Enter your account email and we'll send a 6-digit security code.
              </p>

              <form onSubmit={handleRequestOtp} className="space-y-4">
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

                <div className="p-3 rounded-lg bg-surface-950 border border-surface-800 text-[11px] text-surface-400 flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>A 6-digit verification code will be dispatched to this inbox immediately.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Reset Code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors mb-4"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to email
              </button>

              <h2 className="text-lg sm:text-xl font-bold text-surface-100 mb-1">Set New Password</h2>
              <p className="text-xs text-surface-400 mb-5">
                Code sent to <strong className="text-brand-300 font-mono">{email}</strong>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="input-label text-center">6-Digit Code</label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-2xl tracking-[0.5em] font-mono font-bold text-brand-400 placeholder:text-surface-600 placeholder:tracking-normal py-3"
                    placeholder="••••••"
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-surface-500 text-center mt-2">Code valid for 10 minutes</p>
                </div>

                <div>
                  <label htmlFor="password" className="input-label">New Password</label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-11 pr-11"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="input-label">Confirm New Password</label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-11 pr-11"
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-brand-400 hover:text-brand-300 disabled:text-surface-500 transition-colors"
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't receive code? Resend"}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-surface-800 text-center text-xs sm:text-sm text-surface-400">
            Remember your password?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-surface-500">
          PartTrack &copy; {new Date().getFullYear()} — Secure Automotive Logistics
        </p>
      </div>
    </div>
  );
}
