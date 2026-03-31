import Link from "next/link";
import {
  Activity,
  Building2,
  LineChart,
  ScrollText,
  Trophy,
  ArrowRight,
  Users,
} from "lucide-react";
import { getAdminAnalyticsSnapshot } from "@/src/features/admin/queries/get-admin-analytics";
import { getAdminAuditEvents } from "@/src/features/admin/queries/get-admin-audit";

export default async function AdminDashboardPage() {
  const [analytics, audit] = await Promise.all([
    getAdminAnalyticsSnapshot(),
    getAdminAuditEvents(8),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Platform-wide governance: organizations, tournaments, analytics, and
          audit trails. Use the sidebar to switch areas and the{" "}
          <strong className="text-zinc-300">shell theme</strong> to restyle this
          console without affecting the public site.
        </p>
      </div>

      {!analytics.ok ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Analytics unavailable</p>
          <p className="mt-1 text-amber-200/80">{analytics.error}</p>
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Organizations",
              value: analytics.data.organizations,
              href: "/admin/organizations",
            },
            {
              label: "Tournaments",
              value: analytics.data.tournaments,
              href: "/admin/tournaments",
            },
            {
              label: "Users",
              value: analytics.data.users,
              href: "/admin/users",
            },
            {
              label: "Active tournaments",
              value: analytics.data.activeTournaments,
              href: "/admin/tournaments",
            },
            {
              label: "Matches",
              value: analytics.data.matches,
              href: "/admin/matches",
            },
            {
              label: "Players",
              value: analytics.data.players,
              href: "/admin/analytics",
            },
            {
              label: "Standings rows",
              value: analytics.data.standingsRows,
              href: "/admin/analytics",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-white/10 bg-black/25 px-4 py-4 transition-colors hover:border-white/20 hover:bg-black/35"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                {card.value}
              </p>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-zinc-500 group-hover:text-zinc-300">
                Open <ArrowRight className="h-3 w-3" aria-hidden />
              </p>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="h-4 w-4 text-emerald-400" aria-hidden />
            Quick access
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              {
                href: "/admin/organizations",
                label: "Organizations",
                desc: "Owners, slugs, and org structure",
                icon: Building2,
              },
              {
                href: "/admin/tournaments",
                label: "Tournaments",
                desc: "All tournaments across the platform",
                icon: Trophy,
              },
              {
                href: "/admin/users",
                label: "Users",
                desc: "Roles, access, and memberships",
                icon: Users,
              },
              {
                href: "/admin/analytics",
                label: "Analytics",
                desc: "Counts and platform health",
                icon: LineChart,
              },
              {
                href: "/admin/audit-log",
                label: "Audit log",
                desc: "Platform activity and admin actions",
                icon: ScrollText,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/5"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium text-zinc-200">
                        {item.label}
                      </span>
                      <span className="text-xs text-zinc-500">{item.desc}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ScrollText className="h-4 w-4 text-violet-400" aria-hidden />
              Recent audit activity
            </h2>
            <Link
              href="/admin/audit-log"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              View all →
            </Link>
          </div>

          {!audit.ok ? (
            <p className="mt-4 text-sm text-zinc-500">{audit.error}</p>
          ) : audit.rows.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No events yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {audit.rows.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-xs"
                >
                  <span className="font-medium text-zinc-200">{e.type}</span>
                  <span className="text-zinc-500">
                    {e.at ? new Date(e.at).toLocaleString() : "—"}
                  </span>
                  <span className="w-full truncate text-zinc-400">{e.target}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-xs text-zinc-500">
        <strong className="text-zinc-400">Scope:</strong> Admin tools use the{" "}
        <code className="rounded bg-black/40 px-1 text-zinc-300">
          service role
        </code>{" "}
        where configured, so analytics and audit can read across all rows.
        Feature flags and public notices in Settings are UI placeholders until
        backed by tables.
      </div>
    </div>
  );
}
