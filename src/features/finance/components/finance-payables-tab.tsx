"use client";

import { useMemo, useState, useTransition } from "react";
import type { FinanceAccount, FinancePayableRow } from "../types";
import { createPayableAction } from "../actions/create-payable";
import { recordPayablePaymentAction } from "../actions/record-payable-payment";
import { useRouter } from "next/navigation";

function moneyToString(v: number): string {
  if (!Number.isFinite(v)) return "0.00";
  return v.toFixed(2);
}

function statusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusTone(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case "paid":
      return { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" };
    case "partial":
      return { bg: "bg-amber-500/10", text: "text-amber-200", border: "border-amber-500/30" };
    case "open":
      return { bg: "bg-sky-500/10", text: "text-sky-200", border: "border-sky-500/30" };
    case "overdue":
      return { bg: "bg-rose-500/10", text: "text-rose-200", border: "border-rose-500/30" };
    case "void":
      return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };
    default:
      return { bg: "bg-slate-500/10", text: "text-slate-200", border: "border-slate-500/30" };
  }
}

export function FinancePayablesTab(props: {
  tournamentId: string;
  payables: FinancePayableRow[];
  paymentAccounts: FinanceAccount[];
}) {
  const { tournamentId, payables, paymentAccounts } = props;
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addPayee, setAddPayee] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDueAt, setAddDueAt] = useState("");
  const [addReference, setAddReference] = useState("");
  const [addNotes, setAddNotes] = useState("");

  const [activePayableId, setActivePayableId] = useState<string | null>(null);
  const activePayable = useMemo(
    () => payables.find((p) => p.id === activePayableId) ?? null,
    [payables, activePayableId]
  );

  const defaultPaymentAccountId = paymentAccounts[0]?.id ?? "";
  const [paymentAccountId, setPaymentAccountId] = useState<string>(defaultPaymentAccountId);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openAddModal() {
    setError(null);
    setShowAddModal(true);
    setAddTitle("");
    setAddCategory("");
    setAddPayee("");
    setAddAmount("");
    setAddDueAt("");
    setAddReference("");
    setAddNotes("");
  }

  function openPaymentModal(id: string) {
    setError(null);
    setActivePayableId(id);
    setPaymentAccountId(paymentAccounts[0]?.id ?? "");
    setPaymentAmount("");
    setPaymentReference("");
    setPaymentNotes("");
  }

  function submitAdd() {
    setError(null);
    startTransition(async () => {
      const res = await createPayableAction({
        tournamentId,
        title: addTitle.trim(),
        category: addCategory.trim() || undefined,
        payee: addPayee.trim() || undefined,
        amountDue: addAmount,
        dueAt: addDueAt.trim() || undefined,
        reference: addReference.trim() || undefined,
        notes: addNotes.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setShowAddModal(false);
      router.refresh();
    });
  }

  function submitPayment() {
    if (!activePayable) return;
    setError(null);

    startTransition(async () => {
      const res = await recordPayablePaymentAction({
        tournamentId,
        payableId: activePayable.id,
        paymentAccountId,
        amount: paymentAmount,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setActivePayableId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Track money you owe: venue fees, referees, prizes, and other expenses.
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          onClick={openAddModal}
          disabled={isPending}
        >
          Add payable
        </button>
      </div>

      {payables.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
          <p className="text-sm text-slate-300">No payables yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Add venue fees, referee payments, prizes, or other expenses you need to pay out.
          </p>
          <button
            type="button"
            className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
            onClick={openAddModal}
            disabled={isPending}
          >
            Add first payable
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            <div className="col-span-3">Title / Payee</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-2">Paid</div>
            <div className="col-span-2">Remaining</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-800">
            {payables
              .slice()
              .sort((a, b) => (a.status === "paid" ? 1 : -1) - (b.status === "paid" ? 1 : -1))
              .map((p) => {
                const tone = statusTone(p.status);
                const displayName = p.payee ? `${p.title} (${p.payee})` : p.title;
                return (
                  <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="min-w-0 font-medium text-slate-100 truncate" title={displayName}>
                        {displayName}
                      </div>
                    </div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(p.amountDue)}</div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(p.amountPaid)}</div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(p.amountRemaining)}</div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                        onClick={() => openPaymentModal(p.id)}
                        disabled={
                          isPending ||
                          p.status === "paid" ||
                          p.status === "void" ||
                          p.amountRemaining <= 0
                        }
                      >
                        Record payment
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add payable modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-50">Add payable</h2>
              <button
                type="button"
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                onClick={() => setShowAddModal(false)}
                disabled={isPending}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Title *</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. Venue rental, Referee fees"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Category (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  placeholder="e.g. Venue, Referee"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Payee (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addPayee}
                  onChange={(e) => setAddPayee(e.target.value)}
                  placeholder="Who to pay"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Amount due *</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Due date (optional)</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addDueAt}
                  onChange={(e) => setAddDueAt(e.target.value)}
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Reference (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addReference}
                  onChange={(e) => setAddReference(e.target.value)}
                  placeholder="Invoice # / Contract ref"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Notes (optional)</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Any extra details"
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
                onClick={() => setShowAddModal(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                onClick={submitAdd}
                disabled={isPending || !addTitle.trim() || !addAmount.trim()}
              >
                {isPending ? "Saving..." : "Add payable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Record payment modal */}
      {activePayable ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-50">Record payment</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {activePayable.title}
                  {activePayable.payee ? ` • ${activePayable.payee}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Remaining: {moneyToString(activePayable.amountRemaining)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                onClick={() => setActivePayableId(null)}
                disabled={isPending}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Payment from</span>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                >
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Amount</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={`Max ${moneyToString(activePayable.amountRemaining)}`}
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Reference (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Check # / Transfer ref"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Notes (optional)</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any extra details"
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
                onClick={() => setActivePayableId(null)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                onClick={submitPayment}
                disabled={isPending || !paymentAmount.trim() || !paymentAccountId}
              >
                {isPending ? "Saving..." : "Save payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
