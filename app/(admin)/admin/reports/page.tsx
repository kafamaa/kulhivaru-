import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminReportsPage() {
  return (
    <AdminSectionPlaceholder
      title="Reports & moderation"
      subtitle="User reports, content flags, and trust & safety queue."
      bullets={[
        "Table: type, entity, severity, status",
        "Actions: investigate, resolve, suspend user/org",
        "Detail: evidence, notes, resolution timeline",
      ]}
    />
  );
}
