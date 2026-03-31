import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type {
  FinanceAccount,
  FinanceLedgerJournalRow,
  OrganizerTournamentFinanceSnapshot,
  FinanceReceivableRow,
  FinancePayableRow,
  FinanceIncomeRow,
  FinanceExpenseRow,
  FinanceTransferRow,
  FinancePaymentRow,
  FinanceLedgerLine,
  FinanceMoneyAccountType,
  FinanceReceivableStatus,
  FinancePayableStatus,
} from "../types";

function moneyToNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function uuidToString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toOptionalString(v: unknown): string | null {
  if (typeof v === "string") return v;
  return null;
}

function toBool(v: unknown): boolean {
  return v === true;
}

function toAccountType(v: unknown): FinanceMoneyAccountType | null {
  if (typeof v !== "string") return null;
  const allowed: FinanceMoneyAccountType[] = [
    "cash",
    "bank",
    "wallet",
    "receivable",
    "income",
    "expense",
    "payable",
    "advance_credit",
  ];
  return (allowed as string[]).includes(v) ? (v as FinanceMoneyAccountType) : null;
}

function toReceivableStatus(v: unknown): FinanceReceivableStatus {
  if (typeof v !== "string") return "open";
  const allowed: FinanceReceivableStatus[] = [
    "draft",
    "open",
    "partial",
    "paid",
    "overdue",
    "waived",
    "written_off",
    "void",
  ];
  return (allowed as string[]).includes(v) ? (v as FinanceReceivableStatus) : "open";
}

function toPayableStatus(v: unknown): FinancePayableStatus {
  if (typeof v !== "string") return "open";
  const allowed: FinancePayableStatus[] = [
    "draft",
    "open",
    "partial",
    "paid",
    "overdue",
    "void",
  ];
  return (allowed as string[]).includes(v) ? (v as FinancePayableStatus) : "open";
}

function formatIsoOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return v;
}

async function ensureTournamentFinanceSetup(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tournamentId: string
) {
  // 1) Ensure finance settings row exists (defaults if not published yet).
  const { data: settings, error: settingsError } = await supabase
    .from("tournament_finance_settings")
    .select(
      "tournament_id, entry_fee_amount, currency, approval_mode, payment_required_before_approval, allow_waitlist, refund_policy"
    )
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  const entryFeeAmount =
    settings && typeof settings.entry_fee_amount !== "undefined"
      ? moneyToNumber(settings.entry_fee_amount)
      : 0;

  if (settingsError && settingsError.code !== "PGRST116") {
    // PGRST116 = no rows for maybeSingle
    // Proceed with defaults if no row.
  }

  if (!settings) {
    await supabase.from("tournament_finance_settings").upsert(
      {
        tournament_id: tournamentId,
        entry_fee_amount: entryFeeAmount,
        currency: "USD",
        approval_mode: "manual",
        payment_required_before_approval: false,
        allow_waitlist: false,
        refund_policy: null,
      },
      { onConflict: "tournament_id" }
    );
  }

  const { data: ensuredSettings } = await supabase
    .from("tournament_finance_settings")
    .select(
      "entry_fee_amount, currency, approval_mode, payment_required_before_approval, allow_waitlist, refund_policy"
    )
    .eq("tournament_id", tournamentId)
    .single();

  const entryFee = moneyToNumber(ensuredSettings?.entry_fee_amount);

  // 2) Ensure a minimal account set exists.
  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("id, account_type, name")
    .eq("tournament_id", tournamentId);

  const existingTypes = new Set((accounts ?? []).map((a: any) => String(a.account_type)));

  const accountInserts: Array<{
    tournament_id: string;
    name: string;
    account_type: FinanceMoneyAccountType;
    is_default: boolean;
  }> = [];

  if (!existingTypes.has("cash")) {
    accountInserts.push({
      tournament_id: tournamentId,
      name: "Cash",
      account_type: "cash",
      is_default: true,
    });
  }
  if (!existingTypes.has("bank")) {
    accountInserts.push({
      tournament_id: tournamentId,
      name: "Bank",
      account_type: "bank",
      is_default: false,
    });
  }
  if (!existingTypes.has("receivable")) {
    accountInserts.push({
      tournament_id: tournamentId,
      name: "Team Fee Receivables",
      account_type: "receivable",
      is_default: true,
    });
  }
  if (!existingTypes.has("payable")) {
    accountInserts.push({
      tournament_id: tournamentId,
      name: "Payables",
      account_type: "payable",
      is_default: true,
    });
  }

  if (accountInserts.length > 0) {
    await supabase.from("finance_accounts").upsert(accountInserts, {
      onConflict: "tournament_id,account_type",
    });
  }

  // 3) Ensure receivables exist for all approved team entries.
  const { data: approvedEntries } = await supabase
    .from("team_entries")
    .select("id, team_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved");

  if (!approvedEntries || approvedEntries.length === 0) return;

  if (entryFee <= 0) return;

  const { data: existingReceivables } = await supabase
    .from("finance_receivables")
    .select("team_entry_id")
    .eq("tournament_id", tournamentId);

  const existingTeamEntryIds = new Set(
    (existingReceivables ?? []).map((r: any) => String(r.team_entry_id))
  );

  const newReceivables = (approvedEntries ?? [])
    .filter((e: any) => !existingTeamEntryIds.has(String(e.id)))
    .map((e: any) => ({
      tournament_id: tournamentId,
      team_entry_id: e.id,
      amount_due: entryFee,
      amount_paid: 0,
      amount_waived: 0,
      amount_remaining: entryFee,
      status: "open",
      due_at: null,
    }));

  if (newReceivables.length > 0) {
    await supabase.from("finance_receivables").upsert(newReceivables, {
      onConflict: "tournament_id,team_entry_id",
    });
  }
}

