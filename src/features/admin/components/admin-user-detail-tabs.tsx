"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminUserDetail } from "../queries/admin-users-rpc";
import {
  adminActivateUserAction,
  adminArchiveUserAction,
  adminRevokeOrgAccessAction,
  adminSetOrgMemberRoleAction,
  adminSetOrgMemberStatusAction,
  adminSetUserRoleAction,
  adminSuspendUserAction,
  adminUpdateUserAction,
} from "../actions/admin-user-actions";
import {
  accountStatusBadgeClass,
  accountStatusLabel,
  PLATFORM_ROLES,
  platformRoleLabel,
  roleBadgeClass,
  type PlatformRole,
} from "../lib/admin-user-labels";

const TABS = [
  "overview",
  "memberships",
  "tournaments",
  "teams",
  "finance",
  "audit",
  "security",
  "notes",
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

function parseRole(input: string): PlatformRole | null {
  const t = input.trim().toLowerCase();
  return (PLATFORM_ROLES as readonly string[]).includes(t) ? (t as PlatformRole) : null;
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-sm text-zinc-400">
      <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      <p className="mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

export function AdminUserDetailTabs({
  userId,
  initial,
  currentUserId,
}: {
  userId: string;
  initial: AdminUserDetail;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "overview";
  const [pending, start] = useTransition();
  const [notesDraft, setNotesDraft] = useState(str(initial.profile.admin_notes));

  const isSelf = currentUserId !== null && userId === currentUserId;
  const profile = initial.profile;
  const auth = initial.auth;
  const role = str(profile.role);
  const status = str(profile.account_status);

  const hrefForTab = (t: TabId) =>
    t === "overview" ? `/admin/users/${userId}` : `/admin/users/${userId}?tab=${t}`;

  const tabNav = useMemo(
    () =>
      TABS.map((t) => (
        <Link
          key={t}
          href={hrefForTab(t)}
          scroll={false}
          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold capitalize sm:text-xs ${
            tab === t ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          {t}
        </Link>
      )),
    [userId, tab]
  );

  const issueHints: string[] = [];
  if (!auth.email_verified) issueHints.push("Email not verified.");
  if (Number(profile.risk_flag_count ?? 0) > 0) issueHints.push("Account has risk flags set.");
  if (status === "suspended") issueHints.push("Account is suspended.");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 sm:gap-2">{tabNav}</div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Profile</h2>
                <p className="mt-1 text-2xl font-bold text-white">
                  {str(profile.display_name).trim() || "—"}
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{userId}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${roleBadgeClass(role)}`}
                >
                  {platformRoleLabel(role)}
                </span>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accountStatusBadgeClass(status)}`}
                >
                  {accountStatusLabel(status)}
                </span>
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-mono text-zinc-200">{auth.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="text-zinc-200">{auth.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email verified</dt>
                <dd className="text-zinc-200">{auth.email_verified ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="text-zinc-200">
                  {auth.created_at ? new Date(auth.created_at).toLocaleString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last login</dt>
                <dd className="text-zinc-200">
                  {auth.last_sign_in_at
                    ? new Date(auth.last_sign_in_at).toLocaleString()
                    : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Memberships / tournaments</dt>
                <dd className="text-zinc-200">
                  {initial.memberships.length} orgs · {initial.tournaments.length} tournaments (via orgs)
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick controls</h3>
            <p className="text-[11px] text-zinc-500">Actions are audited. You cannot suspend or change your own role here.</p>
            <div className="flex flex-col gap-2">
              {status !== "suspended" && !isSelf ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-amber-500/15 px-3 py-2 text-left text-xs text-amber-100"
                  onClick={() => {
                    const r = reasonPrompt("Suspend user");
                    if (!r) return;
                    start(async () => {
                      const res = await adminSuspendUserAction({ userId, reason: r });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  Suspend
                </button>
              ) : null}
              {status === "suspended" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-emerald-500/15 px-3 py-2 text-left text-xs text-emerald-100"
                  onClick={() => {
                    const r = reasonPrompt("Reactivate user");
                    if (!r) return;
                    start(async () => {
                      const res = await adminActivateUserAction({ userId, reason: r });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  Reactivate
                </button>
              ) : null}
              {status !== "archived" && !isSelf ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-left text-xs text-zinc-200"
                  onClick={() => {
                    const r = reasonPrompt("Archive user");
                    if (!r) return;
                    start(async () => {
                      const res = await adminArchiveUserAction({ userId, reason: r });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  Archive
                </button>
              ) : null}
              {!isSelf ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-zinc-200"
                  onClick={() => {
                    const raw =
                      prompt(`Platform role: ${PLATFORM_ROLES.join(", ")}`)?.trim() ?? "";
                    const newRole = parseRole(raw);
                    if (!newRole) return;
                    const r = reasonPrompt(`Set role to ${newRole}`);
                    if (!r) return;
                    start(async () => {
                      const res = await adminSetUserRoleAction({
                        userId,
                        role: newRole,
                        reason: r,
                      });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  Change platform role
                </button>
              ) : null}
            </div>
          </section>

          <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Issue summary</h3>
            {issueHints.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-200/90">No automatic warnings from admin heuristics.</p>
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

      {tab === "memberships" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                <th className="px-3 py-2">Organization</th>
                <th className="px-3 py-2">Org role</th>
                <th className="px-3 py-2">Member status</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initial.memberships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                    No organization memberships.
                  </td>
                </tr>
              ) : (
                initial.memberships.map((m) => {
                  const orgId = str(m.organization_id);
                  return (
                    <tr key={orgId} className="border-b border-white/5">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/organizations/${orgId}`}
                          className="font-medium text-violet-300 hover:underline"
                        >
                          {str(m.organization_name)}
                        </Link>
                        {m.is_owner ? (
                          <span className="ml-2 text-[10px] text-amber-200">Owner</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-zinc-300">{str(m.org_role)}</td>
                      <td className="px-3 py-2 text-zinc-400">{str(m.member_status)}</td>
                      <td className="px-3 py-2 text-xs text-zinc-500">
                        {m.joined_at ? new Date(str(m.joined_at)).toLocaleDateString() : "—"}
                      </td>
                      <td className="space-y-1 px-3 py-2 text-right">
                        <button
                          type="button"
                          className="mr-1 rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                          onClick={() => {
                            const r = reasonPrompt("Promote to org admin");
                            if (!r) return;
                            start(async () => {
                              const res = await adminSetOrgMemberRoleAction({
                                userId,
                                organizationId: orgId,
                                role: "admin",
                                reason: r,
                              });
                              if (!res.ok) alert(res.error);
                              else router.refresh();
                            });
                          }}
                        >
                          Make admin
                        </button>
                        <button
                          type="button"
                          className="mr-1 rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                          onClick={() => {
                            const r = reasonPrompt("Demote to member");
                            if (!r) return;
                            start(async () => {
                              const res = await adminSetOrgMemberRoleAction({
                                userId,
                                organizationId: orgId,
                                role: "member",
                                reason: r,
                              });
                              if (!res.ok) alert(res.error);
                              else router.refresh();
                            });
                          }}
                        >
                          Demote
                        </button>
                        <button
                          type="button"
                          className="mr-1 rounded border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200 hover:bg-amber-500/10"
                          onClick={() => {
                            const r = reasonPrompt("Suspend org membership");
                            if (!r) return;
                            start(async () => {
                              const res = await adminSetOrgMemberStatusAction({
                                userId,
                                organizationId: orgId,
                                status: "suspended",
                                reason: r,
                              });
                              if (!res.ok) alert(res.error);
                              else router.refresh();
                            });
                          }}
                        >
                          Suspend member
                        </button>
                        {str(m.member_status) === "suspended" ? (
                          <button
                            type="button"
                            className="mr-1 rounded border border-emerald-500/30 px-2 py-1 text-[10px] text-emerald-200 hover:bg-emerald-500/10"
                            onClick={() => {
                              const r = reasonPrompt("Reactivate org membership");
                              if (!r) return;
                              start(async () => {
                                const res = await adminSetOrgMemberStatusAction({
                                  userId,
                                  organizationId: orgId,
                                  status: "active",
                                  reason: r,
                                });
                                if (!res.ok) alert(res.error);
                                else router.refresh();
                              });
                            }}
                          >
                            Reactivate member
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-200 hover:bg-red-500/10"
                          onClick={() => {
                            const r = reasonPrompt("Revoke org access (remove membership)");
                            if (!r) return;
                            if (!confirm("Remove this user from the organization?")) return;
                            start(async () => {
                              const res = await adminRevokeOrgAccessAction({
                                userId,
                                organizationId: orgId,
                                reason: r,
                              });
                              if (!res.ok) alert(res.error);
                              else router.refresh();
                            });
                          }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tournaments" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase text-zinc-500">
                <th className="px-3 py-2">Tournament</th>
                <th className="px-3 py-2">Organization</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {initial.tournaments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                    No tournaments found via organization membership or ownership.
                  </td>
                </tr>
              ) : (
                initial.tournaments.map((t) => (
                  <tr key={str(t.tournament_id)} className="border-b border-white/5">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/tournaments/${str(t.tournament_id)}`}
                        className="font-medium text-violet-300 hover:underline"
                      >
                        {str(t.tournament_name)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{str(t.organization_name)}</td>
                    <td className="px-3 py-2 text-zinc-400">{str(t.tournament_status)}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/t/${str(t.tournament_slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:underline"
                      >
                        Public ↗
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "teams" && (
        <Placeholder
          title="Teams / players"
          body="Player rows are not linked to auth profiles in this schema yet. When user–player mapping exists, roster and entry history will appear here."
        />
      )}

      {tab === "finance" && (
        <Placeholder
          title="Finance"
          body="Payments are tied to team entries and receivables. User-scoped finance rollups will use finance RPCs in a future iteration."
        />
      )}

      {tab === "audit" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase text-zinc-500">As target (user entity)</h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold uppercase text-zinc-500">
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {initial.audit_as_target.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                        No rows.
                      </td>
                    </tr>
                  ) : (
                    initial.audit_as_target.map((a) => (
                      <tr key={str(a.id)} className="border-b border-white/5">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
                          {a.created_at ? new Date(str(a.created_at)).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-violet-200">{str(a.action)}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-xs text-zinc-500">
                          {str(a.reason) || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-zinc-500">As actor (admin actions)</h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold uppercase text-zinc-500">
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {initial.audit_as_actor.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                        No rows.
                      </td>
                    </tr>
                  ) : (
                    initial.audit_as_actor.map((a) => (
                      <tr key={str(a.id)} className="border-b border-white/5">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
                          {a.created_at ? new Date(str(a.created_at)).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-violet-200">{str(a.action)}</td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {str(a.entity_type)} {str(a.entity_id).slice(0, 8)}…
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Link href="/admin/audit-log" className="text-xs text-violet-400 hover:underline">
            Open global audit log →
          </Link>
        </div>
      )}

      {tab === "security" && (
        <Placeholder
          title="Security"
          body="Auth event streams (failed logins, password resets, session risk) are not stored in-app yet. Use Supabase Auth logs for deep investigation."
        />
      )}

      {tab === "notes" && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
          <label className="block text-xs text-zinc-500">
            Internal admin notes (visible to platform admins via this RPC)
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
            onClick={() => {
              const r = reasonPrompt("Save admin notes");
              if (!r) return;
              start(async () => {
                const res = await adminUpdateUserAction({
                  userId,
                  payload: { admin_notes: notesDraft },
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                else router.refresh();
              });
            }}
          >
            Save notes
          </button>
        </div>
      )}
    </div>
  );
}
