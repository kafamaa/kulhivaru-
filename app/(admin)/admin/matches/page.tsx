import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminMatchesPage() {
  return (
    <AdminSectionPlaceholder
      title="Matches"
      subtitle="Live operational control over fixtures and results."
      bullets={[
        "Table: date, tournament, teams, score, status",
        "Actions: edit, reschedule, finalize, reopen, void — all via RPC with audit",
      ]}
    />
  );
}
