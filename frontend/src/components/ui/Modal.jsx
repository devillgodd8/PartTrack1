import { useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  maxWidth = 'max-w-md',
  showConfirm = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const btnClass = variant === 'danger'
    ? 'btn-danger'
    : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className={`relative card bg-surface-900 border border-surface-800 p-6 ${maxWidth} w-full animate-scale-in shadow-dropdown z-10 my-auto`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-400 hover:text-surface-200 p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
          )}
          {variant === 'info' && (
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0">
              <InformationCircleIcon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-surface-100 leading-snug">
              {title}
            </h3>
            {message && (
              <p className="mt-2 text-sm text-surface-400 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 pt-4 border-t border-surface-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-sm"
          >
            {cancelText}
          </button>
          {showConfirm && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`${btnClass} btn-sm`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
