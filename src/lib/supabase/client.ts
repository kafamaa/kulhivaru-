"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Always use @supabase/ssr’s module singleton (`isSingleton: true`).
 * A second module-level client duplicates GoTrue instances and can cause
 * “Too many concurrent token refresh requests” during dev / fast navigation.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: true }
  );
}
