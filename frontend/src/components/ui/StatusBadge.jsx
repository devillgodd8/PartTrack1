const STATUS_CONFIG = {
  'Pending':          { bg: 'bg-surface-800/80', text: 'text-surface-300', border: 'border-surface-700', dot: 'bg-surface-400' },
  'Processing':       { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30', dot: 'bg-sky-400 animate-pulse' },
  'Picked Up':        { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30', dot: 'bg-indigo-400' },
  'In Transit':       { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400 animate-pulse' },
  'Out for Delivery': { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30', dot: 'bg-blue-400 animate-pulse' },
  'Delayed':          { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  'Delivered':        { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  'Cancelled':        { bg: 'bg-surface-800', text: 'text-surface-400', border: 'border-surface-700', dot: 'bg-surface-500' },
  'On Hold':          { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const sizeClass = size === 'lg'
    ? 'px-3.5 py-1 text-sm font-semibold'
    : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass} tracking-wide select-none`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{status}</span>
    </span>
  );
}
