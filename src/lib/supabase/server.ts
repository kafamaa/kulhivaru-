import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * One Supabase server client per React request (deduped).
 * Prevents multiple GoTrue instances from racing on the same cookies / refresh flow.
 */
export const createSupabaseServerClient = cache(
  async function createSupabaseServerClient(): Promise<
    SupabaseClient<Database>
  > {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Next.js allows cookie mutation only in Server Actions / Route Handlers.
            // In Server Components this can throw; treat as a no-op there.
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // no-op
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch {
              // no-op
            }
          },
        },
      }
    );
  }
);
