import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { OrganizerOrganization } from "../types";

/**
 * Option A: ensure the current organizer has exactly one organization.
 * Requires DB function public.ensure_my_organization().
 */
export async function ensureMyOrganization(): Promise<OrganizerOrganization | null> {
  const supabase = await createSupabaseServerClient();

  // Create if missing
  const { data: orgId, error: rpcError } = await supabase.rpc(
    "ensure_my_organization"
  );

  if (rpcError) return null;

  const id = Array.isArray(orgId) ? (orgId[0] as any) : orgId;
  const orgUuid = typeof id === "string" ? id : null;
  if (!orgUuid) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgUuid)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as unknown as string,
    name: data.name as unknown as string,
    slug: data.slug as unknown as string,
  };
}

