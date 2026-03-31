"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminRegistrationDetail } from "../queries/admin-registrations-rpc";
import {
  adminApproveEntryAction,
  adminMarkEntryPaidAction,
  adminRefundEntryAction,
  adminRejectEntryAction,
  adminRemoveEntryAction,
  adminResetEntryStatusAction,
  adminUpdateRegistrationNotesAction,
  adminWaiveEntryFeeAction,
} from "../actions/admin-registration-actions";
import {
  entryStatusBadgeClass,
  entryStatusLabel,
  paymentBucketBadgeClass,
  paymentBucketLabel,
} from "../lib/admin-registration-labels";

const TABS = ["overview", "payment", "audit", "notes"] as const;
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

export function AdminRegistrationDetailTabs({
  entryId,
  initial,
}: {
  entryId: string;
  initial: AdminRegistrationDetail;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "overview";
  const [pending, start] = useTransition();
  const [notesDraft, setNotesDraft] = useState(str(initial.entry.admin_notes));

  const e = initial.entry;
  const t = initial.tournament;
  const o = initial.organization;
  const tm = initial.team;
  const tid = str(t.id);
  const oid = o?.id != null ? str(o.id) : null;

  const hrefForTab = (x: TabId) =>
    x === "overview" ? `/admin/registrations/${entryId}` : `/admin/registrations/${entryId}?tab=${x}`;

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
    [entryId, tab]
  );

  const entryStatus = str(e.status);
  const pb = initial.payment_bucket;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 sm:gap-2">{tabNav}</div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Entry summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Registration ID</dt>
                <dd className="font-mono text-xs text-zinc-300">{entryId}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Tournament</dt>
                <dd>
                  <Link href={`/admin/tournaments/${tid}`} className="text-violet-300 hover:underline">
                    {str(t.name)}
                  </Link>
                </dd>
              </div>
              {oid ? (
                <div>
                  <dt className="text-zinc-500">Organization</dt>
                  <dd>
                    <Link href={`/admin/organizations/${oid}`} className="text-violet-300 hover:underline">
                      {str(o?.name)}
                    </Link>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-zinc-500">Team</dt>
                <dd className="text-zinc-200">{str(tm.name)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Category</dt>
                <dd className="text-zinc-400">
                  {initial.category ? str((initial.category as Record<string, unknown>).name) : "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${entryStatusBadgeClass(entryStatus)}`}
                >
                  {entryStatusLabel(entryStatus)}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${paymentBucketBadgeClass(pb)}`}
                >
                  {paymentBucketLabel(pb)}
                </span>
              </div>
              <div>
                <dt className="text-zinc-500">Submitted</dt>
                <dd className="text-zinc-400">
                  {e.created_at ? new Date(str(e.created_at)).toLocaleString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Reviewed by</dt>
                <dd className="text-zinc-400">{initial.reviewed_by_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Updated</dt>
                <dd className="text-zinc-400">
                  {e.updated_at ? new Date(str(e.updated_at)).toLocaleString() : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h3 className="text-xs font-bold uppercase text-zinc-500">Quick actions</h3>
            <div className="flex flex-col gap-2">
              {entryStatus === "pending" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-emerald-600/30 px-3 py-2 text-left text-xs text-emerald-100"
                  onClick={() => {
                    const r = prompt("Optional note:")?.trim() ?? "";
                    start(async () => {
                      const res = await adminApproveEntryAction({
                        entryId,
                        reason: r,
                        tournamentId: tid,
                      });
                      if (!res.ok) alert(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  Approve
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-red-500/15 px-3 py-2 text-left text-xs text-red-100"
                onClick={() => {
                  const r = reasonPrompt("Reject");
                  if (!r) return;
                  start(async () => {
                    const res = await adminRejectEntryAction({
                      entryId,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Reject
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-zinc-200"
                onClick={() => {
                  const r = reasonPrompt("Reset to pending");
                  if (!r) return;
                  start(async () => {
                    const res = await adminResetEntryStatusAction({
                      entryId,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Reset to pending
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-sky-500/15 px-3 py-2 text-left text-xs text-sky-100"
                onClick={() => {
                  const amtStr = prompt("Amount:")?.trim();
                  const amt = amtStr ? Number(amtStr) : NaN;
                  if (!Number.isFinite(amt) || amt <= 0) return;
                  const method = prompt("Method:")?.trim() ?? "";
                  const reference = prompt("Reference:")?.trim() ?? "";
                  const notes = prompt("Notes:")?.trim() ?? "";
                  const r = reasonPrompt("Mark paid");
                  if (!r) return;
                  start(async () => {
                    const res = await adminMarkEntryPaidAction({
                      entryId,
                      amount: amt,
                      method,
                      reference,
                      notes,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Mark paid
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-violet-500/15 px-3 py-2 text-left text-xs text-violet-100"
                onClick={() => {
                  const r = reasonPrompt("Waive fee");
                  if (!r) return;
                  start(async () => {
                    const res = await adminWaiveEntryFeeAction({
                      entryId,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Waive fee
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-orange-500/15 px-3 py-2 text-left text-xs text-orange-100"
                onClick={() => {
                  const amtStr = prompt("Refund amount:")?.trim();
                  const amt = amtStr ? Number(amtStr) : NaN;
                  if (!Number.isFinite(amt) || amt <= 0) return;
                  const r = reasonPrompt("Refund");
                  if (!r) return;
                  start(async () => {
                    const res = await adminRefundEntryAction({
                      entryId,
                      amount: amt,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Refund
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-red-950/50 px-3 py-2 text-left text-xs text-red-200"
                onClick={() => {
                  if (!confirm("Cancel this entry?")) return;
                  const r = reasonPrompt("Remove / cancel");
                  if (!r) return;
                  start(async () => {
                    const res = await adminRemoveEntryAction({
                      entryId,
                      reason: r,
                      tournamentId: tid,
                    });
                    if (!res.ok) alert(res.error);
                    else router.refresh();
                  });
                }}
              >
                Remove (cancel)
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "payment" && (
        <div className="space-y-4">
          {initial.receivable ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm">
              <h3 className="text-xs font-bold uppercase text-zinc-500">Receivable</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-zinc-200">{str(initial.receivable.status)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Due</dt>
                  <dd className="tabular-nums">{str(initial.receivable.amount_due)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Paid</dt>
                  <dd className="tabular-nums">{str(initial.receivable.amount_paid)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Remaining</dt>
                  <dd className="tabular-nums">{str(initial.receivable.amount_remaining)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Waived</dt>
                  <dd className="tabular-nums">{str(initial.receivable.amount_waived)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No receivable row yet (created when fee is applied / mark paid).</p>
          )}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xs font-bold uppercase text-zinc-500">Payments</h3>
            {initial.payments.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No payment rows.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {initial.payments.map((p) => (
                  <li key={str(p.id)} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
                    <span className="tabular-nums text-emerald-200">{str(p.amount)}</span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {p.payment_date ? new Date(str(p.payment_date)).toLocaleString() : ""}
                    </span>
                    {p.reference ? (
                      <span className="ml-2 font-mono text-xs text-zinc-400">{str(p.reference)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/organizer/t/${tid}/finance`}
              className="mt-4 inline-block text-xs text-sky-400 hover:underline"
            >
              Organizer finance →
            </Link>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            <code className="text-zinc-400">platform_admin_audit_log</code> · entity_type{" "}
            <code className="text-zinc-400">registration</code>
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
                      No audit rows yet.
                    </td>
                  </tr>
                ) : (
                  initial.audit.map((a) => (
                    <tr key={str(a.id)} className="border-b border-white/5">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
                        {a.created_at ? new Date(str(a.created_at)).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-violet-200">{str(a.action)}</td>
                      <td className="max-w-md truncate px-3 py-2 text-xs text-zinc-500">
                        {str(a.reason) || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Link href="/admin/audit-log" className="text-xs text-violet-400 hover:underline">
            Global audit log →
          </Link>
        </div>
      )}

      {tab === "notes" && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
          <label className="block text-xs text-zinc-500">
            Internal notes (stored on team entry)
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
              const r = reasonPrompt("Save notes");
              if (!r) return;
              start(async () => {
                const res = await adminUpdateRegistrationNotesAction({
                  entryId,
                  notes: notesDraft,
                  reason: r,
                  tournamentId: tid,
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
