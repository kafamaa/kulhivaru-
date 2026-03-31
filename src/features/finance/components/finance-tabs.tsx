"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FinanceTabId, OrganizerTournamentFinanceSnapshot } from "../types";
import { FinanceReceivablesTab } from "./finance-receivables-tab";
import { FinancePayablesTab } from "./finance-payables-tab";
import { FinanceIncomeTab } from "./finance-income-tab";
import { FinanceExpensesTab } from "./finance-expenses-tab";
import { FinanceTransfersTab } from "./finance-transfers-tab";
import { updateFinanceSettingsAction } from "../actions/update-finance-settings";

function moneyToString(v: number): string {
  if (!Number.isFinite(v)) return "0.00";
  return v.toFixed(2);
}

const tabs: Array<{ id: FinanceTabId; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "receivables", label: "Receivables" },
  { id: "payables", label: "Payables" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "transfers", label: "Transfers" },
  { id: "ledger", label: "Ledger" },
  { id: "accounts", label: "Accounts" },
  { id: "budget", label: "Budget" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

function EmptyPanel(props: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h3 className="text-sm font-semibold text-slate-100">{props.title}</h3>
      <p className="mt-1 text-sm text-slate-400">{props.message}</p>
    </div>
  );
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD (US Dollar)" },
  { value: "MVR", label: "MVR (Maldivian Rufiyaa)" },
] as const;

