import type { AdminRegistrationListRow } from "../queries/admin-registrations-rpc";
import { entryStatusLabel, paymentBucketLabel } from "../lib/admin-registration-labels";

function esc(s: string): string {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function registrationsRowsToCsv(rows: AdminRegistrationListRow[]): string {
  const header = [
    "entry_id",
    "tournament",
    "organization",
    "team",
    "category",
    "entry_status",
    "payment",
    "amount_due",
    "amount_paid",
    "amount_remaining",
    "submitted_at",
    "reviewed_by",
    "issues",
    "duplicate_suspect",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        esc(r.id),
        esc(r.tournament_name),
        esc(r.organization_name ?? ""),
        esc(r.team_name),
        esc(r.category_name ?? ""),
        esc(entryStatusLabel(r.entry_status)),
        esc(paymentBucketLabel(r.payment_bucket)),
        String(r.amount_due),
        String(r.amount_paid),
        String(r.amount_remaining),
        esc(r.created_at ?? ""),
        esc(r.reviewed_by_name ?? ""),
        String(r.issue_count),
        r.duplicate_name_suspect ? "yes" : "no",
      ].join(",")
    );
  }
  return lines.join("\n");
}
