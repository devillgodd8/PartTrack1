import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTracking, updateStatus, deleteTracking } from '../api/tracking';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowRightIcon,
  IdentificationIcon,
  CubeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Pending', 'Processing', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delayed', 'Delivered', 'Cancelled', 'On Hold'];

export default function TrackingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'admin';
  const backPath = isAdmin ? '/admin/tracking' : '/dashboard/records';

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const data = await getTracking(id);
      setRecord(data.record);
      setHistory(data.history || []);
    } catch (err) {
      toast.error('Failed to load record');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = () => {
    if (!record?.tracking_number) return;
    navigator.clipboard.writeText(record.tracking_number);
    setCopied(true);
    toast.success('Tracking number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusForm.status) {
      toast.error('Please select a status');
      return;
    }
    setSubmitting(true);
    try {
      await updateStatus(id, statusForm);
      toast.success('Status updated successfully');
      setShowStatusForm(false);
      setStatusForm({ status: '', notes: '' });
      fetchRecord();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTracking(id);
      toast.success('Record deleted');
      navigate(backPath);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving shipment details..." />;
  }

  if (!record) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Back + Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-surface-800">
        <Link
          to={backPath}
          className="btn-ghost btn-sm -ml-2 text-surface-400 hover:text-surface-200 inline-flex items-center gap-1.5 self-start"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Records</span>
        </Link>
        {isAdmin && (
          <button
            onClick={() => setDeleteModal(true)}
            className="btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10 self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete Shipment</span>
          </button>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-surface-400">
                12-Digit Shipment Code
              </span>
              <button
                onClick={copyTracking}
                className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium px-1.5 py-0.5 rounded hover:bg-brand-500/10 transition-colors"
                title="Copy tracking number"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-surface-50 mt-1">
              {record.tracking_number}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-surface-300">
              {record.vehicle_year} {record.vehicle_make} {record.vehicle_model} &bull; <strong className="text-brand-300 font-medium">{record.part_type}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
            <StatusBadge status={record.current_status} size="lg" />
            <p className="text-xs text-surface-500 font-mono">
              Last updated: {record.last_updated ? format(new Date(record.last_updated), 'MMM d, yyyy h:mm a') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Route Visualization Graphic */}
        <div className="mt-6 pt-5 border-t border-surface-800 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-surface-950/60 p-4 rounded-xl border border-surface-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <MapPinIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-surface-400 font-semibold">Origin Dispatch</p>
              <p className="text-sm font-medium text-surface-100">{record.shipment_origin || 'Not specified'}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-2 text-surface-600">
            <div className="h-px flex-1 bg-surface-700/60" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-800 text-[11px] text-surface-300 border border-surface-700">
              <TruckIcon className="w-3.5 h-3.5 text-brand-400" />
              <span>In Route</span>
            </div>
            <div className="h-px flex-1 bg-surface-700/60" />
          </div>

          <div className="flex items-center gap-3 sm:justify-end">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPinIcon className="w-4 h-4" />
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] uppercase tracking-wider text-surface-400 font-semibold">Final Destination</p>
              <p className="text-sm font-medium text-surface-100">{record.destination || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment Specs & Update Control */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
            <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider pb-3 border-b border-surface-800">
              Shipment Specifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={CubeIcon} label="Part Category" value={record.part_type} />
              <InfoItem icon={IdentificationIcon} label="Stock / SKU #" value={record.part_stock_number} mono />
              <InfoItem icon={TruckIcon} label="Vehicle Fitment" value={`${record.vehicle_year} ${record.vehicle_make} ${record.vehicle_model}`} />
              <InfoItem icon={IdentificationIcon} label="VIN Number" value={record.vin || 'Not Registered'} mono />
              <InfoItem
                icon={CalendarIcon}
                label="Estimated Delivery"
                value={record.estimated_delivery_date ? format(new Date(record.estimated_delivery_date), 'MMMM d, yyyy') : 'Pending Schedule'}
              />
              <InfoItem icon={UserIcon} label="Assigned Account" value={record.assigned_user_name || 'N/A'} />
              <InfoItem icon={UserIcon} label="Record Creator" value={record.created_by_name || 'System Admin'} />
              <InfoItem icon={ClockIcon} label="Creation Timestamp" value={record.date_created ? format(new Date(record.date_created), 'MMM d, yyyy h:mm a') : 'N/A'} mono />
            </div>

            {record.notes && (
              <div className="mt-4 pt-4 border-t border-surface-800">
                <div className="flex items-center gap-1.5 text-xs text-surface-400 mb-1.5">
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  <span className="font-semibold uppercase tracking-wider">Internal Remarks & Notes</span>
                </div>
                <p className="text-sm text-surface-200 bg-surface-950/60 p-3.5 rounded-lg border border-surface-800">
                  {record.notes}
                </p>
              </div>
            )}
          </div>

          {/* Update Status Card */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                  Update Delivery Status
                </h2>
                <p className="text-xs text-surface-400 mt-0.5">Append a milestone event to the tracking ledger</p>
              </div>
              {!showStatusForm && (
                <button
                  onClick={() => setShowStatusForm(true)}
                  className="btn-primary btn-sm inline-flex items-center gap-1.5"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              )}
            </div>

            {showStatusForm ? (
              <form onSubmit={handleStatusUpdate} className="space-y-4 pt-2 border-t border-surface-800 animate-slide-down">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">New Status Event <span className="text-rose-400">*</span></label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm(f => ({ ...f, status: e.target.value }))}
                      className="input text-xs sm:text-sm"
                      required
                    >
                      <option value="">Select event status...</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Event Remarks / Location Note (optional)</label>
                  <textarea
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm(f => ({ ...f, notes: e.target.value }))}
                    className="input min-h-[70px] resize-y text-xs sm:text-sm"
                    placeholder="e.g. Scanned at regional sorting facility in Nashville, TN..."
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                    {submitting ? 'Updating Ledger...' : 'Commit Status Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStatusForm(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-surface-500 pt-1">
                Current status is locked at <strong className="text-surface-300">{record.current_status}</strong>. Click "Update Status" to log a new shipment event.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 h-fit space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-800">
            <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
              Status Event Ledger
            </h2>
            <span className="text-xs text-surface-400 font-mono font-medium">
              {history.length} {history.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {history.length > 0 ? (
            <div className="space-y-0 pt-2">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-7 pb-6 last:pb-2">
                  {/* Timeline connector line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[9px] top-3.5 bottom-0 w-px bg-surface-800" />
                  )}

                  {/* Timeline node icon */}
                  <div
                    className={`absolute left-0 top-1 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center ${
                      index === 0
                        ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                        : 'border-surface-700 bg-surface-800 text-surface-500'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-brand-400 animate-pulse' : 'bg-surface-600'}`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} size="sm" />
                      {index === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 font-mono">
                      {entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, yyyy • h:mm a') : '—'}
                    </p>
                    <p className="text-[11px] text-surface-500">
                      Logged by: <span className="text-surface-300 font-medium">{entry.updated_by_name || 'Admin'}</span>
                    </p>
                    {entry.notes && (
                      <div className="mt-1.5 text-xs text-surface-300 bg-surface-950/80 rounded-lg p-2.5 border border-surface-800">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-surface-500 py-4 text-center">No status history events logged.</p>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Tracking Record"
        message={`Are you sure you want to delete shipment #${record.tracking_number}? All status milestones and logs will be permanently deleted.`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono }) {
  return (
    <div className="p-3 bg-surface-950/40 rounded-lg border border-surface-800/60 space-y-1">
      <div className="flex items-center gap-1.5 text-surface-400">
        {Icon && <Icon className="w-3.5 h-3.5 text-surface-500" />}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{label}</span>
      </div>
      <p className={`text-sm text-surface-100 font-medium ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
