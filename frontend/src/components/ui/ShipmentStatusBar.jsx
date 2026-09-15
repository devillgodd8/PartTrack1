import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  CheckIcon,
  ClockIcon,
  ArchiveBoxIcon,
  TruckIcon,
  PaperAirplaneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const MILESTONES = [
  { key: 'Processing', label: 'Processing', icon: ClockIcon },
  { key: 'Pickup', label: 'Pickup', icon: ArchiveBoxIcon },
  { key: 'In Transit', label: 'In Transit', icon: TruckIcon },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: PaperAirplaneIcon },
  { key: 'Delivered', label: 'Delivered', icon: MapPinIcon },
];

/**
 * Maps any system status to one of the 5 canonical milestone indices:
 * 0: Processing
 * 1: Pickup
 * 2: In Transit
 * 3: Out for Delivery
 * 4: Delivered
 */
function getActiveStepIndex(status) {
  if (!status) return 0;
  const s = status.trim().toLowerCase();
  if (s === 'delivered') return 4;
  if (s === 'out for delivery') return 3;
  if (s === 'in transit' || s === 'delayed' || s === 'on hold') return 2;
  if (s === 'picked up' || s === 'pickup') return 1;
  return 0; // 'pending', 'processing', or any initial state
}

function formatMilestoneDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return format(d, 'MMM d, yyyy • h:mm a');
  } catch {
    return null;
  }
}

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return format(d, 'MMM d, h:mm a');
  } catch {
    return null;
  }
}

