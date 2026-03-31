import type { AdminUserListRow } from "../queries/admin-users-rpc";
import { accountStatusLabel, platformRoleLabel } from "../lib/admin-user-labels";

function esc(s: string): string {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function usersRowsToCsv(rows: AdminUserListRow[]): string {
  const header = [
    "id",
    "display_name",
    "email",
    "phone",
    "platform_role",
    "account_status",
    "email_verified",
    "org_count",
    "tournament_touch_count",
    "risk_flags",
    "issues",
    "last_sign_in_at",
    "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        esc(r.id),
        esc(r.display_name ?? ""),
        esc(r.email),
        esc(r.phone ?? ""),
        esc(platformRoleLabel(r.role)),
        esc(accountStatusLabel(r.account_status)),
        r.email_verified ? "yes" : "no",
        String(r.org_count),
        String(r.tournament_touch_count),
        String(r.risk_flag_count),
        String(r.issue_count),
        esc(r.last_sign_in_at ?? ""),
        esc(r.created_at ?? ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}
