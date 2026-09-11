import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboard';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  TruckIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon,
  KeyIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
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
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating tracking analytics..." size="lg" />;
  }

  const deliveredCount = stats?.byStatus?.find(s => s.status === 'Delivered')?.count || 0;
  const delayedCount = stats?.byStatus?.find(s => s.status === 'Delayed')?.count || 0;
  const totalRecords = stats?.totalRecords || 0;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">Operations Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            Real-time tracking, volume metrics, and system status
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/lookup" className="btn-secondary btn-sm">
            Quick Lookup
          </Link>
          <Link to="/admin/tracking/new" className="btn-primary btn-sm">
            <PlusIcon className="w-4 h-4" />
            <span>New Shipment</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Shipments"
          value={totalRecords}
          icon={CubeIcon}
          color="brand"
          subtitle="All records in database"
        />
        <StatsCard
          title="Active in Transit"
          value={stats?.activeShipments || 0}
          icon={TruckIcon}
          color="yellow"
          subtitle="Currently moving"
        />
        <StatsCard
          title="Delivered Safely"
          value={deliveredCount}
          icon={CheckCircleIcon}
          color="green"
          subtitle={totalRecords > 0 ? `${Math.round((deliveredCount / totalRecords) * 100)}% completion rate` : '0%'}
        />
        <StatsCard
          title="Delayed / Attention"
          value={delayedCount}
          icon={ExclamationCircleIcon}
          color="red"
          subtitle="Requires attention"
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="card p-4 sm:p-5 bg-surface-900 border border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Quick Operations</span>
          <span className="text-[11px] text-surface-500">Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/tracking/new"
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/40 hover:bg-surface-850 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-200">Create Record</p>
              <p className="text-[10px] text-surface-400">12-digit auto</p>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/40 hover:bg-surface-850 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-200">Manage Users</p>
              <p className="text-[10px] text-surface-400">Assign prefixes</p>
            </div>
          </Link>

          <Link
            to="/api-keys"
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/40 hover:bg-surface-850 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <KeyIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-200">API Keys</p>
              <p className="text-[10px] text-surface-400">Website embed</p>
            </div>
          </Link>

          <Link
            to="/admin/activity"
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/40 hover:bg-surface-850 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-200">Activity Log</p>
              <p className="text-[10px] text-surface-400">Audit trail</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="card p-6 bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-800">
            <div>
              <h2 className="text-base font-bold text-surface-100">Status Distribution</h2>
              <p className="text-xs text-surface-400">Breakdown of all registered shipments</p>
            </div>
            <Link to="/admin/tracking" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.byStatus?.length > 0 ? (
              stats.byStatus.map(({ status, count }) => {
                const percent = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
                return (
                  <div key={status} className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <StatusBadge status={status} />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-200">{count}</span>
                        <span className="text-[11px] text-surface-500">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${Math.max(percent, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={CubeIcon}
                title="No tracking data yet"
                description="Create your first tracking record to start viewing status breakdowns."
                actionLabel="Create First Shipment"
                actionTo="/admin/tracking/new"
              />
            )}
          </div>
        </div>

        {/* Records by User */}
        <div className="card p-6 bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-800">
            <div>
              <h2 className="text-base font-bold text-surface-100">Shipments by User</h2>
              <p className="text-xs text-surface-400">Active assigned technician quotas</p>
            </div>
            <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              Directory &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.byUser?.length > 0 ? (
              stats.byUser.map(({ user_name, count }) => (
                <div key={user_name} className="flex items-center justify-between p-3 rounded-lg bg-surface-950/60 border border-surface-800/80 hover:border-surface-700 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-600/20 text-brand-300 border border-brand-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {user_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-surface-200 truncate">{user_name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-800 text-surface-200 border border-surface-700">
                    {count} {count === 1 ? 'record' : 'records'}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={UsersIcon}
                title="No users with shipments"
                description="Assign tracking records to technicians to view user distributions."
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="card p-6 bg-surface-900 border border-surface-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-800">
          <div>
            <h2 className="text-base font-bold text-surface-100">Live Status Stream</h2>
            <p className="text-xs text-surface-400">Latest updates across all automotive orders</p>
          </div>
          <Link to="/admin/activity" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
            Full Audit Log <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((entry) => (
              <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-surface-950/50 border border-surface-800/80 hover:bg-surface-850/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 text-surface-400 flex items-center justify-center shrink-0">
                    <ClockIcon className="w-4 h-4 text-surface-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-surface-200">{entry.updated_by_name}</span>
                      <span className="text-xs text-surface-500">updated</span>
                      <Link to={`/admin/tracking/${entry.tracking_record_id}`} className="font-mono text-xs font-bold text-brand-400 hover:underline">
                        {entry.tracking_number}
                      </Link>
                      <StatusBadge status={entry.status} size="sm" />
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-surface-400 mt-1 truncate">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-surface-500 font-mono shrink-0 pl-11 sm:pl-0">
                  {entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, h:mm a') : ''}
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              icon={ClockIcon}
              title="No recent activity"
              description="Any status changes made by you or other users will stream here in real time."
            />
          )}
        </div>
      </div>
    </div>
  );
}