export default function ShipmentStatusBar({ record, history = [] }) {
  const currentStatus = record?.current_status || 'Pending';
  const activeStep = getActiveStepIndex(currentStatus);
  const isDelivered = activeStep === 4;

  // Extract milestone dates from history & record
  const milestoneData = useMemo(() => {
    const data = {
      0: { date: null, notes: 'Order confirmed & recorded' },
      1: { date: null, notes: record?.shipment_origin || 'Origin Facility' },
      2: { date: null, notes: 'In carrier network' },
      3: { date: null, notes: 'Local courier dispatch' },
      4: { date: null, notes: record?.destination || 'Destination Address' },
    };

    // 0: Processing date defaults to date_created
    if (record?.date_created) {
      data[0].date = record.date_created;
    }

    // Inspect status history (newest to oldest or vice versa)
    if (Array.isArray(history)) {
      history.forEach((h) => {
        const s = (h.status || '').trim().toLowerCase();
        if (s === 'delivered' && !data[4].date) {
          data[4].date = h.updated_at;
          if (h.notes) data[4].notes = h.notes;
        } else if (s === 'out for delivery' && !data[3].date) {
          data[3].date = h.updated_at;
          if (h.notes) data[3].notes = h.notes;
        } else if ((s === 'in transit' || s === 'delayed' || s === 'on hold') && !data[2].date) {
          data[2].date = h.updated_at;
          if (h.notes) data[2].notes = h.notes;
        } else if ((s === 'picked up' || s === 'pickup') && !data[1].date) {
          data[1].date = h.updated_at;
          if (h.notes) data[1].notes = h.notes;
        } else if ((s === 'processing' || s === 'pending') && (!data[0].date || h.updated_at)) {
          data[0].date = h.updated_at || data[0].date;
          if (h.notes) data[0].notes = h.notes;
        }
      });
    }

    // If not delivered yet, 4 (Delivered) displays estimated delivery date if set
    if (!data[4].date && record?.estimated_delivery_date) {
      data[4].estimated = record.estimated_delivery_date;
    }

    return data;
  }, [record, history]);

  // Compute progress percentage for connecting bar: 0%, 25%, 50%, 75%, 100%
  const progressPercent = activeStep === 0 ? 5 : (activeStep / 4) * 100;

  return (
    <div className="w-full bg-surface-900/90 border border-surface-800/90 rounded-2xl p-4 sm:p-7 shadow-sm">
      {/* Header Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-surface-800/80">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-surface-400">
            Current Shipment State
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-surface-100">
              {isDelivered ? 'Shipment Delivered' : MILESTONES[activeStep]?.label || currentStatus}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-brand-400 animate-pulse'}`} />
              Step {activeStep + 1} of 5
            </span>
          </div>
        </div>

        {record?.estimated_delivery_date && (
          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-surface-400">
              {isDelivered ? 'Delivered On' : 'Estimated Delivery'}
            </span>
            <p className="text-sm font-semibold font-mono text-brand-300 mt-0.5">
              {format(new Date(record.estimated_delivery_date), 'EEE, MMM d, yyyy')}
            </p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Progress Stepper Bar */}
      <div className="hidden sm:block">
        <div className="relative mb-8 px-4">
          {/* Base Track */}
          <div className="absolute left-6 right-6 top-5 h-1 bg-surface-800 rounded-full" />

          {/* Active Fill Track */}
          <div
            className="absolute left-6 top-5 h-1 bg-gradient-to-r from-emerald-500 via-brand-500 to-brand-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `calc(${progressPercent}% * 0.92)` }}
          />

          {/* 5 Milestone Points */}
          <div className="relative flex justify-between items-start">
            {MILESTONES.map((milestone, idx) => {
              const isPast = idx < activeStep;
              const isCurrent = idx === activeStep;
              const isFuture = idx > activeStep;
              const pointInfo = milestoneData[idx];
              const IconComponent = milestone.icon;

              return (
                <div key={milestone.key} className="flex flex-col items-center text-center flex-1 max-w-[18%]">
                  {/* Circle Icon Node */}
                  <div className="relative mb-3.5">
                    {isCurrent && (
                      <span className="absolute -inset-1.5 rounded-full bg-brand-500/25 animate-ping opacity-75 pointer-events-none" />
                    )}

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                        isPast
                          ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : isCurrent
                          ? isDelivered
                            ? 'bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                            : 'bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-[0_0_14px_rgba(59,130,246,0.35)]'
                          : 'bg-surface-800 border-2 border-surface-700 text-surface-400'
                      }`}
                    >
                      {isPast || (isCurrent && isDelivered) ? (
                        <CheckIcon className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <IconComponent className={`w-5 h-5 ${isCurrent ? 'stroke-[2.2]' : 'stroke-2'}`} />
                      )}
                    </div>
                  </div>

                  {/* Milestone Label */}
                  <p
                    className={`text-xs font-semibold tracking-tight transition-colors ${
                      isPast || isCurrent ? 'text-surface-100' : 'text-surface-400'
                    }`}
                  >
                    {milestone.label}
                  </p>

                  {/* Timestamp / Details */}
                  <div className="mt-1 min-h-[32px] flex flex-col justify-start">
                    {pointInfo?.date ? (
                      <span className="text-[11px] font-mono text-surface-400 leading-tight">
                        {formatShortDate(pointInfo.date)}
                      </span>
                    ) : pointInfo?.estimated ? (
                      <span className="text-[11px] font-mono text-brand-400/90 leading-tight">
                        Est: {format(new Date(pointInfo.estimated), 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-surface-400 italic">
                        {isFuture ? 'Pending' : 'Completed'}
                      </span>
                    )}

                    <span className="text-[10px] text-surface-400 truncate max-w-[120px] mt-0.5">
                      {pointInfo?.notes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Stepper (Clean vertical stack for small screens) */}
      <div className="sm:hidden space-y-4">
        {MILESTONES.map((milestone, idx) => {
          const isPast = idx < activeStep;
          const isCurrent = idx === activeStep;
          const pointInfo = milestoneData[idx];
          const IconComponent = milestone.icon;

          return (
            <div key={milestone.key} className="relative flex items-start gap-3.5">
              {/* Vertical connector line */}
              {idx < MILESTONES.length - 1 && (
                <div
                  className={`absolute left-[17px] top-9 bottom-[-16px] w-0.5 ${
                    isPast ? 'bg-emerald-500/80' : 'bg-surface-800'
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center relative z-10 ${
                  isPast
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? isDelivered
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-brand-600 text-white ring-4 ring-brand-500/20'
                    : 'bg-surface-800 border border-surface-700 text-surface-400'
                }`}
              >
                {isPast || (isCurrent && isDelivered) ? (
                  <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 pt-0.5 pb-2">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-semibold ${
                      isPast || isCurrent ? 'text-surface-100' : 'text-surface-400'
                    }`}
                  >
                    {milestone.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      Active Stage
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-baseline justify-between text-xs text-surface-400">
                  <span className="truncate pr-2">{pointInfo?.notes}</span>
                  <span className="font-mono shrink-0 text-surface-400">
                    {pointInfo?.date
                      ? formatMilestoneDate(pointInfo.date)
                      : pointInfo?.estimated
                      ? `Est: ${format(new Date(pointInfo.estimated), 'MMM d, yyyy')}`
                      : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
