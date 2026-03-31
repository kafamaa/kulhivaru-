"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { AdminTournamentListRow } from "../queries/admin-tournaments-rpc";
import {
  adminBulkTournamentArchiveAction,
  adminBulkTournamentPublishAction,
  adminBulkTournamentSetLockedAction,
  adminTournamentArchiveAction,
  adminTournamentCancelAction,
  adminTournamentPublishAction,
  adminTournamentSetFeaturedAction,
  adminTournamentSetLockedAction,
  adminTournamentUnpublishAction,
  adminTournamentUpdateAction,
} from "../actions/admin-tournament-actions";
import { adminTournamentStatusLabel, statusBadgeClass } from "../lib/admin-tournament-status-label";
import { downloadCsv } from "../utils/organizations-csv";
import { tournamentsRowsToCsv } from "../utils/tournaments-csv";

function reasonPrompt(label: string): string | null {
  const r = prompt(`${label}\n\nReason (required for audit):`)?.trim() ?? "";
  return r || null;
}

function RowMenu({
  row,
  onDone,
}: {
  row: AdminTournamentListRow;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

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
          <div className="absolute right-0 z-50 mt-1 max-h-[min(70vh,420px)] w-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 py-1 text-xs shadow-xl">
            <Link
              href={`/admin/tournaments/${row.id}`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View details
            </Link>
            <Link
              href={`/organizer/t/${row.id}/settings`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Edit tournament
            </Link>
            <Link
              href={`/t/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
            >
              Public page ↗
            </Link>
            <div className="my-1 border-t border-zinc-800" />
            {row.status === "draft" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sky-300 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Publish tournament (draft → published)", async (reason) => {
                    const res = await adminTournamentPublishAction({
                      tournamentId: row.id,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Publish
              </button>
            ) : null}
            {row.status !== "draft" && row.status !== "archived" && row.status !== "cancelled" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-amber-200 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Unpublish (revert to draft)", async (reason) => {
                    const res = await adminTournamentUnpublishAction({
                      tournamentId: row.id,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Unpublish
              </button>
            ) : null}
            {!row.admin_locked ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Lock tournament (organizers blocked from critical edits)", async (reason) => {
                    const res = await adminTournamentSetLockedAction({
                      tournamentId: row.id,
                      locked: true,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Lock
              </button>
            ) : (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-emerald-300 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Unlock tournament", async (reason) => {
                    const res = await adminTournamentSetLockedAction({
                      tournamentId: row.id,
                      locked: false,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Unlock
              </button>
            )}
            {row.status !== "cancelled" && row.status !== "archived" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-red-300 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Cancel tournament", async (reason) => {
                    const res = await adminTournamentCancelAction({
                      tournamentId: row.id,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Cancel
              </button>
            ) : null}
            {row.status !== "archived" ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-zinc-400 hover:bg-zinc-900"
                disabled={pending}
                onClick={() =>
                  act("Archive tournament", async (reason) => {
                    const res = await adminTournamentArchiveAction({
                      tournamentId: row.id,
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  })
                }
              >
                Archive
              </button>
            ) : null}
            <div className="my-1 border-t border-zinc-800" />
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              disabled={pending}
              onClick={() =>
                act(
                  row.is_registration_open ? "Close registration" : "Reopen registration",
                  async (reason) => {
                    const res = await adminTournamentUpdateAction({
                      tournamentId: row.id,
                      payload: { is_registration_open: !row.is_registration_open },
                      reason,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  }
                )
              }
            >
              {row.is_registration_open ? "Close registration" : "Reopen registration"}
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              disabled={pending}
              onClick={() =>
                act(row.is_featured ? "Remove featured" : "Mark featured", async (reason) => {
                  const res = await adminTournamentSetFeaturedAction({
                    tournamentId: row.id,
                    featured: !row.is_featured,
                    reason,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              {row.is_featured ? "Unfeature" : "Mark featured"}
            </button>
            <div className="my-1 border-t border-zinc-800" />
            <span className="block px-3 py-1.5 text-zinc-600">Duplicate — coming soon</span>
            <span className="block px-3 py-1.5 text-zinc-600">Regenerate / clear fixtures — coming soon</span>
            <span className="block px-3 py-1.5 text-zinc-600">Delete — disabled</span>
            <Link
              href={`/admin/tournaments/${row.id}?tab=audit`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View audit logs
            </Link>
            <Link
              href="/admin/audit-log"
              className="block px-3 py-2 text-zinc-500 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Global audit log
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminTournamentsTable({ rows }: { rows: AdminTournamentListRow[] }) {
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
              const r = bulkReason(`Publish selected (draft only, ${selectedIds.length} tournaments)`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkTournamentPublishAction({
                  tournamentIds: selectedIds,
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/30"
          >
            Publish selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Archive selected (${selectedIds.length})`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkTournamentArchiveAction({
                  tournamentIds: selectedIds,
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
          >
            Archive selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Lock selected (${selectedIds.length})`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkTournamentSetLockedAction({
                  tournamentIds: selectedIds,
                  locked: true,
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Lock selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Unlock selected (${selectedIds.length})`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkTournamentSetLockedAction({
                  tournamentIds: selectedIds,
                  locked: false,
                  reason: r,
                });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Unlock selected
          </button>
          <button
            type="button"
            onClick={() => {
              const subset = rows.filter((r) => selected.has(r.id));
              downloadCsv(
                `tournaments-selected-${subset.length}.csv`,
                tournamentsRowsToCsv(subset)
              );
            }}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Export selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
        <table className="min-w-[1600px] w-full text-left text-sm">
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
              <th className="px-3 py-3">Tournament</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Organization</th>
              <th className="px-3 py-3">Sport</th>
              <th className="px-3 py-3">Season</th>
              <th className="px-3 py-3">Location</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Visibility</th>
              <th className="px-3 py-3 text-right">Categories</th>
              <th className="px-3 py-3 text-right">Teams</th>
              <th className="px-3 py-3 text-right">Matches</th>
              <th className="px-3 py-3 text-right">Registrations</th>
              <th className="px-3 py-3 text-right">Fees</th>
              <th className="px-3 py-3">Start</th>
              <th className="px-3 py-3">Updated</th>
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
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/admin/tournaments/${row.id}`}
                      className="truncate font-medium text-violet-300 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <Link
                      href={`/t/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-zinc-600 hover:text-zinc-400"
                      title="Public tournament"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    {row.is_featured ? (
                      <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                        Featured
                      </span>
                    ) : null}
                    {row.admin_locked ? (
                      <span className="shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        Locked
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-400">{row.slug}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">
                  {row.organization_id ? (
                    <Link
                      href={`/admin/organizations/${row.organization_id}`}
                      className="hover:text-violet-300 hover:underline"
                    >
                      {row.organization_name ?? row.organization_id.slice(0, 8) + "…"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-400">{row.sport}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">{row.season_label ?? "—"}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-zinc-500">
                  {row.location ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(row.status)}`}
                  >
                    {adminTournamentStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs capitalize text-zinc-400">{row.visibility}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.categories_count}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {row.teams_approved_count}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.matches_count}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {row.registrations_count}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-200/90">
                  {row.fees_collected.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.start_date ? new Date(row.start_date).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2">
                  {row.issue_count > 0 ? (
                    <span
                      className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                      title="Categories missing, no fixtures while live/published, or unpaid receivables"
                    >
                      {row.issue_count} issue{row.issue_count === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <RowMenu row={row} onDone={() => router.refresh()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
