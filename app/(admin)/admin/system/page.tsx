import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminSystemToolsPage() {
  return (
    <AdminSectionPlaceholder
      title="System tools"
      subtitle="Operational maintenance — use with extreme care."
      bullets={[
        "Recompute standings, fix broken tournaments, resync counts",
        "Detect duplicates, repair inconsistent data",
        "Danger zone: reset tournament, unlock locked data (confirmation + reason + audit)",
      ]}
    />
  );
}
