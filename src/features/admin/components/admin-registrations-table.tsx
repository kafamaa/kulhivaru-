"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { AdminRegistrationListRow } from "../queries/admin-registrations-rpc";
import {
  adminApproveEntryAction,
  adminBulkApproveEntriesAction,
  adminBulkRejectEntriesAction,
  adminBulkResetEntriesAction,
  adminForceApproveEntryAction,
  adminMarkEntryPaidAction,
  adminRefundEntryAction,
  adminRejectEntryAction,
  adminRemoveEntryAction,
  adminResetEntryStatusAction,
  adminWaiveEntryFeeAction,
} from "../actions/admin-registration-actions";
import {
  entryStatusBadgeClass,
  entryStatusLabel,
  paymentBucketBadgeClass,
  paymentBucketLabel,
} from "../lib/admin-registration-labels";
import { downloadCsv } from "../utils/organizations-csv";
import { registrationsRowsToCsv } from "../utils/registrations-csv";

function reasonPrompt(label: string): string | null {
  const r = prompt(`${label}\n\nReason (required for audit):`)?.trim() ?? "";
  return r || null;
}

function optionalReasonPrompt(label: string): string {
  return prompt(`${label}\n\nReason (optional):`)?.trim() ?? "";
}

function RowMenu({
  row,
  onDone,
}: {
  row: AdminRegistrationListRow;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const tid = row.tournament_id;

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
          <div className="absolute right-0 z-50 mt-1 max-h-[min(70vh,520px)] w-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 py-1 text-xs shadow-xl">
            <Link
              href={`/admin/registrations/${row.id}`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              View details
            </Link>
            <Link
              href={`/admin/tournaments/${tid}`}
              className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Open tournament
            </Link>
            {row.organization_id ? (
              <Link
                href={`/admin/organizations/${row.organization_id}`}
                className="block px-3 py-2 text-zinc-200 hover:bg-zinc-900"
                onClick={() => setOpen(false)}
              >
                Open organization
              </Link>
            ) : null}
            <Link
              href={`/t/${row.tournament_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-zinc-400 hover:bg-zinc-900"
            >
              Public tournament ↗
            </Link>
            <div className="my-1 border-t border-zinc-800" />
            {row.entry_status === "pending" ? (
              <button
                type="button"
                disabled={pending}
                className="block w-full px-3 py-2 text-left text-emerald-200 hover:bg-zinc-900"
                onClick={() => {
                  setOpen(false);
                  const r = optionalReasonPrompt("Approve registration");
                  start(async () => {
                    const res = await adminApproveEntryAction({
                      entryId: row.id,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else onDone();
                  });
                }}
              >
                Approve
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-emerald-300 hover:bg-zinc-900"
              onClick={() =>
                act("Force approve (override)", async (reason) => {
                  const res = await adminForceApproveEntryAction({
                    entryId: row.id,
                    reason,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              Force approve
            </button>
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-red-200 hover:bg-zinc-900"
              onClick={() =>
                act("Reject registration", async (reason) => {
                  const res = await adminRejectEntryAction({
                    entryId: row.id,
                    reason,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              Reject
            </button>
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-amber-200 hover:bg-zinc-900"
              onClick={() =>
                act("Reset to pending", async (reason) => {
                  const res = await adminResetEntryStatusAction({
                    entryId: row.id,
                    reason,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              Reset to pending
            </button>
            <div className="my-1 border-t border-zinc-800" />
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-sky-200 hover:bg-zinc-900"
              onClick={() => {
                setOpen(false);
                const amtStr = prompt("Amount to apply (numeric):", String(row.amount_remaining || row.amount_due))?.trim();
                const amt = amtStr ? Number(amtStr) : NaN;
                if (!Number.isFinite(amt) || amt <= 0) return;
                const method = prompt("Payment method (e.g. bank, cash):")?.trim() ?? "";
                const reference = prompt("Payment reference (optional):")?.trim() ?? "";
                const notes = prompt("Notes (optional):")?.trim() ?? "";
                const r = reasonPrompt("Mark paid");
                if (!r) return;
                start(async () => {
                  const res = await adminMarkEntryPaidAction({
                    entryId: row.id,
                    amount: amt,
                    method,
                    reference,
                    notes,
                    reason: r,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                });
              }}
            >
              Mark paid
            </button>
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-violet-200 hover:bg-zinc-900"
              onClick={() =>
                act("Waive fee", async (reason) => {
                  const res = await adminWaiveEntryFeeAction({
                    entryId: row.id,
                    reason,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                })
              }
            >
              Waive fee
            </button>
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-orange-200 hover:bg-zinc-900"
              onClick={() => {
                setOpen(false);
                const amtStr = prompt("Refund amount (max paid):")?.trim();
                const amt = amtStr ? Number(amtStr) : NaN;
                if (!Number.isFinite(amt) || amt <= 0) return;
                const r = reasonPrompt("Refund entry");
                if (!r) return;
                start(async () => {
                  const res = await adminRefundEntryAction({
                    entryId: row.id,
                    amount: amt,
                    reason: r,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                });
              }}
            >
              Refund
            </button>
            <div className="my-1 border-t border-zinc-800" />
            <button
              type="button"
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-red-300 hover:bg-zinc-900"
              onClick={() => {
                setOpen(false);
                if (!confirm("Cancel this registration entry? (sets status to cancelled)")) return;
                const r = reasonPrompt("Remove / cancel entry");
                if (!r) return;
                start(async () => {
                  const res = await adminRemoveEntryAction({
                    entryId: row.id,
                    reason: r,
                    tournamentId: tid,
                  });
                  if (!res.ok) alert(res.error);
                  else onDone();
                });
              }}
            >
              Remove entry (cancel)
            </button>
            <Link
              href={`/admin/registrations/${row.id}?tab=audit`}
              className="block px-3 py-2 text-zinc-400 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              Audit timeline
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminRegistrationsTable({ rows }: { rows: AdminRegistrationListRow[] }) {
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
              const r = bulkReason(`Approve ${selectedIds.length} entries (pending only succeed)`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkApproveEntriesAction({ entryIds: selectedIds, reason: r });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100"
          >
            Approve selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Reject ${selectedIds.length} entries`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkRejectEntriesAction({ entryIds: selectedIds, reason: r });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100"
          >
            Reject selected
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Reset ${selectedIds.length} entries to pending`);
              if (!r) return;
              startBulk(async () => {
                const res = await adminBulkResetEntriesAction({ entryIds: selectedIds, reason: r });
                if (!res.ok) alert(res.error);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Reset to pending
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => {
              const r = bulkReason(`Waive fee for ${selectedIds.length} entries`);
              if (!r) return;
              startBulk(async () => {
                const failed: string[] = [];
                for (const id of selectedIds) {
                  const row = rows.find((x) => x.id === id);
                  const res = await adminWaiveEntryFeeAction({
                    entryId: id,
                    reason: r,
                    tournamentId: row?.tournament_id,
                  });
                  if (!res.ok) failed.push(res.error);
                }
                if (failed.length) alert(`${failed.length} failed: ${failed[0]}`);
                setSelected(new Set());
                router.refresh();
              });
            }}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100"
          >
            Waive fee (selected)
          </button>
          <button
            type="button"
            onClick={() => {
              const subset = rows.filter((r) => selected.has(r.id));
              downloadCsv(
                `registrations-selected-${subset.length}.csv`,
                registrationsRowsToCsv(subset)
              );
            }}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-200"
          >
            Export selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
        <table className="min-w-[1400px] w-full text-left text-sm">
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
              <th className="px-3 py-3">Organization</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Entry</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3 text-right">Fee / due</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Reviewed by</th>
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
                    aria-label={`Select ${row.team_name}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/admin/registrations/${row.id}`}
                      className="truncate font-medium text-violet-300 hover:underline"
                    >
                      {row.tournament_name}
                    </Link>
                    <Link
                      href={`/t/${row.tournament_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-zinc-600 hover:text-zinc-400"
                      title="Public"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-600">{row.id.slice(0, 8)}…</p>
                </td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-zinc-400">
                  {row.organization_id ? (
                    <Link
                      href={`/admin/organizations/${row.organization_id}`}
                      className="hover:text-violet-300 hover:underline"
                    >
                      {row.organization_name ?? "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-200">{row.team_name}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">{row.category_name ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${entryStatusBadgeClass(row.entry_status)}`}
                  >
                    {entryStatusLabel(row.entry_status)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${paymentBucketBadgeClass(row.payment_bucket)}`}
                  >
                    {paymentBucketLabel(row.payment_bucket)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  <span className="text-zinc-500">due</span> {row.amount_due.toFixed(2)}
                  <br />
                  <span className="text-zinc-500">rem</span> {row.amount_remaining.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">{row.reviewed_by_name ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.issue_count > 0 ? (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                        {row.issue_count}
                      </span>
                    ) : null}
                    {row.duplicate_name_suspect ? (
                      <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-200">
                        Dup?
                      </span>
                    ) : null}
                    {!row.issue_count && !row.duplicate_name_suspect ? (
                      <span className="text-[10px] text-zinc-600">—</span>
                    ) : null}
                  </div>
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
