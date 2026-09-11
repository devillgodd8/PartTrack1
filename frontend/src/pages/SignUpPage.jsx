import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  TruckIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { setUser } = useAuth();
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

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup/request-otp', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success('Verification code sent to your email!');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setUser(data.user);
      toast.success(`Welcome to PartTrack, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    try {
      await api.post('/auth/signup/request-otp', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success('New verification code sent!');
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
            Account Info
          </div>
          <span className="text-surface-600">&rarr;</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${step === 2 ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30' : 'bg-surface-900 text-surface-400'}`}>
            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">2</span>
            Email Verification
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 bg-surface-900/90 border border-surface-800 shadow-dropdown">
          {step === 1 ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-surface-100 mb-1">Create an account</h2>
              <p className="text-xs text-surface-400 mb-5">Each account receives a unique 5-digit tracking prefix</p>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="name" className="input-label">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input pl-11"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                </div>

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
                  <label htmlFor="password" className="input-label">Password</label>
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
                  <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-11 pr-11"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-950 border border-surface-800 text-[11px] text-surface-400 flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>A 6-digit verification code will be sent to your email to verify account ownership.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    'Continue with Email Verification'
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
                <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to details
              </button>

              <h2 className="text-lg sm:text-xl font-bold text-surface-100 mb-1">Enter Verification Code</h2>
              <p className="text-xs text-surface-400 mb-5">
                We sent a 6-digit code to <strong className="text-brand-300 font-mono">{email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying & Activating...
                    </>
                  ) : (
                    'Verify & Create Account'
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
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign In
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
