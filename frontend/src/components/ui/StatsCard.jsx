export default function StatsCard({ title, value, icon: Icon, trend, color = 'brand', subtitle }) {
  const colorMap = {
    brand: {
      border: 'border-brand-500/30 hover:border-brand-500/50',
      iconBg: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
      glow: 'shadow-glow/20',
    },
    green: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: '',
    },
    yellow: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: '',
    },
    red: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      glow: '',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      glow: '',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div className={`card p-5 bg-surface-900/90 border ${scheme.border} transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
            {value}
          </p>
          {(trend || subtitle) && (
            <p className="mt-1.5 text-xs text-surface-400 flex items-center gap-1.5">
              {trend && <span className="font-medium text-emerald-400">{trend}</span>}
              {subtitle && <span>{subtitle}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
