interface CompletionIndicatorProps {
  complete: boolean;
  label?: string;
  className?: string;
}

export function CompletionIndicator({
  complete,
  label,
  className = "",
}: CompletionIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-xs ${className}`}
      aria-hidden
    >
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
          complete ? "bg-emerald-500" : "bg-slate-600"
        }`}
      />
      {label && (
        <span className={complete ? "text-slate-300" : "text-slate-500"}>
          {label}
        </span>
      )}
    </div>
  );
}
