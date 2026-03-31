export type FinanceTabId =
  | "dashboard"
  | "receivables"
  | "payables"
  | "income"
  | "expenses"
  | "transfers"
  | "ledger"
  | "accounts"
  | "budget"
  | "reports"
  | "settings";

export type FinanceMoneyAccountType =
  | "cash"
  | "bank"
  | "wallet"
  | "receivable"
  | "income"
  | "expense"
  | "payable"
  | "advance_credit";

export interface FinanceAccount {
  id: string;
  name: string;
  accountType: FinanceMoneyAccountType;
}

export type FinanceReceivableStatus =
  | "draft"
  | "open"
  | "partial"
  | "paid"
  | "overdue"
  | "waived"
  | "written_off"
  | "void";

export interface FinanceReceivableRow {
  id: string;
  teamEntryId: string;
  teamName: string;
  amountDue: number;
  amountPaid: number;
  amountWaived: number;
  amountRemaining: number;
  dueAt: string | null;
  status: FinanceReceivableStatus;
}

export type FinancePayableStatus =
  | "draft"
  | "open"
  | "partial"
  | "paid"
  | "overdue"
  | "void";

export interface FinancePayableRow {
  id: string;
  title: string;
  category: string | null;
  payee: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  dueAt: string | null;
  status: FinancePayableStatus;
  reference: string | null;
  notes: string | null;
}

export interface FinanceIncomeRow {
  id: string;
  incomeType: string;
  sourceName: string | null;
  amount: number;
  reference: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface FinanceExpenseRow {
  id: string;
  title: string;
  category: string | null;
  vendor: string | null;
  amount: number;
  reference: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface FinanceTransferRow {
  id: string;
  fromAccountId: string | null;
  fromAccountName: string;
  toAccountId: string | null;
  toAccountName: string;
  amount: number;
  reference: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface FinancePaymentRow {
  id: string;
  receivableId: string;
  teamEntryId: string;
  teamName: string;
  amount: number;
  paymentDate: string; // ISO
  accountId: string;
  accountName: string;
  reference: string | null;
  notes: string | null;
}

export interface FinanceLedgerLine {
  id: string;
  accountId: string;
  accountName: string;
  side: "debit" | "credit";
  amount: number;
  description: string | null;
}

export interface FinanceLedgerJournalRow {
  id: string;
  journalType: string;
  reference: string;
  postedAt: string;
  notes: string | null;
  lines: FinanceLedgerLine[];
}

export interface OrganizerTournamentFinanceSnapshot {
  tournament: {
    id: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
  };
  settings: {
    entryFeeAmount: number;
    currency: string;
    approvalMode: string;
    paymentRequiredBeforeApproval: boolean;
    allowWaitlist: boolean;
    refundPolicy: string | null;
  };
  accounts: {
    receivableAccount: FinanceAccount | null;
    paymentAccounts: FinanceAccount[];
    allAccounts: FinanceAccount[];
  };
  summary: {
    expectedRevenue: number;
    collectedRevenue: number;
    totalIncome: number;
    outstandingReceivables: number;
    totalExpenses: number;
    totalPayables: number;
    cashBalance: number;
    netResult: number;
  };
  receivables: FinanceReceivableRow[];
  payables: FinancePayableRow[];
  income: FinanceIncomeRow[];
  expenses: FinanceExpenseRow[];
  transfers: FinanceTransferRow[];
  payments: FinancePaymentRow[];
  ledgerJournals: FinanceLedgerJournalRow[];
}

