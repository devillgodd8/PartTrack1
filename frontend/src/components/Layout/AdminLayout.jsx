import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChartBarIcon,
  TruckIcon,
  UsersIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', icon: ChartBarIcon, label: 'Dashboard', end: true },
  { to: '/admin/tracking', icon: TruckIcon, label: 'Tracking Records' },
  { to: '/admin/users', icon: UsersIcon, label: 'Manage Users' },
  { to: '/admin/activity', icon: ClockIcon, label: 'Activity Log' },
  { to: '/lookup', icon: MagnifyingGlassIcon, label: 'Track Lookup' },
  { to: '/api-keys', icon: KeyIcon, label: 'API Keys' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-surface-900/95 backdrop-blur-md border-b border-surface-800">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow">
              <TruckIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-surface-50 tracking-tight">PartTrack</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user?.tracking_prefix && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-brand-500/10 text-brand-300 border border-brand-500/20">
              Prefix: {user.tracking_prefix}
            </span>
          )}
          <Link to="/admin/tracking/new" className="btn-primary btn-sm">
            <PlusIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span>
          </Link>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-surface-900 border-r border-surface-800 p-5 flex flex-col justify-between animate-slide-up shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow">
                    <TruckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-surface-50">PartTrack</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
                      <ShieldCheckIcon className="w-3 h-3" /> Admin Panel
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Mobile Drawer User Footer */}
            <div className="pt-4 border-t border-surface-800">
              <div className="flex items-center gap-3 px-3 py-2 bg-surface-950/60 rounded-lg border border-surface-800 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-600/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-surface-200 truncate">{user?.name}</p>
                  <p className="text-[11px] text-surface-400 font-mono truncate">
                    Prefix: {user?.tracking_prefix || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger w-full btn-sm"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar (Permanent) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-surface-900 border-r border-surface-800 flex-col z-30">
          {/* Logo Brand Header */}
          <div className="px-6 py-5 border-b border-surface-800">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow">
                <TruckIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-surface-50 tracking-tight">PartTrack</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
                  <ShieldCheckIcon className="w-3 h-3" /> Admin Panel
                </span>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop User Footer */}
          <div className="p-3.5 border-t border-surface-800">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-950/70 rounded-xl border border-surface-800 mb-2">
              <div className="w-9 h-9 rounded-full bg-brand-600/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-surface-400 font-mono truncate">
                  Prefix: <span className="text-brand-400 font-semibold">{user?.tracking_prefix || '—'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-surface-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Desktop Top Sub-header */}
          <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-surface-900/60 border-b border-surface-800/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-2 text-xs text-surface-400 font-medium">
              <span className="text-surface-500">PartTrack Admin</span>
              <span>/</span>
              <span className="text-surface-200 capitalize">
                {location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-surface-400 bg-surface-950 px-2.5 py-1 rounded-md border border-surface-800">
                User Prefix: <strong className="text-brand-400">{user?.tracking_prefix}</strong>
              </span>
              <Link to="/admin/tracking/new" className="btn-primary btn-sm">
                <PlusIcon className="w-3.5 h-3.5" />
                <span>New Record</span>
              </Link>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="px-6 py-4 border-t border-surface-800/60 text-center text-xs text-surface-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>PartTrack &copy; {new Date().getFullYear()} — Automotive Parts Logistics</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
