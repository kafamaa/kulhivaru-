import { redirect } from "next/navigation";

/** @deprecated Use `/admin/audit-log` */
export default function AdminAuditRedirectPage() {
  redirect("/admin/audit-log");
}
