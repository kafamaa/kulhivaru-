import type { ReactNode } from "react";

interface InlineHelpProps {
  children: ReactNode;
  className?: string;
}

export function InlineHelp({ children, className = "" }: InlineHelpProps) {
  return (
    <p className={`mt-1 text-xs text-slate-500 ${className}`}>{children}</p>
  );
}
