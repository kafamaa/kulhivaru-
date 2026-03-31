/**
 * Production shell for admin areas that are scaffolded but not fully wired yet.
 */
export function AdminSectionPlaceholder({
  title,
  subtitle,
  bullets,
}: {
  title: string;
  subtitle: string;
  bullets?: string[];
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </header>
      {bullets && bullets.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Planned capabilities
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-300">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-xs text-violet-200/90">
        <strong className="text-violet-100">Security:</strong> Destructive or privileged actions will use{" "}
        <code className="rounded bg-black/30 px-1">SECURITY DEFINER</code> RPCs and{" "}
        <code className="rounded bg-black/30 px-1">platform_admin_audit_log</code> (or equivalent) — no
        direct client writes.
      </p>
    </div>
  );
}
