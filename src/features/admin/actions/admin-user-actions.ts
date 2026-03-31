"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { AdminUserListFilters } from "../queries/admin-users-rpc";
import { rpcAdminListUsers } from "../queries/admin-users-rpc";
import type { PlatformRole } from "../lib/admin-user-labels";
import { usersRowsToCsv } from "../utils/users-csv";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidateUser(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminSuspendUserAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_suspend_user" as never,
    { p_user_id: input.userId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminActivateUserAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_activate_user" as never,
    { p_user_id: input.userId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminArchiveUserAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_archive_user" as never,
    { p_user_id: input.userId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminSetUserRoleAction(input: {
  userId: string;
  role: PlatformRole;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_set_user_role" as never,
    {
      p_user_id: input.userId,
      p_role: input.role,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminUpdateUserAction(input: {
  userId: string;
  payload: Record<string, unknown>;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_update_user" as never,
    {
      p_user_id: input.userId,
      p_payload: input.payload,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminRevokeOrgAccessAction(input: {
  userId: string;
  organizationId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_revoke_org_access" as never,
    {
      p_user_id: input.userId,
      p_org_id: input.organizationId,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  revalidatePath(`/admin/organizations/${input.organizationId}`);
  return { ok: true };
}

export async function adminSetOrgMemberStatusAction(input: {
  userId: string;
  organizationId: string;
  status: "active" | "suspended";
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_set_org_member_status" as never,
    {
      p_user_id: input.userId,
      p_org_id: input.organizationId,
      p_member_status: input.status,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminSetOrgMemberRoleAction(input: {
  userId: string;
  organizationId: string;
  role: "owner" | "admin" | "member";
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_set_org_member_role" as never,
    {
      p_user_id: input.userId,
      p_org_id: input.organizationId,
      p_org_role: input.role,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateUser(input.userId);
  return { ok: true };
}

export async function adminBulkSuspendUsersAction(input: {
  userIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.userIds) {
    const res = await adminSuspendUserAction({ userId: id, reason: input.reason.trim() });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkActivateUsersAction(input: {
  userIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.userIds) {
    const res = await adminActivateUserAction({ userId: id, reason: input.reason.trim() });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkSetUserRoleAction(input: {
  userIds: string[];
  role: PlatformRole;
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.userIds) {
    const res = await adminSetUserRoleAction({
      userId: id,
      role: input.role,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminExportUsersCsvAction(
  filters: AdminUserListFilters
): Promise<ActionResult<{ csv: string }>> {
  const res = await rpcAdminListUsers(filters);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: { csv: usersRowsToCsv(res.rows) } };
}
