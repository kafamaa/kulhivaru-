import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { OrganizerOrganization } from "../types";

export async function getOrganizerOrganizations(): Promise<OrganizerOrganization[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name");
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
  }));
}
