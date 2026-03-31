"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminUserListRow } from "../queries/admin-users-rpc";
import {
  adminActivateUserAction,
  adminArchiveUserAction,
  adminBulkActivateUsersAction,
  adminBulkSetUserRoleAction,
  adminBulkSuspendUsersAction,
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
import { downloadCsv } from "../utils/organizations-csv";
import { usersRowsToCsv } from "../utils/users-csv";

function reasonPrompt(label: string): string | null {
  const r = prompt(`${label}\n\nReason (required for audit):`)?.trim() ?? "";
  return r || null;
}

function parseRole(input: string): PlatformRole | null {
  const t = input.trim().toLowerCase();
  return (PLATFORM_ROLES as readonly string[]).includes(t) ? (t as PlatformRole) : null;
}

function RowMenu({
  row,
  currentUserId,
  onDone,
}: {
  row: AdminUserListRow;
  currentUserId: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isSelf = currentUserId !== null && row.id === currentUserId;

  const act = (label: string, fn: (reason: string) => Promise<void>) => {
    setOpen(false);
    const r = reasonPrompt(label);
    if (!r) return;
    start(async () => {
      await fn(r);
    });
  };

  return (
    <div className="relative text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-zinc-600 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
      >
        Actions
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 max-h-[min(70vh,480px)] w-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 py-1 text-xs shadow-xl">
            <Link
              href={`/admin/users/${row.id}`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View profile
            </Link>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              disabled={pending}
              onClick={() =>
                act("Update display name", async (reason) => {
                  const name =
                    prompt("New display name (leave empty to skip):")?.trim() ?? "";
                  if (!name) return;
                  const res = await adminUpdateUserAction({
                    userId: row.id,
                    payload: { display_name: name },
                    reason,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              Edit basic info
            </button>
            <div className="my-1 border-t border-zinc-800" />
            {row.account_status !== "suspended" && !isSelf ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-amber-200 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Suspend user", async (reason) => {
                    const res = await adminSuspendUserAction({ userId: row.id, reason });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Suspend user
              </button>
            ) : null}
            {row.account_status === "suspended" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-emerald-200 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Reactivate user", async (reason) => {
                    const res = await adminActivateUserAction({ userId: row.id, reason });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Reactivate user
              </button>
            ) : null}
            {row.account_status !== "archived" && !isSelf ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-zinc-400 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Archive user", async (reason) => {
                    const res = await adminArchiveUserAction({ userId: row.id, reason });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Archive user
              </button>
            ) : null}
            {!isSelf ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sky-200 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Change platform role", async (reason) => {
                    const raw =
                      prompt(
                        `New role: ${PLATFORM_ROLES.join(", ")}`
                      )?.trim() ?? "";
                    const role = parseRole(raw);
                    if (!role) {
                      alert("Invalid role");
                      return;
                    }
                    const res = await adminSetUserRoleAction({
                      userId: row.id,
                      role,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Change platform role
              </button>
            ) : null}
            {!isSelf && row.role !== "member" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Remove elevated role (set member)", async (reason) => {
                    const res = await adminSetUserRoleAction({
                      userId: row.id,
                      role: "member",
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Remove elevated role
              </button>
            ) : null}
            <div className="my-1 border-t border-zinc-800" />
            <Link
              href={`/admin/users/${row.id}?tab=memberships`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View organizations
            </Link>
            <Link
              href={`/admin/users/${row.id}?tab=tournaments`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View tournaments
            </Link>
            <Link
              href={`/admin/users/${row.id}?tab=audit`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Open audit logs
            </Link>
            <Link
              href={`/admin/users/${row.id}?tab=notes`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Internal notes
            </Link>
            <div className="my-1 border-t border-zinc-800" />
            <span className="block px-3 py-1.5 text-zinc-600">Impersonate (read-only) — coming</span>
            <span className="block px-3 py-1.5 text-zinc-600">Delete — disabled</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminUsersTable({
  rows,
  currentUserId,
}: {
  rows: AdminUserListRow[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulk] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const bulkReason = (label: string) => reasonPrompt(label);

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm">
          <span className="font-medium text-violet-100">{selectedIds.length} selected</span>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Suspend ${selectedIds.length} users`);
              if (!r) return;
              const ids = selectedIds.filter((id) => id !== currentUserId);
              startBulk(async () => {
                const res = await adminBulkSuspendUsersAction({ userIds: ids, reason: r });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            Suspend selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Reactivate ${selectedIds.length} users`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkActivateUsersAction({ userIds: selectedIds, reason: r });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
          >
            Reactivate selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const raw =
                prompt(
                  `Assign platform role to ${selectedIds.length} users.\nRole: ${PLATFORM_ROLES.join(", ")}`
                )?.trim() ?? "";
              const role = parseRole(raw);
              if (!role) return;
              const r = bulkReason(`Set role to ${role} (${selectedIds.length} users)`);
              if (!r) return;
              const ids = selectedIds.filter((id) => id !== currentUserId);
              startBulk(async () => {
                const res = await adminBulkSetUserRoleAction({
                  userIds: ids,
                  role,
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Assign role
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Remove elevated roles → member (${selectedIds.length} users)`);
              if (!r) return;
              const ids = selectedIds.filter((id) => id !== currentUserId);
              startBulk(async () => {
                const res = await adminBulkSetUserRoleAction({
                  userIds: ids,
                  role: "member",
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-zinc-600 bg-black/30 px-3 py-1.5 text-xs text-zinc-300"
          >
            Remove role (member)
          </button>
          <button
            type="button"
            onClick={() => {
              const subset = rows.filter((r) => selected.has(r.id));
              downloadCsv(`users-selected-${subset.length}.csv`, usersRowsToCsv(subset));
            }}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Export selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/30 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3 text-right">Orgs</th>
              <th className="px-3 py-3 text-right">Tournaments</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Verified</th>
              <th className="px-3 py-3">Last login</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Flags</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select ${row.display_name ?? row.email}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="truncate font-medium text-violet-300 hover:underline"
                    >
                      {row.display_name?.trim() || "—"}
                    </Link>
                    {row.risk_flag_count > 0 ? (
                      <span className="w-fit rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-200">
                        Flagged
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-zinc-400">
                  {row.email}
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 text-xs text-zinc-500">
                  {row.phone ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass(row.role)}`}
                  >
                    {platformRoleLabel(row.role)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.org_count}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {row.tournament_touch_count}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${accountStatusBadgeClass(row.account_status)}`}
                  >
                    {accountStatusLabel(row.account_status)}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-400">
                  {row.email_verified ? "Yes" : "No"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "Never"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2">
                  {row.issue_count > 0 ? (
                    <span
                      className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                      title="Unverified email, risk flags, or suspended owner with live tournaments"
                    >
                      {row.issue_count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <RowMenu row={row} currentUserId={currentUserId} onDone={() => router.refresh()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
