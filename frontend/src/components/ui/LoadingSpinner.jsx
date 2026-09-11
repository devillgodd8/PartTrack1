export default function LoadingSpinner({ text = 'Loading data...', size = 'md' }) {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      <div
        className={`${sizeMap[size] || sizeMap.md} border-brand-500 border-t-transparent rounded-full animate-spin mb-3`}
      />
      {text && <p className="text-xs sm:text-sm text-surface-400 font-medium">{text}</p>}
    </div>
  );
}
