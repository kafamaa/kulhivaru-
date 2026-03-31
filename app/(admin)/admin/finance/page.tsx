import { AdminSectionPlaceholder } from "@/src/features/admin/components/admin-section-placeholder";

export default function AdminFinancePage() {
  return (
    <AdminSectionPlaceholder
      title="Finance"
      subtitle="Platform-wide receivables, unpaid balances, and refunds."
      bullets={[
        "Dashboard KPIs: collected, unpaid, refunded",
        "Table: tournament, team, amount, status, method",
        "Actions: mark paid, refund, void (RPC + audit)",
      ]}
    />
  );
}
