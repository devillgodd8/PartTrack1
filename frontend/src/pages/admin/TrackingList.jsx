import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listTracking, deleteTracking } from '../../api/tracking';
import { listUsers } from '../../api/users';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  TruckIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Pending', 'Processing', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delayed', 'Delivered', 'Cancelled', 'On Hold'];
const PART_TYPES = ['Engine', 'Transmission', 'Other'];

export default function TrackingList() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', part_type: '', assigned_user_id: '', date_from: '', date_to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, record: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const data = await listUsers();
      setUsers(data.users);
    } catch {}
  };

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.q = search;
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });
      const data = await listTracking(params);
      setRecords(data.records);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load tracking records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const resetFilters = () => {
    setFilters({ status: '', part_type: '', assigned_user_id: '', date_from: '', date_to: '' });
    setSearch('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  const handleDelete = async () => {
    try {
      await deleteTracking(deleteModal.record.id);
      toast.success('Record deleted');
      setDeleteModal({ open: false, record: null });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">Tracking Records</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            {pagination.total || 0} total shipments registered in system
          </p>
        </div>
        <Link to="/admin/tracking/new" className="btn-primary btn-sm self-start sm:self-auto">
          <PlusIcon className="w-4 h-4" />
          <span>New Record</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 bg-surface-900 border border-surface-800">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by 12-digit tracking #, VIN, or stock #..."
                className="input pl-9 text-xs sm:text-sm"
              />
            </div>
            <button type="submit" className="btn-secondary btn-sm shrink-0">
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary btn-sm flex items-center gap-1.5 ${showFilters ? 'border-brand-500 text-brand-300 bg-brand-500/10' : ''}`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="btn-ghost btn-sm text-surface-400 hover:text-surface-200"
                title="Reset all filters"
              >
                <XMarkIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-surface-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-slide-down">
            <div>
              <label className="input-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="input text-xs"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Part Type</label>
              <select
                value={filters.part_type}
                onChange={(e) => setFilters(f => ({ ...f, part_type: e.target.value }))}
                className="input text-xs"
              >
                <option value="">All Types</option>
                {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Assigned User</label>
              <select
                value={filters.assigned_user_id}
                onChange={(e) => setFilters(f => ({ ...f, assigned_user_id: e.target.value }))}
                className="input text-xs"
              >
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="input-label">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="input text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Mobile Cards & Desktop Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving tracking records..." />
      ) : records.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title="No tracking records found"
          description={activeFilterCount > 0 ? "No records match your active search and filter criteria." : "No shipment records created yet."}
          actionLabel={activeFilterCount > 0 ? "Clear Filters" : "Create New Record"}
          onAction={activeFilterCount > 0 ? resetFilters : null}
          actionTo={activeFilterCount === 0 ? "/admin/tracking/new" : null}
        />
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-3">
            {records.map((record) => (
              <div key={record.id} className="card p-4 bg-surface-900 border border-surface-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/admin/tracking/${record.id}`} className="font-mono font-bold text-sm text-brand-400 hover:underline">
                      {record.tracking_number}
                    </Link>
                    <p className="text-xs text-surface-300 mt-0.5">
                      {record.vehicle_year} {record.vehicle_make} {record.vehicle_model}
                    </p>
                  </div>
                  <StatusBadge status={record.current_status} />
                </div>

                <div className="flex items-center justify-between text-xs text-surface-400 pt-2 border-t border-surface-800">
                  <span>Part: <strong className="text-surface-200">{record.part_type}</strong></span>
                  <span>Assigned: <strong className="text-surface-200">{record.assigned_user_name}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-surface-500 font-mono">
                    {record.date_created ? format(new Date(record.date_created), 'MMM d, yyyy') : ''}
                  </span>
                  <div className="flex gap-2">
                    <Link to={`/admin/tracking/${record.id}`} className="btn-secondary btn-sm py-1 px-2.5">
                      <EyeIcon className="w-3.5 h-3.5" /> View
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ open: true, record })}
                      className="btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10 p-1.5"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Tracking #</th>
                  <th className="table-header">Part</th>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Assigned To</th>
                  <th className="table-header">Created</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {records.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/admin/tracking/${record.id}`} className="font-mono font-semibold text-brand-400 hover:text-brand-300">
                        {record.tracking_number}
                      </Link>
                    </td>
                    <td className="table-cell text-surface-300">{record.part_type}</td>
                    <td className="table-cell text-surface-300">
                      {record.vehicle_year} {record.vehicle_make} {record.vehicle_model}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={record.current_status} />
                    </td>
                    <td className="table-cell text-surface-300">{record.assigned_user_name}</td>
                    <td className="table-cell text-surface-400 text-xs font-mono">
                      {record.date_created ? format(new Date(record.date_created), 'MMM d, yyyy') : ''}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/tracking/${record.id}`} className="btn-ghost btn-sm" title="View details">
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, record })}
                          className="btn-ghost btn-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          title="Delete record"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
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
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => fetchRecords(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, record: null })}
        onConfirm={handleDelete}
        title="Delete Tracking Record"
        message={`Are you sure you want to delete shipment #${deleteModal.record?.tracking_number}? All status history will be permanently deleted.`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
