"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  FinanceAccount,
  FinanceReceivableRow,
} from "../types";
import { recordReceivablePaymentAction } from "../actions/record-receivable-payment";
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
    case "waived":
      return { bg: "bg-violet-500/10", text: "text-violet-200", border: "border-violet-500/30" };
    default:
      return { bg: "bg-slate-500/10", text: "text-slate-200", border: "border-slate-500/30" };
  }
}

export function FinanceReceivablesTab(props: {
  tournamentId: string;
  receivables: FinanceReceivableRow[];
  paymentAccounts: FinanceAccount[];
}) {
  const { tournamentId, receivables, paymentAccounts } = props;
  const router = useRouter();

  const [activeReceivableId, setActiveReceivableId] = useState<string | null>(null);
  const activeReceivable = useMemo(
    () => receivables.find((r) => r.id === activeReceivableId) ?? null,
    [receivables, activeReceivableId]
  );

  const defaultPaymentAccountId = paymentAccounts[0]?.id ?? "";
  const [paymentAccountId, setPaymentAccountId] = useState<string>(defaultPaymentAccountId);
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openForReceivable(id: string) {
    setError(null);
    setActiveReceivableId(id);
    setPaymentAccountId(paymentAccounts[0]?.id ?? "");
    setAmount("");
    setReference("");
    setNotes("");
  }

  async function submitPayment() {
    if (!activeReceivable) return;
    setError(null);

    startTransition(async () => {
      const res = await recordReceivablePaymentAction({
        tournamentId,
        receivableId: activeReceivable.id,
        paymentAccountId,
        amount,
        reference: reference.trim() ? reference.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setActiveReceivableId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {receivables.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-300">
            No receivables yet. When teams are approved, the entry fee receivables will be created automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            <div className="col-span-3">Team</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-2">Paid</div>
            <div className="col-span-2">Remaining</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-800">
            {receivables
              .slice()
              .sort((a, b) => (a.status === "paid" ? 1 : -1) - (b.status === "paid" ? 1 : -1))
              .map((r) => {
                const tone = statusTone(r.status);
                return (
                  <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="min-w-0 font-medium text-slate-100 truncate">{r.teamName}</div>
                    </div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(r.amountDue)}</div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(r.amountPaid)}</div>
                    <div className="col-span-2 text-slate-200 tabular-nums">{moneyToString(r.amountRemaining)}</div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                        onClick={() => openForReceivable(r.id)}
                        disabled={isPending || r.status === "paid" || r.status === "void" || r.status === "written_off"}
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

      {activeReceivable ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-50">Record payment</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {activeReceivable.teamName} • Remaining {moneyToString(activeReceivable.amountRemaining)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                onClick={() => setActiveReceivableId(null)}
                disabled={isPending}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Payment account</span>
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Reference (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Receipt # / Bank ref"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Notes (optional)</span>
                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra details for this payment"
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
                onClick={() => setActiveReceivableId(null)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                onClick={submitPayment}
                disabled={isPending || !amount.trim() || !paymentAccountId}
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

