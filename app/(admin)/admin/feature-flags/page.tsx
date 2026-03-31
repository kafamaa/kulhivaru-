import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminFeatureFlagsPage() {
  return (
    <AdminSectionPlaceholder
      title="Feature flags"
      subtitle="Toggle platform modules without redeploying."
      bullets={[
        "Finance module, analytics, reports, media, advanced features",
        "Persist to config table + audit each change",
      ]}
    />
  );
}
