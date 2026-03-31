import Link from "next/link";

interface QuickActionButtonProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function QuickActionButton({ href, label, icon }: QuickActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-300"
    >
      {icon ?? <span className="text-emerald-400">⚡</span>}
      {label}
    </Link>
  );
}
