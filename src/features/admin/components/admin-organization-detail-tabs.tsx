"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { AdminOrganizationDetail } from "../queries/admin-organizations-rpc";
import { adminUpdateOrganizationAction } from "../actions/admin-organization-actions";

const TABS = [
  "overview",
  "members",
  "tournaments",
  "finance",
  "audit",
  "notes",
  "settings",
] as const;

type TabId = (typeof TABS)[number];

function isTab(s: string | null): s is TabId {
  return !!s && (TABS as readonly string[]).includes(s);
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function AdminOrganizationDetailTabs({
  orgId,
  initial,
}: {
  orgId: string;
  initial: AdminOrganizationDetail;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "overview";

  const org = initial.organization;
  const [notesDraft, setNotesDraft] = useState(str(org.admin_notes));
  const [settingsReason, setSettingsReason] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    setNotesDraft(str(org.admin_notes));
  }, [org.admin_notes]);

  const members = initial.members;
  const tournaments = initial.tournaments;
  const audit = initial.audit;

  const hrefForTab = (t: TabId) =>
    t === "overview" ? `/admin/organizations/${orgId}` : `/admin/organizations/${orgId}?tab=${t}`;

  const saveSettings = (payload: Record<string, unknown>) => {
    const reason = settingsReason.trim() || prompt("Reason for this settings change (audit):") || "";
    if (!reason) return;
    start(async () => {
      const res = await adminUpdateOrganizationAction({
        orgId,
        payload,
        reason,
      });
      if (!res.ok) alert(res.error);
      else {
        setSettingsReason("");
        router.refresh();
      }
    });
  };

  const saveNotes = () => {
    saveSettings({ admin_notes: notesDraft });
  };

  const tabNav = useMemo(
    () =>
      TABS.map((t) => (
        <Link
          key={t}
          href={hrefForTab(t)}
          scroll={false}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
            tab === t
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          {t}
        </Link>
      )),
    [orgId, tab]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">{tabNav}</div>

      {tab === "overview" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Organization
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="text-lg font-semibold text-white">{str(org.name)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Slug</dt>
                <dd className="font-mono text-zinc-300">{str(org.slug)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="text-zinc-200">{str(org.org_status)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Verification</dt>
                <dd className="text-zinc-200">{str(org.verification_status)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Owner</dt>
                <dd className="text-zinc-200">
                  {str(org.owner_display_name) || "—"}
                  {org.owner_id ? (
                    <span className="mt-1 block font-mono text-[10px] text-zinc-500">
                      {str(org.owner_id)}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="text-zinc-400">
                  {org.created_at
                    ? new Date(str(org.created_at)).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Metrics</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Members</dt>
                <dd className="text-xl font-bold tabular-nums text-white">
                  {num(org.members_count)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Tournaments</dt>
                <dd className="text-xl font-bold tabular-nums text-white">
                  {num(org.tournaments_count)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Active tournaments</dt>
                <dd className="text-xl font-bold tabular-nums text-emerald-300">
                  {num(org.active_tournaments_count)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Teams (total)</dt>
                <dd className="text-xl font-bold tabular-nums text-white">
                  {num(org.teams_total)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">Revenue collected (tracked)</dt>
                <dd className="text-xl font-bold tabular-nums text-violet-300">
                  {num(org.revenue_collected).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
                <p className="mt-1 text-[10px] text-zinc-600">
                  Sum of receivables linked to org tournaments (platform currency).
                </p>
              </div>
            </dl>
            {num(org.risk_flag_count) > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <strong>Warnings:</strong> risk_flag_count = {num(org.risk_flag_count)} — review
                governance and activity.
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-600">No risk flags on record.</p>
            )}
          </div>
        </section>
      )}

      {tab === "members" && (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={`${str(m.profile_id)}-${i}`} className="border-b border-white/5">
                  <td className="px-4 py-2 text-zinc-200">{str(m.display_name) || "—"}</td>
                  <td className="px-4 py-2 text-xs text-zinc-400">{str(m.email) || "—"}</td>
                  <td className="px-4 py-2 text-zinc-300">{str(m.role)}</td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {m.joined_at
                      ? new Date(str(m.joined_at)).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-400">{str(m.member_status)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="mr-1 rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400"
                      onClick={() =>
                        alert("Promote member — add rpc_admin_update_org_member in a follow-up.")
                      }
                    >
                      Promote
                    </button>
                    <button
                      type="button"
                      className="mr-1 rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400"
                      onClick={() => alert("Demote — coming")}
                    >
                      Demote
                    </button>
                    <button
                      type="button"
                      className="mr-1 rounded border border-white/10 px-2 py-1 text-[10px] text-amber-300/80"
                      onClick={() => alert("Suspend membership — coming")}
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-300/90"
                      onClick={() => alert("Remove member — coming")}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">No members.</p>
          ) : null}
        </section>
      )}

      {tab === "tournaments" && (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                <th className="px-4 py-3">Tournament</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sport</th>
                <th className="px-4 py-3 text-right">Teams</th>
                <th className="px-4 py-3 text-right">Matches</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={str(t.id)} className="border-b border-white/5">
                  <td className="px-4 py-2 font-medium text-zinc-100">{str(t.name)}</td>
                  <td className="px-4 py-2 text-zinc-400">{str(t.status)}</td>
                  <td className="px-4 py-2 text-zinc-400">{str(t.sport)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-300">
                    {num(t.teams_count)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-300">
                    {num(t.matches_count)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-violet-300">
                    {num(t.revenue).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {t.updated_at
                      ? new Date(str(t.updated_at)).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tournaments.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">No tournaments.</p>
          ) : null}
        </section>
      )}

      {tab === "finance" && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-sm text-zinc-300">
          <p className="text-lg font-semibold text-white">Finance</p>
          <p className="mt-2 text-zinc-400">
            Organization revenue (from receivables):{" "}
            <strong className="text-violet-300">
              {num(org.revenue_collected).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </p>
          <p className="mt-4 text-xs text-zinc-600">
            Detailed ledgers, payouts, and exports will plug into the finance module in a follow-up.
          </p>
        </div>
      )}

      {tab === "audit" && (
        <ul className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          {audit.length === 0 ? (
            <li className="text-zinc-500">No audit events for this organization.</li>
          ) : (
            audit.map((a) => (
              <li
                key={str(a.id)}
                className="rounded-xl border border-white/5 bg-black/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-violet-300">{str(a.action)}</span>
                  <span className="text-[10px] text-zinc-500">
                    {a.created_at
                      ? new Date(str(a.created_at)).toLocaleString()
                      : ""}
                  </span>
                </div>
                {a.reason ? (
                  <p className="mt-1 text-xs text-zinc-400">Reason: {str(a.reason)}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "notes" && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <label className="block space-y-2 text-sm">
            <span className="text-zinc-400">Admin notes (internal)</span>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="min-h-[160px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-violet-500/40"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={settingsReason}
              onChange={(e) => setSettingsReason(e.target.value)}
              placeholder="Reason for note change (audit)"
              className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={pending}
              onClick={saveNotes}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save notes"}
            </button>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-sm text-zinc-400">
            Super-admin controls. Changes are written via <code className="text-violet-300">rpc_admin_update_organization</code>{" "}
            and audited.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveSettings({
                name: String(fd.get("name") || ""),
                slug: String(fd.get("slug") || ""),
                org_status: String(fd.get("org_status") || ""),
                verification_status: String(fd.get("verification_status") || ""),
                allow_finance_module: fd.get("allow_finance_module") === "on",
                require_manual_publish_review: fd.get("require_manual_publish_review") === "on",
                hide_public_visibility: fd.get("hide_public_visibility") === "on",
                max_tournaments: String(fd.get("max_tournaments") || ""),
                risk_flag_count: String(fd.get("risk_flag_count") || "0"),
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Lifecycle status</span>
                <select
                  name="org_status"
                  defaultValue={str(org.org_status)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Verification</span>
                <select
                  name="verification_status"
                  defaultValue={str(org.verification_status)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  <option value="verified">verified</option>
                  <option value="unverified">unverified</option>
                  <option value="pending">pending</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Name</span>
                <input
                  name="name"
                  defaultValue={str(org.name)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Slug</span>
                <input
                  name="slug"
                  defaultValue={str(org.slug)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
                />
              </label>
            </div>
            <div className="flex flex-col gap-3 text-sm text-zinc-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allow_finance_module"
                  defaultChecked={org.allow_finance_module === true}
                />
                Allow finance module
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="require_manual_publish_review"
                  defaultChecked={org.require_manual_publish_review === true}
                />
                Require manual review before publish
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hide_public_visibility"
                  defaultChecked={org.hide_public_visibility === true}
                />
                Hide public visibility
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Max tournaments (empty = no limit)</span>
                <input
                  name="max_tournaments"
                  defaultValue={org.max_tournaments != null ? str(org.max_tournaments) : ""}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Risk flag count</span>
                <input
                  name="risk_flag_count"
                  type="number"
                  min={0}
                  defaultValue={num(org.risk_flag_count)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <p className="text-[11px] text-zinc-600">
              Feature restrictions JSON — structured editor later. Current:{" "}
              <code className="break-all text-zinc-500">
                {(() => {
                  try {
                    return JSON.stringify(org.feature_restrictions_json ?? {});
                  } catch {
                    return "{}";
                  }
                })()}
              </code>
            </p>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              <input
                type="text"
                value={settingsReason}
                onChange={(e) => setSettingsReason(e.target.value)}
                placeholder="Reason for change (required for audit)"
                className="min-w-[260px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
          <p className="text-[11px] text-zinc-600">
            Lifecycle changes here use <code className="text-zinc-500">organization.update</code> audit
            entries. The list page also offers dedicated status RPCs with required reasons for suspend
            / archive.
          </p>
        </div>
      )}
    </div>
  );
}
