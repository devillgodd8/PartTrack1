import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title = 'No items found',
  description = 'There are currently no records to display.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="card p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-fade-in my-2">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 mb-4 shadow-subtle">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-surface-100 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-surface-400 max-w-sm mx-auto leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && (
        actionTo ? (
          <Link to={actionTo} className="btn-primary btn-sm">
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button type="button" onClick={onAction} className="btn-primary btn-sm">
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
}
