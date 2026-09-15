import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { lookupTracking } from '../api/tracking';
import ShipmentStatusBar from '../components/ui/ShipmentStatusBar';
import StatusBadge from '../components/ui/StatusBadge';
import CopyButton from '../components/ui/CopyButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PrinterIcon,
  ShareIcon,
  LockClosedIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TrackLookup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(
    searchParams.get('number') || searchParams.get('id') || ''
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  const executeLookup = useCallback(async (numToSearch) => {
    const cleanNum = (numToSearch || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanNum) {
      toast.error('Please enter a valid tracking number');
      return;
    }
    setLoading(true);
    setSearched(true);
    setAuthRequired(false);

    try {
      const data = await lookupTracking(cleanNum);
      setResult(data);
      // Update URL search query without reloading
      setSearchParams({ number: cleanNum }, { replace: true });
    } catch (err) {
      setResult(null);
      if (err.response?.status === 404) {
        toast.error('No shipment record found for that tracking number');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setAuthRequired(true);
      } else {
        toast.error(err.response?.data?.error || 'Unable to retrieve tracking details');
      }
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Handle direct link with ?number= or ?id= query param on initial load
  useEffect(() => {
    const paramNum = searchParams.get('number') || searchParams.get('id');
    if (paramNum && !searched) {
      executeLookup(paramNum);
    }
  }, [searchParams, searched, executeLookup]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    executeLookup(trackingNumber);
  };

  const handleClear = () => {
    setTrackingNumber('');
    setResult(null);
    setSearched(false);
    setAuthRequired(false);
    setSearchParams({}, { replace: true });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/track?number=${encodeURIComponent(result?.record?.tracking_number || trackingNumber)}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      toast.success('Tracking link copied to clipboard');
    } else {
      toast.success('Direct link: ' + url);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in pb-16 px-4 sm:px-6">
      {/* Header Search Hero */}
      <div className="text-center pt-2 sm:pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-3 shadow-inner">
          <TruckIcon className="w-7 h-7 text-brand-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
          Shipment Tracking Portal
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-surface-400 max-w-lg mx-auto">
          Monitor your automotive consignment in real-time with verified carrier milestones and scheduled delivery updates.
        </p>
      </div>

      {/* Modern Search Card */}
      <div className="card p-4 sm:p-5 bg-surface-900/90 border border-surface-800 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter 12-digit tracking number (e.g. 241190101721)"
              className="input pl-11 pr-10 text-sm sm:text-base font-mono tracking-wider py-3 w-full bg-surface-950/80 border-surface-700/80 text-surface-100 placeholder-surface-500 focus:border-brand-500"
              autoFocus
            />
            {trackingNumber && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-200 transition-colors"
                title="Clear input"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !trackingNumber.trim()}
            className="btn-primary py-3 px-7 text-sm font-semibold shrink-0 inline-flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Tracking...</span>
              </>
            ) : (
              <span>Track Shipment</span>
            )}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-surface-400 pt-3 border-t border-surface-800/80 gap-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            Certified end-to-end logistics tracking ledger
          </span>
          <span className="font-mono text-surface-400">12 numeric digits</span>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="py-8">
          <LoadingSpinner text="Retrieving verified tracking record..." />
        </div>
      )}

      {/* 401 / 403 Authentication Notice Card */}
      {!loading && authRequired && (
        <div className="card p-6 sm:p-8 bg-surface-900 border border-surface-800 text-center space-y-4 max-w-xl mx-auto animate-slide-up">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <LockClosedIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-100">Customer Authentication Required</h3>
            <p className="text-xs sm:text-sm text-surface-400 mt-1.5 max-w-md mx-auto">
              This shipment record is protected. Please sign in to your customer or merchant account to view real-time transit details and documentation.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(`/track?number=${trackingNumber}`)}`}
              className="btn-primary py-2.5 px-6 text-sm font-semibold w-full sm:w-auto text-center"
            >
              Sign In to View
            </Link>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary py-2.5 px-5 text-sm w-full sm:w-auto text-center"
            >
              Try Another Number
            </button>
          </div>
        </div>
      )}

      {/* Successful Result View */}
      {!loading && searched && result?.record && (
        <div className="space-y-6 animate-slide-up print:p-0">
          {/* Top Actions & Overview Bar */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 shadow-lg space-y-6">
            {/* Header: Tracking Number, Status, and Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-800">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-surface-400 font-semibold">
                  Tracking Identifier
                </span>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-bold font-mono text-brand-400 tracking-wider">
                    {result.record.tracking_number}
                  </h2>
                  <CopyButton
                    text={result.record.tracking_number}
                    title="Copy tracking code"
                    iconClassName="w-4 h-4"
                    className="bg-surface-800/80 p-1.5 border border-surface-700/80 rounded-lg hover:border-brand-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <StatusBadge status={result.record.current_status} size="lg" />
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn-secondary btn-sm inline-flex items-center gap-1.5 text-xs text-surface-300 print:hidden"
                  title="Copy direct tracking link"
                >
                  <ShareIcon className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-secondary btn-sm inline-flex items-center gap-1.5 text-xs text-surface-300 print:hidden"
                  title="Print shipment report"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Visual Transit Corridor Banner */}
            <div className="bg-surface-950/70 p-4 sm:p-5 rounded-xl border border-surface-800/80 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Origin Facility</span>
                  <p className="text-sm sm:text-base font-semibold text-surface-100">
                    {result.record.shipment_origin || 'Origin Terminal'}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-center justify-center gap-1 text-surface-500">
                <div className="flex items-center gap-2 w-full justify-center">
                  <div className="h-px flex-1 bg-surface-700/80" />
                  <TruckIcon className="w-4 h-4 text-brand-400" />
                  <div className="h-px flex-1 bg-surface-700/80" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-surface-400 font-mono">
                  Transit Route
                </span>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 sm:order-2">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div className="sm:text-right sm:order-1">
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">Destination Address</span>
                  <p className="text-sm sm:text-base font-semibold text-surface-100">
                    {result.record.destination || 'Delivery Destination'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5-POINT CARRIER STATUS PROGRESS BAR */}
            <ShipmentStatusBar record={result.record} history={result.history} />
          </div>

          {/* Detailed Specifications & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Customer Details Card */}
            <div className="card p-5 bg-surface-900 border border-surface-800 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-surface-800">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-surface-200">
                  Customer Information
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Customer Name
                  </span>
                  <p className="text-sm font-medium text-surface-100 mt-0.5">
                    {result.record.customer_name || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Customer Reference #
                  </span>
                  <p className="text-sm font-mono font-medium text-brand-300 mt-0.5">
                    {result.record.customer_number || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Assigned Account
                  </span>
                  <p className="text-xs text-surface-300 mt-0.5">
                    {result.record.assigned_user_name || 'System Auto-Assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle & Part Specifications Card */}
            <div className="card p-5 bg-surface-900 border border-surface-800 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-surface-800">
                <WrenchScrewdriverIcon className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-surface-200">
                  Cargo & Part Specifications
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Part Component
                  </span>
                  <p className="text-sm font-medium text-surface-100 mt-0.5">
                    {result.record.part_type || 'Automotive Component'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Stock / SKU Code
                  </span>
                  <p className="text-xs font-mono text-surface-300 mt-0.5">
                    {result.record.part_stock_number || 'Standard Inventory'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Vehicle Fitment
                  </span>
                  <p className="text-xs text-surface-200 mt-0.5">
                    {result.record.vehicle_year || ''} {result.record.vehicle_make || ''} {result.record.vehicle_model || ''}
                    {!result.record.vehicle_make && 'Not Specified'}
                  </p>
                </div>

                {result.record.vin && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                      Vehicle VIN
                    </span>
                    <p className="text-xs font-mono text-surface-300 mt-0.5">
                      {result.record.vin}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Logistics & Timestamps Card */}
            <div className="card p-5 bg-surface-900 border border-surface-800 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-surface-800">
                <ClockIcon className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-surface-200">
                  Logistics Milestones
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Estimated Delivery
                  </span>
                  <p className="text-sm font-semibold font-mono text-emerald-400 mt-0.5">
                    {result.record.estimated_delivery_date
                      ? format(new Date(result.record.estimated_delivery_date), 'MMM d, yyyy')
                      : 'Scheduled In Transit'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Record Created
                  </span>
                  <p className="text-xs font-mono text-surface-300 mt-0.5">
                    {result.record.date_created
                      ? format(new Date(result.record.date_created), 'MMM d, yyyy • h:mm a')
                      : '—'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                    Last System Update
                  </span>
                  <p className="text-xs font-mono text-surface-300 mt-0.5">
                    {result.record.last_updated
                      ? format(new Date(result.record.last_updated), 'MMM d, yyyy • h:mm a')
                      : '—'}
                  </p>
                </div>

                {result.record.notes && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
                      Shipment Remarks
                    </span>
                    <p className="text-xs text-surface-300 bg-surface-950/60 p-2 rounded border border-surface-800 mt-0.5">
                      {result.record.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Activity & Milestone History Card */}
          <div className="card p-5 sm:p-6 bg-surface-900 border border-surface-800 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-surface-800">
              <div>
                <h3 className="text-sm font-bold text-surface-100 uppercase tracking-wider">
                  Verified Transit History
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  Complete audit log of all carrier checkpoints and dispatch updates.
                </p>
              </div>
              <span className="text-xs text-surface-400 font-mono px-2.5 py-1 rounded bg-surface-800 border border-surface-700">
                {result.history?.length || 0} Events Logged
              </span>
            </div>

            {result.history && result.history.length > 0 ? (
              <div className="space-y-0 pt-2">
                {result.history.map((entry, index) => (
                  <div key={entry.id || index} className="relative pl-7 pb-6 last:pb-1">
                    {/* Vertical connecting line */}
                    {index < result.history.length - 1 && (
                      <div className="absolute left-[9px] top-3.5 bottom-0 w-px bg-surface-800" />
                    )}

                    {/* Node Dot */}
                    <div
                      className={`absolute left-0 top-1 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center ${
                        index === 0
                          ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                          : 'border-surface-700 bg-surface-800 text-surface-500'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          index === 0 ? 'bg-brand-400 animate-pulse' : 'bg-surface-600'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={entry.status} size="sm" />
                        {index === 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                            Most Recent Checkpoint
                          </span>
                        )}
                        <span className="text-xs text-surface-400 font-mono">
                          {entry.updated_at
                            ? format(new Date(entry.updated_at), 'MMMM d, yyyy • h:mm a')
                            : '—'}
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-surface-300 bg-surface-950/80 rounded-lg p-3 border border-surface-800 max-w-2xl">
                          {entry.notes}
                        </p>
                      )}

                      {entry.updated_by_name && (
                        <p className="text-[11px] text-surface-500 font-mono">
                          Recorded by: {entry.updated_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-500 text-center py-6">
                No intermediate milestone events recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State when searched and 404 returned */}
      {!loading && searched && !result && !authRequired && (
        <EmptyState
          icon={ExclamationCircleIcon}
          title="Consignment Not Found"
          description={`We could not locate an active shipment matching "${trackingNumber}". Please verify your 12-digit tracking code and try again.`}
          actionLabel="Try Another Number"
          onAction={handleClear}
        />
      )}
    </div>
  );
}
