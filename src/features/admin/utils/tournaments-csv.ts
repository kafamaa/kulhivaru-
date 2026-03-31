import type { AdminTournamentListRow } from "../queries/admin-tournaments-rpc";

function displayStatus(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "upcoming":
      return "Published";
    case "ongoing":
      return "Live";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

function esc(s: string): string {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tournamentsRowsToCsv(rows: AdminTournamentListRow[]): string {
  const header = [
    "id",
    "name",
    "slug",
    "organization",
    "sport",
    "season",
    "location",
    "status",
    "display_status",
    "visibility",
    "featured",
    "registration_open",
    "admin_locked",
    "categories",
    "teams",
    "registrations",
    "matches",
    "fees_collected",
    "unpaid_receivables",
    "issues",
    "start_date",
    "updated_at",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        esc(r.id),
        esc(r.name),
        esc(r.slug),
        esc(r.organization_name ?? ""),
        esc(r.sport),
        esc(r.season_label ?? ""),
        esc(r.location ?? ""),
        esc(r.status),
        esc(displayStatus(r.status)),
        esc(r.visibility),
        r.is_featured ? "yes" : "no",
        r.is_registration_open ? "yes" : "no",
        r.admin_locked ? "yes" : "no",
        String(r.categories_count),
        String(r.teams_approved_count),
        String(r.registrations_count),
        String(r.matches_count),
        String(r.fees_collected),
        String(r.unpaid_receivables_count),
        String(r.issue_count),
        esc(r.start_date ?? ""),
        esc(r.updated_at ?? ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}
