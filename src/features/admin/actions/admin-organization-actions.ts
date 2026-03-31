"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { AdminOrgListFilters } from "../queries/admin-organizations-rpc";
import { rpcAdminListOrganizations } from "../queries/admin-organizations-rpc";
import { organizationsRowsToCsv } from "../utils/organizations-csv";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function adminCreateOrganizationAction(input: {
  name: string;
  slug: string;
  ownerId: string | null;
  reason: string;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_create_organization" as never,
    {
      p_name: input.name.trim(),
      p_slug: input.slug.trim(),
      p_owner_id: input.ownerId || null,
      p_reason: input.reason.trim() || null,
    } as never
  );

  if (error) return { ok: false, error: error.message };
  const j = data as { ok?: boolean; id?: string; slug?: string; error?: string };
  if (!j?.id) return { ok: false, error: j?.error ?? "Create failed" };

  revalidatePath("/admin/organizations");
  return { ok: true, data: { id: String(j.id), slug: String(j.slug ?? "") } };
}

export async function adminSetOrganizationStatusAction(input: {
  orgId: string;
  status: "active" | "suspended" | "archived";
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_set_organization_status" as never,
    {
      p_org_id: input.orgId,
      p_status: input.status,
      p_reason: input.reason.trim(),
    } as never
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${input.orgId}`);
  return { ok: true };
}

export async function adminUpdateOrganizationAction(input: {
  orgId: string;
  payload: Record<string, unknown>;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("rpc_admin_update_organization", {
    p_org_id: input.orgId,
    p_payload: input.payload,
    p_reason: input.reason.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${input.orgId}`);
  return { ok: true };
}

export async function adminBulkSetOrganizationStatusAction(input: {
  orgIds: string[];
  status: "active" | "suspended" | "archived";
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  const supabase = await createSupabaseServerClient();
  for (const id of input.orgIds) {
    const { error } = await supabase.rpc(
      "rpc_admin_set_organization_status" as never,
      {
        p_org_id: id,
        p_status: input.status,
        p_reason: input.reason.trim(),
      } as never
    );
    if (error) failed.push(`${id}: ${error.message}`);
  }
  revalidatePath("/admin/organizations");
  if (failed.length)
    return { ok: false, error: `${failed.length} failed: ${failed.join("; ")}` };
  return { ok: true };
}

/** Full export for current filter set (all matching rows). */
export async function adminExportOrganizationsCsvAction(
  filters: AdminOrgListFilters
): Promise<ActionResult<{ csv: string }>> {
  const res = await rpcAdminListOrganizations(filters);
  if (!res.ok) return { ok: false, error: res.error };
  const csv = organizationsRowsToCsv(res.rows);
  return { ok: true, data: { csv } };
}
