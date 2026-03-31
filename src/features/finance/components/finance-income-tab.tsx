"use client";

import { useState, useTransition } from "react";
import type { FinanceIncomeRow } from "../types";
import { createIncomeAction } from "../actions/create-income";
import { useRouter } from "next/navigation";

function moneyToString(v: number): string {
  if (!Number.isFinite(v)) return "0.00";
  return v.toFixed(2);
}

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const INCOME_TYPES = [
  { value: "sponsorship", label: "Sponsorship" },
  { value: "ticket_sales", label: "Ticket sales" },
  { value: "merchandise", label: "Merchandise" },
  { value: "broadcast", label: "Broadcast" },
  { value: "misc", label: "Other" },
] as const;

export function FinanceIncomeTab(props: {
  tournamentId: string;
  income: FinanceIncomeRow[];
}) {
  const { tournamentId, income } = props;
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [incomeType, setIncomeType] = useState<"sponsorship" | "ticket_sales" | "merchandise" | "broadcast" | "misc">("misc");
  const [sourceName, setSourceName] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitAdd() {
    setError(null);
    startTransition(async () => {
      const res = await createIncomeAction({
        tournamentId,
        incomeType,
        sourceName: sourceName.trim() || undefined,
        amount,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowAddModal(false);
      setSourceName("");
      setAmount("");
      setReference("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Track income beyond team fees: sponsorships, ticket sales, merchandise, broadcast rights.
        </p>
        <button
          type="button"
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          disabled={isPending}
        >
          Add income
        </button>
      </div>

      {income.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
          <p className="text-sm text-slate-300">No income records yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Add sponsorships, ticket sales, or other revenue sources.
          </p>
          <button
            type="button"
            className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
            onClick={() => setShowAddModal(true)}
            disabled={isPending}
          >
            Add first income
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Source</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-3">Date</div>
          </div>
          <div className="divide-y divide-slate-800">
            {income.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                <div className="col-span-2 text-slate-200">{typeLabel(r.incomeType)}</div>
                <div className="col-span-3 truncate text-slate-300">{r.sourceName ?? "—"}</div>
                <div className="col-span-2 font-medium tabular-nums text-slate-50">{moneyToString(r.amount)}</div>
                <div className="col-span-2 truncate text-slate-400">{r.reference ?? "—"}</div>
                <div className="col-span-3 text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-50">Add income</h2>
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
              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Type</span>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value as typeof incomeType)}
                >
                  {INCOME_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Amount *</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Source (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Sponsor name, etc."
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Reference (optional)</span>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Invoice #"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="block text-xs text-slate-400">Notes (optional)</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
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
                disabled={isPending || !amount.trim()}
              >
                {isPending ? "Saving..." : "Add income"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
