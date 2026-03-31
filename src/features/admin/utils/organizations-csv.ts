import type { AdminOrgListRow } from "../queries/admin-organizations-rpc";

const ESC = (v: string) => {
  if (/[",\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
};

export function organizationsRowsToCsv(rows: AdminOrgListRow[]): string {
  const headers = [
    "id",
    "name",
    "slug",
    "owner_id",
    "owner_display_name",
    "members_count",
    "tournaments_count",
    "active_tournaments_count",
    "org_status",
    "verification_status",
    "risk_flag_count",
    "revenue_collected",
    "last_active_at",
    "created_at",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.name,
        r.slug,
        r.owner_id ?? "",
        r.owner_display_name ?? "",
        String(r.members_count),
        String(r.tournaments_count),
        String(r.active_tournaments_count),
        r.org_status,
        r.verification_status,
        String(r.risk_flag_count),
        String(r.revenue_collected),
        r.last_active_at ?? "",
        r.created_at ?? "",
      ]
        .map((c) => ESC(String(c)))
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
