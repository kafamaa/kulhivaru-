"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminOrgListRow } from "../queries/admin-organizations-rpc";
import {
  adminBulkSetOrganizationStatusAction,
  adminSetOrganizationStatusAction,
} from "../actions/admin-organization-actions";
import { downloadCsv, organizationsRowsToCsv } from "../utils/organizations-csv";

function Menu({
  org,
  onSuspended,
}: {
  org: AdminOrgListRow;
  onSuspended: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const suspend = () => {
    const r = prompt("Reason for suspension (required):") || "";
    if (!r) return;
    start(async () => {
      const res = await adminSetOrganizationStatusAction({
        orgId: org.id,
        status: "suspended",
        reason: r,
      });
      if (!res.ok) alert(res.error);
      else onSuspended();
    });
  };

  const activate = () => {
    start(async () => {
      const res = await adminSetOrganizationStatusAction({
        orgId: org.id,
        status: "active",
        reason: "Reactivated",
      });
      if (!res.ok) alert(res.error);
      else onSuspended();
    });
  };

  const archive = () => {
    const r = prompt("Reason for archive (required):") || "";
    if (!r) return;
    start(async () => {
      const res = await adminSetOrganizationStatusAction({
        orgId: org.id,
        status: "archived",
        reason: r,
      });
      if (!res.ok) alert(res.error);
      else onSuspended();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-zinc-600 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
      >
        Actions
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-zinc-700 bg-zinc-950 py-1 text-xs shadow-xl">
            <Link
              href={`/admin/organizations/${org.id}`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View details
            </Link>
            <Link
              href={`/admin/organizations/${org.id}?tab=settings`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Edit organization
            </Link>
            <div className="my-1 border-t border-zinc-800" />
            <span className="block px-3 py-1.5 text-zinc-500">Change owner — coming</span>
            <span className="block px-3 py-1.5 text-zinc-500">Manage members — coming</span>
            <Link
              href={`/admin/organizations/${org.id}?tab=tournaments`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
            >
              View tournaments
            </Link>
            <Link
              href={`/admin/organizations/${org.id}?tab=finance`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
            >
              View finance
            </Link>
            <Link
              href={`/admin/organizations/${org.id}?tab=audit`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
            >
              Audit logs
            </Link>
            <div className="my-1 border-t border-zinc-800" />
            {org.org_status !== "suspended" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-amber-300 hover:bg-zinc-900"
                onClick={() => run(suspend)}
                disabled={pending}
              >
                Suspend
              </button>
            ) : (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-emerald-300 hover:bg-zinc-900"
                onClick={() => run(activate)}
                disabled={pending}
              >
                Reactivate
              </button>
            )}
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-zinc-400 hover:bg-zinc-900"
              onClick={() => run(archive)}
              disabled={pending}
            >
              Archive
            </button>
            <span className="block px-3 py-1.5 text-zinc-600">Delete — disabled</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminOrganizationsTable({
  rows,
}: {
  rows: AdminOrgListRow[];
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

  const bulk = (status: "active" | "suspended" | "archived") => {
    const r =
      prompt(
        `Reason for bulk ${status} (${selectedIds.length} orgs):`
      )?.trim() ?? "";
    if (!r && status !== "active") return;
    startBulk(async () => {
      const res = await adminBulkSetOrganizationStatusAction({
        orgIds: selectedIds,
        status,
        reason: r || "Bulk activate",
      });
      if (!res.ok) alert(res.error);
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm">
          <span className="font-medium text-violet-100">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => bulk("suspended")}
            disabled={bulkPending}
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            Suspend
          </button>
          <button
            type="button"
            onClick={() => bulk("active")}
            disabled={bulkPending}
            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
          >
            Activate
          </button>
          <button
            type="button"
            onClick={() => bulk("archived")}
            disabled={bulkPending}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={() => {
              const subset = rows.filter((r) => selected.has(r.id));
              downloadCsv(
                `organizations-selected-${subset.length}.csv`,
                organizationsRowsToCsv(subset)
              );
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
              <th className="px-3 py-3">Organization</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3 text-right">Members</th>
              <th className="px-3 py-3 text-right">Tournaments</th>
              <th className="px-3 py-3 text-right">Active T</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Verification</th>
              <th className="px-3 py-3">Last active</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((org) => (
              <tr
                key={org.id}
                className="border-b border-white/5 hover:bg-white/[0.02]"
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(org.id)}
                    onChange={() => toggle(org.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="font-medium text-violet-300 hover:underline"
                  >
                    {org.name}
                  </Link>
                  {org.risk_flag_count > 0 ? (
                    <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                      Risk
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-400">{org.slug}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">
                  {org.owner_display_name ?? "—"}
                  {org.owner_id ? (
                    <span className="block text-[10px] text-zinc-600">
                      {org.owner_id.slice(0, 8)}…
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {org.members_count}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {org.tournaments_count}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {org.active_tournaments_count}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      org.org_status === "active"
                        ? "text-emerald-300"
                        : org.org_status === "suspended"
                          ? "text-amber-300"
                          : "text-zinc-500"
                    }
                  >
                    {org.org_status}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-400">{org.verification_status}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {org.last_active_at
                    ? new Date(org.last_active_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Menu org={org} onSuspended={() => router.refresh()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
