import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminNavigationPage() {
  return (
    <AdminSectionPlaceholder
      title="Navigation manager"
      subtitle="Control public and app navigation structure."
      bullets={[
        "Reorder sidebar items, rename labels, hide/show routes",
        "Role-based visibility for hybrid public/organizer experiences",
      ]}
    />
  );
}