export function FinanceTabs(props: { snapshot: OrganizerTournamentFinanceSnapshot }) {
  const { snapshot } = props;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FinanceTabId>("dashboard");
  const [settingsCurrency, setSettingsCurrency] = useState(snapshot.settings.currency);
  const [isSavingCurrency, startTransition] = useTransition();
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsCurrency(snapshot.settings.currency);
  }, [snapshot.settings.currency]);

  const s = snapshot.summary;
  const currency = snapshot.settings.currency;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Finance</h1>
            <p className="mt-1 text-sm text-slate-300">
              {snapshot.tournament.name} • {snapshot.tournament.status}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Entry fee: {moneyToString(snapshot.settings.entryFeeAmount)} {currency}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Expected</p>
              <p className="mt-1 text-lg font-semibold text-slate-50 tabular-nums">
                {moneyToString(s.expectedRevenue)} {currency}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Collected</p>
              <p className="mt-1 text-lg font-semibold text-slate-50 tabular-nums">
                {moneyToString(s.collectedRevenue)} {currency}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Outstanding</p>
              <p className="mt-1 text-lg font-semibold text-slate-50 tabular-nums">
                {moneyToString(s.outstandingReceivables)} {currency}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Cash balance</p>
              <p className="mt-1 text-lg font-semibold text-slate-50 tabular-nums">
                {moneyToString(s.cashBalance)} {currency}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Outstanding payables</p>
              <p className="mt-1 text-lg font-semibold text-slate-50 tabular-nums">
                {moneyToString(s.totalPayables)} {currency}
              </p>
            </div>
          </div>
        </div>

        {snapshot.receivables.length === 0 && snapshot.settings.entryFeeAmount > 0 ? (
          <p className="mt-3 text-sm text-amber-200">
            Receivables will appear once teams are approved for this tournament.
          </p>
        ) : null}

        {snapshot.settings.entryFeeAmount <= 0 ? (
          <p className="mt-3 text-sm text-amber-200">
            Entry fee is currently 0. Expected revenue and receivables are empty until you publish the tournament with a fee.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-medium",
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-900",
                ].join(" ")}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activeTab === "dashboard" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Revenue status</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Expected</span>
                    <span className="font-semibold text-slate-50 tabular-nums">
                      {moneyToString(s.expectedRevenue)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Collected</span>
                    <span className="font-semibold text-slate-50 tabular-nums">
                      {moneyToString(s.collectedRevenue)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Outstanding</span>
                    <span className="font-semibold text-slate-50 tabular-nums">
                      {moneyToString(s.outstandingReceivables)} {currency}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Net result</span>
                    <span className="font-semibold text-slate-50 tabular-nums">
                      {moneyToString(s.netResult)} {currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Quick actions</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Record team fee payments and track payables (venue, referees, prizes).
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                    onClick={() => setActiveTab("receivables")}
                  >
                    Receivables
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
                    onClick={() => setActiveTab("payables")}
                  >
                    Payables
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
                    onClick={() => setActiveTab("ledger")}
                  >
                    Ledger
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "receivables" ? (
            <FinanceReceivablesTab
              tournamentId={snapshot.tournament.id}
              receivables={snapshot.receivables}
              paymentAccounts={snapshot.accounts.paymentAccounts}
            />
          ) : null}

          {activeTab === "ledger" ? (
            <div className="space-y-4">
              {snapshot.ledgerJournals.length === 0 ? (
                <EmptyPanel
                  title="Ledger is empty"
                  message="Record receivable or payable payments to create audit journal entries."
                />
              ) : (
                snapshot.ledgerJournals.map((j) => (
                  <div key={j.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">{j.journalType}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">{j.reference}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(j.postedAt).toLocaleString()}</p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {j.lines.length} line{j.lines.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {j.lines.map((l) => (
                        <div key={l.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-300">
                            {l.side.toUpperCase()} • {l.accountName}
                          </span>
                          <span className="font-medium text-slate-50 tabular-nums">
                            {moneyToString(l.amount)} {currency}
                          </span>
                        </div>
                      ))}
                    </div>
                    {j.notes ? <p className="mt-3 text-sm text-slate-400">{j.notes}</p> : null}
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Currency</h3>
                <p className="mt-1 text-xs text-slate-400">
                  All amounts in this tournament will be shown in the selected currency.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 sm:w-auto"
                    value={settingsCurrency}
                    onChange={(e) => {
                      setCurrencyError(null);
                      setSettingsCurrency(e.target.value as "USD" | "MVR");
                    }}
                    disabled={isSavingCurrency}
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    onClick={() => {
                      setCurrencyError(null);
                      startTransition(async () => {
                        const res = await updateFinanceSettingsAction({
                          tournamentId: snapshot.tournament.id,
                          currency: settingsCurrency as "USD" | "MVR",
                        });
                        if (!res.ok) setCurrencyError(res.error);
                        else router.refresh();
                      });
                    }}
                    disabled={isSavingCurrency || settingsCurrency === currency}
                  >
                    {isSavingCurrency ? "Saving..." : "Save currency"}
                  </button>
                </div>
                {currencyError ? (
                  <p className="mt-2 text-sm text-rose-200">{currencyError}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Current: {currency}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Entry fee</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Amount</span>
                    <span className="font-semibold text-slate-50 tabular-nums">
                      {moneyToString(snapshot.settings.entryFeeAmount)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Approval mode</span>
                    <span className="font-semibold text-slate-50">
                      {snapshot.settings.approvalMode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-100">Rules</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Payment required before approval</span>
                    <span className="font-semibold text-slate-50">
                      {snapshot.settings.paymentRequiredBeforeApproval ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Waitlist allowed</span>
                    <span className="font-semibold text-slate-50">
                      {snapshot.settings.allowWaitlist ? "Yes" : "No"}
                    </span>
                  </div>
                  {snapshot.settings.refundPolicy ? (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500">Refund policy</div>
                      <p className="mt-1 text-sm text-slate-300">{snapshot.settings.refundPolicy}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "accounts" ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Accounts</h3>
              {snapshot.accounts.allAccounts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No accounts found.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {snapshot.accounts.allAccounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{a.name}</span>
                      <span className="text-slate-200">{a.accountType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "payables" ? (
            <FinancePayablesTab
              tournamentId={snapshot.tournament.id}
              payables={snapshot.payables}
              paymentAccounts={snapshot.accounts.paymentAccounts}
            />
          ) : null}

          {activeTab === "income" ? (
            <FinanceIncomeTab
              tournamentId={snapshot.tournament.id}
              income={snapshot.income}
            />
          ) : null}

          {activeTab === "expenses" ? (
            <FinanceExpensesTab
              tournamentId={snapshot.tournament.id}
              expenses={snapshot.expenses}
            />
          ) : null}

          {activeTab === "transfers" ? (
            <FinanceTransfersTab
              tournamentId={snapshot.tournament.id}
              transfers={snapshot.transfers}
              paymentAccounts={snapshot.accounts.paymentAccounts}
            />
          ) : null}

          {activeTab === "budget" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Budget vs actual. Planned revenue from receivables; planned expenses from payables.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Revenue</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Planned (expected)</span>
                      <span className="tabular-nums text-slate-50">{moneyToString(s.expectedRevenue)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actual (collected + income)</span>
                      <span className="tabular-nums text-slate-50">{moneyToString(s.collectedRevenue + s.totalIncome)} {currency}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Expenses</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Planned (payables)</span>
                      <span className="tabular-nums text-slate-50">{moneyToString(snapshot.payables.reduce((a, p) => a + p.amountDue, 0))} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actual</span>
                      <span className="tabular-nums text-slate-50">{moneyToString(s.totalExpenses)} {currency}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 md:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-100">Net result</h3>
                  <p className="mt-2 text-xl font-bold tabular-nums text-slate-50">
                    {moneyToString(s.netResult)} {currency}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Collected + Income − Expenses
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "reports" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Financial summary for this tournament.
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Summary report</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Team fee revenue (collected)</span>
                    <span className="font-medium tabular-nums text-slate-50">{moneyToString(s.collectedRevenue)} {currency}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Other income</span>
                    <span className="font-medium tabular-nums text-slate-50">{moneyToString(s.totalIncome)} {currency}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Total revenue</span>
                    <span className="font-semibold tabular-nums text-slate-50">{moneyToString(s.collectedRevenue + s.totalIncome)} {currency}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Expenses</span>
                    <span className="font-medium tabular-nums text-rose-200">−{moneyToString(s.totalExpenses)} {currency}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-300">Net result</span>
                    <span className="text-lg font-bold tabular-nums text-slate-50">{moneyToString(s.netResult)} {currency}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Outstanding receivables</p>
                    <p className="mt-1 font-medium text-slate-200">{moneyToString(s.outstandingReceivables)} {currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Outstanding payables</p>
                    <p className="mt-1 font-medium text-slate-200">{moneyToString(s.totalPayables)} {currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cash balance</p>
                    <p className="mt-1 font-medium text-slate-200">{moneyToString(s.cashBalance)} {currency}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

