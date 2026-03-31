import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md",
        "shadow-[0_20px_90px_rgba(0,0,0,0.14)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

