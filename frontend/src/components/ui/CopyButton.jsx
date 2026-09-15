import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CopyButton({
  text,
  title = 'Copy tracking number',
  successMessage = 'Tracking number copied to clipboard',
  className = '',
  iconClassName = 'w-3.5 h-3.5',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!text) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-brand-300 transition-colors focus:outline-none ${className}`}
      title={copied ? 'Copied!' : title}
      aria-label={title}
    >
      {copied ? (
        <CheckIcon className={`${iconClassName} text-emerald-400`} />
      ) : (
        <ClipboardDocumentIcon className={iconClassName} />
      )}
    </button>
  );
}
