import { useState } from 'react';
import { lookupTracking } from '../api/tracking';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  CubeIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TrackLookup() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) {
      toast.error('Please enter a 12-digit tracking number');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await lookupTracking(cleanNum);
      setResult(data);
    } catch (err) {
      setResult(null);
      if (err.response?.status === 404) {
        toast.error('No shipment record found for that tracking number');
      } else {
        toast.error(err.response?.data?.error || 'Tracking lookup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTrackingNumber('');
    setResult(null);
    setSearched(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12 px-4 sm:px-0">
      {/* Header Banner */}
      <div className="text-center pt-2 sm:pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-3 shadow-inner">
          <TruckIcon className="w-7 h-7 text-brand-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
          Public Shipment Tracking
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-surface-400 max-w-md mx-auto">
          Enter your 12-digit tracking code to view verified live transit milestones and delivery estimates.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="card p-4 sm:p-5 bg-surface-900 border border-surface-800 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 573978943296 (12 digits)"
              className="input pl-11 pr-10 text-sm sm:text-base font-mono tracking-wider py-3"
              autoFocus
            />
            {trackingNumber && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 px-6 text-sm font-semibold shrink-0 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Track Shipment</span>
            )}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[11px] text-surface-400 pt-3 border-t border-surface-800/80">
          <span className="flex items-center gap-1">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            Verified real-time ledger tracking
          </span>
          <span className="font-mono text-surface-400">12 numeric digits</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && <LoadingSpinner text="Locating shipment in database..." />}

      {/* Lookup Results */}
      {!loading && searched && result && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Status Hero Card */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-800">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-surface-400 font-semibold">
                  Tracking Code
                </p>
                <h2 className="text-2xl font-bold font-mono text-brand-400 tracking-wider mt-0.5">
                  {result.record.tracking_number}
                </h2>
              </div>
              <div className="self-start sm:self-auto">
                <StatusBadge status={result.record.current_status} size="lg" />
              </div>
            </div>

            {/* Route graphic */}
            <div className="bg-surface-950/60 p-4 rounded-xl border border-surface-800/80 grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                  <MapPinIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Origin</p>
                  <p className="text-sm font-medium text-surface-100">{result.record.shipment_origin || 'Origin Terminal'}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-center gap-2 text-surface-600">
                <div className="h-px flex-1 bg-surface-800" />
                <ArrowRightIcon className="w-4 h-4 text-surface-500" />
                <div className="h-px flex-1 bg-surface-800" />
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPinIcon className="w-4 h-4" />
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Destination</p>
                  <p className="text-sm font-medium text-surface-100">{result.record.destination || 'Delivery Location'}</p>
                </div>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-surface-950/40 rounded-lg border border-surface-800/60">
                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Part Item</p>
                <p className="text-xs sm:text-sm font-medium text-surface-100 mt-0.5">{result.record.part_type}</p>
              </div>
              <div className="p-3 bg-surface-950/40 rounded-lg border border-surface-800/60">
                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Vehicle Fitment</p>
                <p className="text-xs sm:text-sm font-medium text-surface-100 mt-0.5">
                  {result.record.vehicle_year} {result.record.vehicle_make} {result.record.vehicle_model}
                </p>
              </div>
              <div className="p-3 bg-surface-950/40 rounded-lg border border-surface-800/60 col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Estimated Delivery</p>
                <p className="text-xs sm:text-sm font-medium text-surface-100 mt-0.5">
                  {result.record.estimated_delivery_date
                    ? format(new Date(result.record.estimated_delivery_date), 'MMM d, yyyy')
                    : 'In Transit'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-800">
              <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Transit Activity History
              </h3>
              <span className="text-xs text-surface-400 font-mono">
                {result.history?.length || 0} milestones
              </span>
            </div>

            {result.history && result.history.length > 0 ? (
              <div className="space-y-0 pt-1">
                {result.history.map((entry, index) => (
                  <div key={entry.id} className="relative pl-7 pb-6 last:pb-1">
                    {index < result.history.length - 1 && (
                      <div className="absolute left-[9px] top-3.5 bottom-0 w-px bg-surface-800" />
                    )}
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
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-400 font-mono">
                        {entry.updated_at ? format(new Date(entry.updated_at), 'MMMM d, yyyy • h:mm a') : '—'}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-surface-300 bg-surface-950/80 rounded-lg p-2.5 border border-surface-800">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-500 text-center py-4">No milestone history available.</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State when searched and nothing returned */}
      {!loading && searched && !result && (
        <EmptyState
          icon={ExclamationCircleIcon}
          title="Tracking Record Not Found"
          description={`No shipment was located matching "${trackingNumber}". Please check that you entered all 12 digits correctly.`}
          actionLabel="Try Another Number"
          onAction={handleClear}
        />
      )}
    </div>
  );
}
