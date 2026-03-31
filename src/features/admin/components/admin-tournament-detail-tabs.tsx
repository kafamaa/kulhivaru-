"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminTournamentDetail } from "../queries/admin-tournaments-rpc";
import {
  adminTournamentArchiveAction,
  adminTournamentCancelAction,
  adminTournamentPublishAction,
  adminTournamentSetLockedAction,
  adminTournamentUnpublishAction,
} from "../actions/admin-tournament-actions";
import { adminTournamentStatusLabel, statusBadgeClass } from "../lib/admin-tournament-status-label";

const TABS = [
  "overview",
  "wizard",
  "categories",
  "registrations",
  "teams",
  "phases",
  "groups",
  "matches",
  "standings",
  "finance",
  "media",
  "audit",
  "tools",
] as const;

type TabId = (typeof TABS)[number];

function isTab(s: string | null): s is TabId {
  return !!s && (TABS as readonly string[]).includes(s);
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function reasonPrompt(label: string): string | null {
  const r = prompt(`${label}\n\nReason (required for audit):`)?.trim() ?? "";
  return r || null;
}

function Placeholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-sm text-zinc-400">
      <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      <p className="mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

export function AdminTournamentDetailTabs({
  tournamentId,
  initial,
}: {
  tournamentId: string;
  initial: AdminTournamentDetail;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "overview";
  const [pending, start] = useTransition();

  const t = initial.tournament;
  const org = initial.organization;
  const slug = str(t.slug);
  const status = str(t.status);
  const adminLocked = Boolean(t.admin_locked);
  const isFeatured = Boolean(t.is_featured);
  const isRegOpen = Boolean(t.is_registration_open);
  const feesCollected = Number(initial.counts.fees_collected ?? 0);

  const hrefForTab = (x: TabId) =>
    x === "overview"
      ? `/admin/tournaments/${tournamentId}`
      : `/admin/tournaments/${tournamentId}?tab=${x}`;

  const tabNav = useMemo(
    () =>
      TABS.map((x) => (
        <Link
          key={x}
          href={hrefForTab(x)}
          scroll={false}
          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold capitalize sm:text-xs ${
            tab === x ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          {x}
        </Link>
      )),
    [tournamentId, tab]
  );

  const act = (label: string, fn: (reason: string) => Promise<void>) => {
    const r = reasonPrompt(label);
    if (!r) return;
    start(async () => {
      await fn(r);
    });
  };

  const issueHints: string[] = [];
  if (["upcoming", "ongoing", "completed"].includes(status) && initial.counts.categories === 0) {
    issueHints.push("Public or scheduled tournament has no categories.");
  }
  if (["upcoming", "ongoing"].includes(status) && initial.counts.matches === 0) {
    issueHints.push("Published/live tournament has no fixtures yet.");
  }
  if (initial.counts.unpaid_receivables > 0) {
    issueHints.push(`${initial.counts.unpaid_receivables} receivable(s) still unpaid.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 sm:gap-2">{tabNav}</div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Tournament</h2>
                <p className="mt-1 text-2xl font-bold text-white">{str(t.name)}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{slug}</p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
              >
                {adminTournamentStatusLabel(status)}
              </span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Organization</dt>
                <dd className="text-zinc-200">
                  {org ? (
                    <Link
                      href={`/admin/organizations/${str(org.id)}`}
                      className="text-violet-300 hover:underline"
                    >
                      {str(org.name)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Sport</dt>
                <dd className="text-zinc-200">{str(t.sport)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Season</dt>
                <dd className="text-zinc-200">{t.season_label != null ? str(t.season_label) : "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Location</dt>
                <dd className="text-zinc-200">{t.location != null ? str(t.location) : "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Start / end</dt>
                <dd className="text-zinc-200">
                  {t.start_date ? str(t.start_date) : "—"} → {t.end_date ? str(t.end_date) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Registration</dt>
                <dd className="text-zinc-200">
                  {isRegOpen ? "Open" : "Closed"}
                  {isFeatured ? (
                    <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                      Featured
                    </span>
                  ) : null}
                  {adminLocked ? (
                    <span className="ml-2 rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                      Admin locked
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <Link
                href={`/organizer/t/${tournamentId}/teams`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
              >
                Registrations
              </Link>
              <Link
                href={`/organizer/t/${tournamentId}/matches`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
              >
                Matches
              </Link>
              <Link
                href={`/organizer/t/${tournamentId}/standings`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
              >
                Standings
              </Link>
              <Link
                href={`/organizer/t/${tournamentId}/finance`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
              >
                Finance
              </Link>
              <Link
                href={`/admin/audit-log`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10"
              >
                Global audit
              </Link>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick controls</h3>
            <p className="text-[11px] text-zinc-500">
              State changes are logged to the tournament audit trail. Destructive actions require a reason.
            </p>
            <div className="flex flex-col gap-2">
              {status === "draft" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-sky-600/30 px-3 py-2 text-left text-xs text-sky-100 hover:bg-sky-600/40"
                  onClick={() =>
                    act("Publish tournament", async (reason) => {
                      const res = await adminTournamentPublishAction({ tournamentId, reason });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Publish (draft → published)
                </button>
              ) : null}
              {status !== "draft" && status !== "archived" && status !== "cancelled" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-amber-500/15 px-3 py-2 text-left text-xs text-amber-100 hover:bg-amber-500/25"
                  onClick={() =>
                    act("Unpublish to draft", async (reason) => {
                      const res = await adminTournamentUnpublishAction({ tournamentId, reason });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Unpublish
                </button>
              ) : null}
              {!adminLocked ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/5"
                  onClick={() =>
                    act("Lock tournament", async (reason) => {
                      const res = await adminTournamentSetLockedAction({
                        tournamentId,
                        locked: true,
                        reason,
                      });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Lock
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-emerald-500/20 px-3 py-2 text-left text-xs text-emerald-200 hover:bg-emerald-500/10"
                  onClick={() =>
                    act("Unlock tournament", async (reason) => {
                      const res = await adminTournamentSetLockedAction({
                        tournamentId,
                        locked: false,
                        reason,
                      });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Unlock
                </button>
              )}
              {status !== "cancelled" && status !== "archived" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-red-500/15 px-3 py-2 text-left text-xs text-red-200 hover:bg-red-500/25"
                  onClick={() =>
                    act("Cancel tournament", async (reason) => {
                      const res = await adminTournamentCancelAction({ tournamentId, reason });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Cancel
                </button>
              ) : null}
              {status !== "archived" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-700"
                  onClick={() =>
                    act("Archive tournament", async (reason) => {
                      const res = await adminTournamentArchiveAction({ tournamentId, reason });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Archive
                </button>
              ) : null}
            </div>
          </section>

          <section className="lg:col-span-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Categories", String(initial.counts.categories)],
                ["Teams (approved)", String(initial.counts.teams_approved)],
                ["Registrations", String(initial.counts.registrations)],
                ["Matches", String(initial.counts.matches)],
                ["Fees collected", feesCollected.toFixed(2)],
                ["Unpaid receivables", String(initial.counts.unpaid_receivables)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{k}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{v}</p>
              </div>
            ))}
          </section>

          <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Publish checklist</h3>
            {issueHints.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-200/90">No automatic issues detected from admin heuristics.</p>
            ) : (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-200/90">
                {issueHints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "wizard" && (
        <Placeholder
          title="Wizard data"
          body="Full wizard payload inspection and field-level overrides will map to stored categories, registration settings, phases, schedule, and automation. Use organizer settings for edits today; admin overrides via rpc_admin_update_tournament are limited to name, location, season label, featured, and registration open state."
        />
      )}

      {tab === "categories" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2 text-right">Teams max</th>
                <th className="px-3 py-2 text-right">Teams min</th>
                <th className="px-3 py-2">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {initial.categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                    No categories persisted for this tournament.
                  </td>
                </tr>
              ) : (
                initial.categories.map((c) => (
                  <tr key={str(c.id)} className="border-b border-white/5">
                    <td className="px-3 py-2 text-zinc-200">{str(c.name)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">{str(c.short_label)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{str(c.max_teams)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{str(c.min_teams)}</td>
                    <td className="px-3 py-2 text-xs text-zinc-400">{str(c.visibility)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "registrations" && (
        <Placeholder
          title="Registrations"
          body="Deep registration moderation (approve, reject, waive, refund) will use dedicated admin RPCs. For now, open the organizer registration workspace for this tournament."
        />
      )}

      {tab === "teams" && (
        <Placeholder
          title="Teams"
          body="Team roster and manager summaries will aggregate team_entries and players. Use organizer Teams & Registration in the interim."
        />
      )}

      {tab === "phases" && (
        <Placeholder
          title="Phases"
          body="Phase builder data is not yet exposed as first-class tables. When phases land in the schema, this tab will list order, type, rules, and generation state."
        />
      )}

      {tab === "groups" && (
        <Placeholder
          title="Groups"
          body="Group management (rebalance, manual moves) will appear here after groups are modeled for admin RPC access."
        />
      )}

      {tab === "matches" && (
        <Placeholder
          title="Matches"
          body="Use organizer matches for edits. Admin reschedule/finalize/void tooling will call match-scoped RPCs once published."
        />
      )}

      {tab === "standings" && (
        <Placeholder
          title="Standings"
          body="rpc_admin_recompute_standings and manual overrides are planned. Organizer standings page shows current cache."
        />
      )}

      {tab === "finance" && (
        <Placeholder
          title="Finance"
          body="Open organizer finance for receivables and payments. Admin waive/refund RPCs will mirror finance policies."
        />
      )}

      {tab === "media" && (
        <Placeholder
          title="Media / announcements"
          body="Tournament media assets and public announcements will surface here when wired to tournament_media and notice tables."
        />
      )}

      {tab === "audit" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Rows from <code className="text-zinc-400">platform_admin_audit_log</code> for this tournament only.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {initial.audit.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-zinc-500">
                      No admin audit entries yet.
                    </td>
                  </tr>
                ) : (
                  initial.audit.map((a) => (
                    <tr key={str(a.id)} className="border-b border-white/5">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
                        {a.created_at ? new Date(str(a.created_at)).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-violet-200">{str(a.action)}</td>
                      <td className="max-w-md truncate px-3 py-2 text-xs text-zinc-400">
                        {a.reason != null ? str(a.reason) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "tools" && (
        <Placeholder
          title="Admin tools"
          body="Validate wizard, sync derived counts, recompute standings, regenerate fixtures, soft reset, export bundle — each will be backed by SECURITY DEFINER RPCs with mandatory reasons. Not enabled in this build."
        />
      )}
    </div>
  );
}
