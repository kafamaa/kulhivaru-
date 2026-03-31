import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  href?: string;
  loading?: boolean;
}

export function StatCard({ label, value, href, loading }: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-700" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-slate-50 tabular-nums">
          {value}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