export async function getOrganizerTournamentFinanceSnapshot(
  tournamentId: string
): Promise<OrganizerTournamentFinanceSnapshot | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, status, start_date, end_date, location")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) return null;

  await ensureTournamentFinanceSetup(supabase, tournamentId);

  const { data: settingsRow } = await supabase
    .from("tournament_finance_settings")
    .select(
      "entry_fee_amount, currency, approval_mode, payment_required_before_approval, allow_waitlist, refund_policy"
    )
    .eq("tournament_id", tournamentId)
    .single();

  const entryFeeAmount = moneyToNumber(settingsRow?.entry_fee_amount);
  const currency = typeof settingsRow?.currency === "string" ? settingsRow.currency : "USD";

  // Accounts
  const { data: accountsRows } = await supabase
    .from("finance_accounts")
    .select("id, name, account_type")
    .eq("tournament_id", tournamentId);

  const allAccounts: FinanceAccount[] = (accountsRows ?? [])
    .map((a: any): FinanceAccount | null => {
      const accountType = toAccountType(a.account_type);
      if (!accountType) return null;
      return { id: uuidToString(a.id), name: String(a.name ?? a.account_type), accountType };
    })
    .filter(Boolean) as FinanceAccount[];

  const receivableAccount = allAccounts.find((a) => a.accountType === "receivable") ?? null;
  const paymentAccounts = allAccounts.filter(
    (a) => a.accountType === "cash" || a.accountType === "bank" || a.accountType === "wallet"
  );

  const accountNameById = allAccounts.reduce<Record<string, string>>((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {});

  // Receivables
  const { data: receivablesRows } = await supabase
    .from("finance_receivables")
    .select("id, team_entry_id, amount_due, amount_paid, amount_waived, amount_remaining, due_at, status")
    .eq("tournament_id", tournamentId);

  const receivableTeamEntryIds = Array.from(
    new Set((receivablesRows ?? []).map((r: any) => String(r.team_entry_id)))
  );

  const { data: teamEntryRows } = await supabase
    .from("team_entries")
    .select("id, team_id")
    .in("id", receivableTeamEntryIds.length ? receivableTeamEntryIds : ["00000000-0000-0000-0000-000000000000"]);

  const teamIds = Array.from(new Set((teamEntryRows ?? []).map((e: any) => String(e.team_id))));
  const { data: teamsRows } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", teamIds.length ? teamIds : ["00000000-0000-0000-0000-000000000000"]);

  const teamNameByTeamId = (teamsRows ?? []).reduce<Record<string, string>>((acc, t: any) => {
    acc[String(t.id)] = String(t.name ?? "TBD");
    return acc;
  }, {});

  const teamIdByTeamEntryId = (teamEntryRows ?? []).reduce<Record<string, string>>((acc, te: any) => {
    acc[String(te.id)] = String(te.team_id ?? "");
    return acc;
  }, {});

  const receivables: FinanceReceivableRow[] = (receivablesRows ?? []).map((r: any) => {
    const teamEntryId = String(r.team_entry_id);
    const teamId = teamIdByTeamEntryId[teamEntryId] ?? "";
    const teamName = teamNameByTeamId[teamId] ?? "TBD";

    return {
      id: String(r.id),
      teamEntryId,
      teamName,
      amountDue: moneyToNumber(r.amount_due),
      amountPaid: moneyToNumber(r.amount_paid),
      amountWaived: moneyToNumber(r.amount_waived),
      amountRemaining: moneyToNumber(r.amount_remaining),
      dueAt: formatIsoOrNull(r.due_at),
      status: toReceivableStatus(r.status),
    };
  });

  const expectedRevenue = receivables.reduce((sum, r) => sum + r.amountDue, 0);
  const outstandingReceivables = receivables.reduce((sum, r) => {
    if (r.status === "paid" || r.status === "void" || r.status === "written_off") return sum;
    return sum + r.amountRemaining;
  }, 0);

  // Payments
  const { data: paymentsRows } = await supabase
    .from("finance_payments")
    .select(
      "id, receivable_id, team_entry_id, amount, payment_date, account_id, reference, notes, status"
    )
    .eq("tournament_id", tournamentId)
    .order("payment_date", { ascending: false });

  const paymentAccountsById = new Map<string, FinanceAccount>();
  for (const a of allAccounts) paymentAccountsById.set(a.id, a);

  const teamNameByTeamEntryId = (teamEntryRows ?? []).reduce<Record<string, string>>((acc, te: any) => {
    const teamId = String(te.team_id ?? "");
    acc[String(te.id)] = teamNameByTeamId[teamId] ?? "TBD";
    return acc;
  }, {});

  const payments: FinancePaymentRow[] = (paymentsRows ?? []).map((p: any) => {
    const accountId = String(p.account_id ?? "");
    const accountName = paymentAccountsById.get(accountId)?.name ?? "Account";

    const teamEntryId = String(p.team_entry_id ?? "");
    const teamName = teamNameByTeamEntryId[teamEntryId] ?? "TBD";

    return {
      id: String(p.id),
      receivableId: String(p.receivable_id),
      teamEntryId,
      teamName,
      amount: moneyToNumber(p.amount),
      paymentDate: String(p.payment_date),
      accountId,
      accountName,
      reference: toOptionalString(p.reference),
      notes: toOptionalString(p.notes),
    };
  });

  const collectedRevenue = (paymentsRows ?? []).reduce((sum: number, p: any) => {
    const status = String(p.status ?? "posted");
    if (status !== "posted") return sum;
    return sum + moneyToNumber(p.amount);
  }, 0);

  // Income
  const { data: incomeRows } = await supabase
    .from("finance_income")
    .select("id, income_type, source_name, amount, reference, notes, status, created_at")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  const income: FinanceIncomeRow[] = (incomeRows ?? []).map((r: any) => ({
    id: String(r.id),
    incomeType: String(r.income_type ?? "misc"),
    sourceName: toOptionalString(r.source_name),
    amount: moneyToNumber(r.amount),
    reference: toOptionalString(r.reference),
    notes: toOptionalString(r.notes),
    status: String(r.status ?? "posted"),
    createdAt: String(r.created_at ?? ""),
  }));

  const totalIncome = income.reduce((sum, r) => {
    if (r.status !== "posted") return sum;
    return sum + r.amount;
  }, 0);

  // Expenses
  const { data: expenseRows } = await supabase
    .from("finance_expenses")
    .select("id, title, category, vendor, amount, reference, notes, status, created_at")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  const expenses: FinanceExpenseRow[] = (expenseRows ?? []).map((e: any) => ({
    id: String(e.id),
    title: String(e.title ?? ""),
    category: toOptionalString(e.category),
    vendor: toOptionalString(e.vendor),
    amount: moneyToNumber(e.amount),
    reference: toOptionalString(e.reference),
    notes: toOptionalString(e.notes),
    status: String(e.status ?? "draft"),
    createdAt: String(e.created_at ?? ""),
  }));

  const totalExpenses = expenses.reduce((sum, e) => {
    if (e.status === "draft" || e.status === "void") return sum;
    return sum + e.amount;
  }, 0);

  // Transfers
  const { data: transferRows } = await supabase
    .from("finance_transfers")
    .select("id, from_account_id, to_account_id, amount, reference, notes, status, created_at")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  const transfers: FinanceTransferRow[] = (transferRows ?? []).map((t: any) => {
    const fromId = t.from_account_id ? String(t.from_account_id) : null;
    const toId = t.to_account_id ? String(t.to_account_id) : null;
    return {
      id: String(t.id),
      fromAccountId: fromId,
      fromAccountName: fromId ? (accountNameById[fromId] ?? "Account") : "—",
      toAccountId: toId,
      toAccountName: toId ? (accountNameById[toId] ?? "Account") : "—",
      amount: moneyToNumber(t.amount),
      reference: toOptionalString(t.reference),
      notes: toOptionalString(t.notes),
      status: String(t.status ?? "posted"),
      createdAt: String(t.created_at ?? ""),
    };
  });

  // Payables
  const { data: payablesRows } = await supabase
    .from("finance_payables")
    .select("id, title, category, payee, amount_due, amount_paid, amount_remaining, due_at, status, reference, notes")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  const payables: FinancePayableRow[] = (payablesRows ?? []).map((p: any) => ({
    id: String(p.id),
    title: String(p.title ?? ""),
    category: toOptionalString(p.category),
    payee: toOptionalString(p.payee),
    amountDue: moneyToNumber(p.amount_due),
    amountPaid: moneyToNumber(p.amount_paid),
    amountRemaining: moneyToNumber(p.amount_remaining),
    dueAt: formatIsoOrNull(p.due_at),
    status: toPayableStatus(p.status),
    reference: toOptionalString(p.reference),
    notes: toOptionalString(p.notes),
  }));

  const totalPayables = payables.reduce((sum, p) => {
    if (p.status === "paid" || p.status === "void") return sum;
    return sum + p.amountRemaining;
  }, 0);

  // Cash balance derived from ledger lines
  const cashAccountIds = paymentAccounts
    .filter((a) => a.accountType === "cash" || a.accountType === "bank" || a.accountType === "wallet")
    .map((a) => a.id);

  const { data: ledgerLines } = await supabase
    .from("finance_ledger_lines")
    .select("side, amount, account_id, id, description")
    .in("account_id", cashAccountIds.length ? cashAccountIds : ["00000000-0000-0000-0000-000000000000"]);

  const cashBalance = (ledgerLines ?? []).reduce((sum, l: any) => {
    const side = String(l.side);
    const amount = moneyToNumber(l.amount);
    return side === "debit" ? sum + amount : sum - amount;
  }, 0);

  const netResult = collectedRevenue + totalIncome - totalExpenses;

  // Ledger journals + lines
  const { data: journalRows } = await supabase
    .from("finance_ledger_journals")
    .select("id, journal_type, reference, posted_at, notes, status")
    .eq("tournament_id", tournamentId)
    .order("posted_at", { ascending: false })
    .limit(20);

  const journalIds = (journalRows ?? []).map((j: any) => String(j.id));
  const { data: journalLinesRows } = await supabase
    .from("finance_ledger_lines")
    .select("id, journal_id, account_id, side, amount, description")
    .in("journal_id", journalIds.length ? journalIds : ["00000000-0000-0000-0000-000000000000"]);

  const linesByJournalId = (journalLinesRows ?? []).reduce<Record<string, FinanceLedgerLine[]>>(
    (acc, l: any) => {
      const journalId = String(l.journal_id);
      if (!acc[journalId]) acc[journalId] = [];
      acc[journalId].push({
        id: String(l.id),
        accountId: String(l.account_id),
        accountName: accountNameById[String(l.account_id)] ?? "Account",
        side: String(l.side) === "debit" ? "debit" : "credit",
        amount: moneyToNumber(l.amount),
        description: toOptionalString(l.description),
      });
      return acc;
    },
    {}
  );

  const ledgerJournals: FinanceLedgerJournalRow[] = (journalRows ?? []).map((j: any) => ({
    id: String(j.id),
    journalType: String(j.journal_type ?? ""),
    reference: String(j.reference ?? ""),
    postedAt: String(j.posted_at ?? ""),
    notes: toOptionalString(j.notes),
    lines: linesByJournalId[String(j.id)] ?? [],
  }));

  return {
    tournament: {
      id: String(tournament.id),
      name: String(tournament.name ?? "Tournament"),
      status: String(tournament.status ?? "draft"),
      startDate: formatIsoOrNull(tournament.start_date),
      endDate: formatIsoOrNull(tournament.end_date),
      location: toOptionalString(tournament.location),
    },
    settings: {
      entryFeeAmount,
      currency,
      approvalMode: String(settingsRow?.approval_mode ?? "manual"),
      paymentRequiredBeforeApproval: toBool(settingsRow?.payment_required_before_approval),
      allowWaitlist: toBool(settingsRow?.allow_waitlist),
      refundPolicy: toOptionalString(settingsRow?.refund_policy),
    },
    accounts: {
      receivableAccount,
      paymentAccounts,
      allAccounts,
    },
    summary: {
      expectedRevenue,
      collectedRevenue,
      totalIncome,
      outstandingReceivables,
      totalExpenses,
      totalPayables,
      cashBalance,
      netResult,
    },
    receivables,
    payables,
    income,
    expenses,
    transfers,
    payments,
    ledgerJournals,
  };
}

