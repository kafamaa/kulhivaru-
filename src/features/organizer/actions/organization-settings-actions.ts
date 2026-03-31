"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import {
  organizationSettingsSchema,
  type OrganizationSettingsFormValues,
} from "@/src/features/organizer/schemas/organization-settings-schema";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function updateMyOrganizationAction(input: {
  organizationId: string;
  values: OrganizationSettingsFormValues;
}): Promise<ActionResult> {
  const parsed = organizationSettingsSchema.safeParse(input.values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Validation error", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
    })
    .eq("id", input.organizationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/organizer/settings");
  revalidatePath("/organizer");
  revalidatePath("/organizer/tournaments");
  return { ok: true };
}

