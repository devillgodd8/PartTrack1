import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CopyButton from '../../components/ui/CopyButton';
import {
  TruckIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  ArrowRightIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your shipments..." size="lg" />;
  }

  const deliveredCount = stats?.byStatus?.find(s => s.status === 'Delivered')?.count || 0;
  const delayedCount = stats?.byStatus?.find(s => s.status === 'Delayed')?.count || 0;
  const totalRecords = stats?.totalRecords || 0;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Banner with User Prefix */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">My Workspace</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            Shipment tracking and logistics overview for <span className="font-semibold text-surface-200">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {user?.tracking_prefix && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 border border-brand-500/30 text-xs font-mono">
              <HashtagIcon className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-surface-400">Prefix:</span>
              <strong className="text-brand-300 font-bold">{user.tracking_prefix}</strong>
            </div>
          )}
          <Link to="/dashboard/records/new" className="btn-primary btn-sm">
            <PlusIcon className="w-4 h-4" />
            <span>New Record</span>
          </Link>
        </div>
      </div>

      {/* User Prefix Info Card */}
      {user?.tracking_prefix && (
        <div className="card p-4 bg-gradient-to-r from-brand-950/40 via-surface-900 to-surface-900 border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0">
              <HashtagIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-surface-100">Your Fixed 5-Digit Tracking Prefix: <span className="font-mono text-brand-400 text-sm">{user.tracking_prefix}</span></p>
              <p className="text-[11px] text-surface-400">All shipments created under your account start with <code className="font-mono text-brand-300">{user.tracking_prefix}</code> followed by 7 unique digits (12 total).</p>
            </div>
          </div>
          <Link to="/dashboard/records/new" className="text-xs text-brand-400 hover:text-brand-300 font-semibold shrink-0 hover:underline">
            Generate 12-Digit &rarr;
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Total Records" value={totalRecords} icon={CubeIcon} color="brand" subtitle="All your records" />
        <StatsCard title="Active In Transit" value={stats?.activeShipments || 0} icon={TruckIcon} color="yellow" subtitle="On the road" />
        <StatsCard title="Delivered" value={deliveredCount} icon={CheckCircleIcon} color="green" subtitle="Completed" />
        <StatsCard title="Delayed" value={delayedCount} icon={ExclamationCircleIcon} color="red" subtitle="Needs review" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/dashboard/records/new"
          className="card p-4 bg-surface-900 border border-surface-800 hover:border-brand-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <PlusIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-100">Create Tracking Record</p>
            <p className="text-[10px] text-surface-400">Auto 12-digit number</p>
          </div>
        </Link>

        <Link
          to="/lookup"
          className="card p-4 bg-surface-900 border border-surface-800 hover:border-brand-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-100">Track a Shipment</p>
            <p className="text-[10px] text-surface-400">Search by 12-digit code</p>
          </div>
        </Link>

        <Link
          to="/api-keys"
          className="card p-4 bg-surface-900 border border-surface-800 hover:border-brand-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <KeyIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-100">Website API Keys</p>
            <p className="text-[10px] text-surface-400">Embed on WordPress & web</p>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="card p-6 bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-800">
            <div>
              <h2 className="text-base font-bold text-surface-100">My Records by Status</h2>
              <p className="text-xs text-surface-400">Distribution across active statuses</p>
            </div>
            <Link to="/dashboard/records" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.byStatus?.length > 0 ? (
              stats.byStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-surface-950/60 border border-surface-800/80">
                  <StatusBadge status={status} />
                  <span className="text-xs font-semibold text-surface-200">{count}</span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CubeIcon}
                title="No records created yet"
                description="Create your first tracking record to start monitoring shipments."
                actionLabel="Create Record"
                actionTo="/dashboard/records/new"
              />
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-800">
            <div>
              <h2 className="text-base font-bold text-surface-100">Recent Status Updates</h2>
              <p className="text-xs text-surface-400">Latest progress updates on your parts</p>
            </div>
            <Link to="/dashboard/records" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              All Records <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-950/50 border border-surface-800/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-800 text-surface-400 flex items-center justify-center shrink-0">
                      <ClockIcon className="w-4 h-4 text-surface-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-brand-400">{entry.tracking_number}</span>
                        <CopyButton text={entry.tracking_number} title="Copy tracking number" />
                        <StatusBadge status={entry.status} size="sm" />
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-surface-400 mt-1 truncate">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-surface-500 font-mono shrink-0">
                    {entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, h:mm a') : ''}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ClockIcon}
                title="No activity recorded"
                description="Status changes for your shipments will appear here."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
