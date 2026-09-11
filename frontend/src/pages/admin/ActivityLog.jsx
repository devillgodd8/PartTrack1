import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivityLog } from '../../api/dashboard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  TruckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ActivityLog() {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLog();
  }, []);

  const fetchLog = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getActivityLog({ page, limit: 30 });
      setEntries(data.entries || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error('Failed to load activity audit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">System Activity Log</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            Real-time chronological ledger of all shipment milestones and status transitions
          </p>
        </div>
        <button
          onClick={() => fetchLog(pagination.page || 1)}
          className="btn-secondary btn-sm self-start sm:self-auto inline-flex items-center gap-1.5"
          title="Refresh activity feed"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content: Mobile Cards & Desktop Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving activity ledger entries..." />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No activity records yet"
          description="System activity and shipment status logs will appear here once shipment updates are logged."
        />
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="card p-4 bg-surface-900 border border-surface-800 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/admin/tracking/${entry.tracking_record_id}`}
                      className="font-mono font-bold text-sm text-brand-400 hover:underline"
                    >
                      {entry.tracking_number}
                    </Link>
                    <p className="text-xs text-surface-300 mt-0.5">{entry.part_type}</p>
                  </div>
                  <StatusBadge status={entry.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs text-surface-400 pt-2 border-t border-surface-800">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-surface-500" />
                    <strong className="text-surface-200">{entry.updated_by_name}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-surface-400">
                    <ClockIcon className="w-3.5 h-3.5 text-surface-500" />
                    {entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, h:mm a') : '—'}
                  </span>
                </div>

                {entry.notes && (
                  <p className="text-xs text-surface-300 bg-surface-950/80 p-2 rounded border border-surface-800">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Timestamp</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Tracking #</th>
                  <th className="table-header">Part</th>
                  <th className="table-header">Status Transition</th>
                  <th className="table-header">Notes & Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="table-row">
                    <td className="table-cell text-surface-400 text-xs whitespace-nowrap font-mono">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 text-surface-500" />
                        <span>{entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, yyyy • h:mm a') : '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell font-medium text-surface-200 text-xs">
                      {entry.updated_by_name}
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/admin/tracking/${entry.tracking_record_id}`}
                        className="font-mono font-semibold text-brand-400 hover:text-brand-300"
                      >
                        {entry.tracking_number}
                      </Link>
                    </td>
                    <td className="table-cell text-surface-300 text-xs">
                      {entry.part_type}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={entry.status} size="sm" />
                    </td>
                    <td className="table-cell text-surface-400 text-xs max-w-sm truncate">
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card px-4 py-3 bg-surface-900 border border-surface-800 flex items-center justify-between">
          <p className="text-xs text-surface-400">
            Showing page <strong className="text-surface-200">{pagination.page}</strong> of <strong className="text-surface-200">{pagination.totalPages}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLog(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLog(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
