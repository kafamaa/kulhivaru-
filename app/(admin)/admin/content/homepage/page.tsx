import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminHomepageContentPage() {
  return (
    <AdminSectionPlaceholder
      title="Homepage content"
      subtitle="Marketing and discovery surface for Kulhivaru+."
      bullets={[
        "Hero, featured tournaments, announcements, banners",
        "Drag-and-drop section ordering; preview before publish",
      ]}
    />
  );
}
