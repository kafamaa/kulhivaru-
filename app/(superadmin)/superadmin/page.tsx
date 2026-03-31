import Link from "next/link";
import {
  ArrowRight,
  Building2,
  LineChart,
  ScrollText,
  Swords,
  Users,
} from "lucide-react";
import { getAdminAnalyticsSnapshot } from "@/src/features/admin/queries/get-admin-analytics";
import { getAdminAuditEvents } from "@/src/features/admin/queries/get-admin-audit";

export default async function SuperAdminOverviewPage() {
  const [analytics, audit] = await Promise.all([
    getAdminAnalyticsSnapshot(),
    getAdminAuditEvents(12),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
          Live snapshot of the platform. Phase 1 lists and counts; full KPIs, health
          strip, charts, and alerts are defined in{" "}
          <code className="text-amber-200/80">docs/SUPER_ADMIN_MASTER_SPEC.md</code>.
        </p>
      </div>

      {!analytics.ok ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Metrics unavailable</p>
          <p className="mt-1 text-amber-200/80">{analytics.error}</p>
        </div>
      ) : (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Platform KPIs (baseline)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              ["Organizations", analytics.data.organizations, "/superadmin/organizations"],
              ["Tournaments", analytics.data.tournaments, "/superadmin/tournaments"],
              ["Active tournaments", analytics.data.activeTournaments, "/superadmin/tournaments"],
              ["Matches", analytics.data.matches, "/superadmin/matches"],
              ["Players", analytics.data.players, "/superadmin/players"],
              ["Standings rows", analytics.data.standingsRows, "/superadmin/system"],
            ].map(([label, value, href]) => (
              <Link
                key={String(label)}
                href={href}
                className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition-colors hover:border-amber-500/25 hover:bg-black/40"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
                <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-zinc-600 group-hover:text-amber-200/80">
                  Open <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Extended KPIs (suspended orgs, audit counts, fees collected, etc.) require
            additional tables and RPCs per spec §7.
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <h2 className="text-sm font-semibold text-white">Phase 1 routes</h2>
          <ul className="mt-4 space-y-2">
            {[
              { href: "/superadmin/organizations", label: "Organizations", icon: Building2 },
              { href: "/superadmin/tournaments", label: "Tournaments", icon: Swords },
              { href: "/superadmin/users", label: "Users", icon: Users },
              { href: "/superadmin/audit-logs", label: "Audit logs", icon: ScrollText },
            ].map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-zinc-300 hover:bg-white/5"
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent audit (derived)</h2>
            <Link
              href="/superadmin/audit-logs"
              className="text-xs font-medium text-amber-400 hover:text-amber-300"
            >
              All logs →
            </Link>
          </div>
          {!audit.ok ? (
            <p className="mt-4 text-sm text-zinc-500">{audit.error}</p>
          ) : audit.rows.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No rows.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {audit.rows.slice(0, 8).map((e) => (
                <li key={e.id} className="flex flex-wrap gap-2 py-2 text-xs">
                  <span className="font-medium text-amber-200/90">{e.type}</span>
                  <span className="text-zinc-500">
                    {e.at ? new Date(e.at).toLocaleString() : "—"}
                  </span>
                  <span className="w-full truncate text-zinc-400">{e.target}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[11px] text-zinc-600">
            Full immutable audit (actor, payload, before/after) → table + RPCs in spec §34–§36.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-5 text-sm">
        <div className="flex items-start gap-3">
          <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-100">Build priority</p>
            <p className="mt-1 text-zinc-400">
              Implement detail pages, command search, filters, bulk actions, and
              secure RPCs incrementally. Database: run migrations including{" "}
              <code className="rounded bg-black/40 px-1 text-zinc-300">
                super_admin
              </code>{" "}
              role, <code className="rounded bg-black/40 px-1">is_super_admin()</code>, and{" "}
              <code className="rounded bg-black/40 px-1">platform_settings</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
