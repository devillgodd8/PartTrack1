import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTracking } from '../api/tracking';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftIcon,
  HashtagIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUSES = ['Pending', 'Processing', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delayed', 'Delivered', 'Cancelled', 'On Hold'];
const PART_TYPES = ['Engine', 'Transmission', 'Other'];

export default function CreateTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    part_type: 'Engine',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vin: '',
    part_stock_number: '',
    shipment_origin: '',
    destination: '',
    current_status: 'Pending',
    estimated_delivery_date: '',
    notes: '',
    customer_name: '',
    customer_number: '',
    assigned_user_id: '',
  });

  useEffect(() => {
    if (isAdmin) {
      listUsers().then(data => setUsers(data.users.filter(u => u.is_active))).catch(() => { });
    }
  }, [isAdmin]);

  const selectedUser = isAdmin && form.assigned_user_id
    ? users.find(u => u.id === form.assigned_user_id)
    : user;
  const activePrefix = selectedUser?.tracking_prefix || user?.tracking_prefix || '•••••';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.vin) delete payload.vin;
      if (!payload.estimated_delivery_date) delete payload.estimated_delivery_date;
      payload.customer_name = payload.customer_name?.trim();
      payload.customer_number = payload.customer_number?.trim();
      if (!payload.customer_name) {
        toast.error('Customer name is required');
        setSubmitting(false);
        return;
      }
      if (!payload.customer_number) {
        toast.error('Customer number is required');
        setSubmitting(false);
        return;
      }
      if (!isAdmin || !payload.assigned_user_id) delete payload.assigned_user_id;
      payload.vehicle_year = parseInt(payload.vehicle_year);

      await createTracking(payload);
      toast.success('Tracking record created with 12-digit tracking number!');
      navigate(isAdmin ? '/admin/tracking' : '/dashboard/records');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const backPath = isAdmin ? '/admin/tracking' : '/dashboard/records';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-10">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-surface-800">
        <div>
          <button
            onClick={() => navigate(backPath)}
            className="btn-ghost btn-sm -ml-2 mb-1 text-surface-400 hover:text-surface-200 inline-flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to Shipments</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">Create Tracking Record</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-400">
            Generate a new tracked shipment record with standard 12-digit identifier.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identifier & Initial Status */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <HashtagIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Tracking Identity & Status
              </h2>
              <p className="text-xs text-surface-400">System identifier and initial delivery status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tracking Number Format</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${activePrefix} •••••••`}
                  className="input font-mono bg-surface-950/80 text-brand-400 border-brand-500/30 cursor-not-allowed font-semibold tracking-wider text-sm"
                />
                <span className="absolute right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <SparklesIcon className="w-3 h-3" />
                  12-Digit Auto
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-surface-400 flex items-center gap-1">
                Prefix: <span className="font-mono text-surface-200 font-semibold">{activePrefix}</span> + 7 unique random digits on save.
              </p>
            </div>

            <div>
              <label className="input-label">Initial Status</label>
              <select
                name="current_status"
                value={form.current_status}
                onChange={handleChange}
                className="input"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {isAdmin && (
              <div className="md:col-span-2">
                <label className="input-label">Assign To User / Organization</label>
                <select
                  name="assigned_user_id"
                  value={form.assigned_user_id}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Assign to Myself ({user?.name || user?.email})</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} (Prefix: {u.tracking_prefix})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-surface-400">
                  Assigning to another user will use their 5-digit prefix for the tracking number.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Part Details */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <WrenchScrewdriverIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Part & Component Details
              </h2>
              <p className="text-xs text-surface-400">Specify the auto part category and internal stock identifier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Part Type <span className="text-rose-400">*</span></label>
              <select name="part_type" value={form.part_type} onChange={handleChange} className="input">
                {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Stock / SKU Number <span className="text-rose-400">*</span></label>
              <input
                name="part_stock_number"
                value={form.part_stock_number}
                onChange={handleChange}
                className="input font-mono uppercase"
                placeholder="STK-ENG-2024"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Vehicle Specs */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TruckIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Donor / Target Vehicle
              </h2>
              <p className="text-xs text-surface-400">Vehicle fitment information and optional VIN</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Year <span className="text-rose-400">*</span></label>
              <input
                name="vehicle_year"
                type="number"
                value={form.vehicle_year}
                onChange={handleChange}
                className="input"
                min="1900"
                max={new Date().getFullYear() + 2}
                required
              />
            </div>
            <div>
              <label className="input-label">Make <span className="text-rose-400">*</span></label>
              <input
                name="vehicle_make"
                value={form.vehicle_make}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Ford, Toyota, BMW"
                required
              />
            </div>
            <div>
              <label className="input-label">Model <span className="text-rose-400">*</span></label>
              <input
                name="vehicle_model"
                value={form.vehicle_model}
                onChange={handleChange}
                className="input"
                placeholder="e.g. F-150, Camry, X5"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Vehicle Identification Number (VIN) <span className="text-surface-500 text-xs">(Optional)</span></label>
            <input
              name="vin"
              value={form.vin}
              onChange={handleChange}
              className="input font-mono uppercase"
              placeholder="17-character VIN identifier"
              maxLength={17}
            />
          </div>
        </div>

        {/* Section 4: Route & Dates */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarDaysIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Shipment Logistics & Route
              </h2>
              <p className="text-xs text-surface-400">Dispatch origin, destination facility, and delivery timeline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Shipment Origin <span className="text-rose-400">*</span></label>
              <input
                name="shipment_origin"
                value={form.shipment_origin}
                onChange={handleChange}
                className="input"
                placeholder="City, State or Warehouse Code"
                required
              />
            </div>
            <div>
              <label className="input-label">Final Destination <span className="text-rose-400">*</span></label>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                className="input"
                placeholder="City, State or Customer Address"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Estimated Delivery Date <span className="text-surface-500 text-xs">(Optional)</span></label>
              <input
                name="estimated_delivery_date"
                type="date"
                value={form.estimated_delivery_date}
                onChange={handleChange}
                className="input max-w-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Customer Details */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Customer Information
              </h2>
              <p className="text-xs text-surface-400">Client details associated with this shipment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Customer Name <span className="text-rose-400">*</span></label>
              <div className="relative">
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  className="input pl-9"
                  placeholder="e.g. Acme Motors or John Doe"
                  required
                />
                <UserIcon className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="input-label">Customer Number <span className="text-rose-400">*</span></label>
              <div className="relative">
                <input
                  name="customer_number"
                  value={form.customer_number}
                  onChange={handleChange}
                  className="input pl-9 font-mono"
                  placeholder="e.g. +1 (555) 123-4567 or CST-8921"
                  required
                />
                <PhoneIcon className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Internal Notes */}
        <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-800">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <DocumentTextIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Internal Remarks
              </h2>
              <p className="text-xs text-surface-400">Special handling instructions or packaging notes</p>
            </div>
          </div>

          <div>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="input resize-y text-xs sm:text-sm"
              placeholder="e.g. Fragile palletized cargo, forklift required at pickup..."
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="card p-4 bg-surface-900 border border-surface-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sticky bottom-4 shadow-xl">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Record...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>Generate 12-Digit Tracking</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
