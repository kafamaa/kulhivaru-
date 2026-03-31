import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminSupportPage() {
  return (
    <AdminSectionPlaceholder
      title="Support / Admin notes"
      subtitle="Internal runbook: investigations, escalations, and post-mortems."
      bullets={[
        "Internal notes, investigation logs, lightweight issue tracking",
        "Optional linkage to reports & moderation tickets",
      ]}
    />
  );
}
