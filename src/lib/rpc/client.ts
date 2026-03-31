import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import type { RpcResult } from "./types";

export async function callRpc<TPayload, TResponse>(
  supabase: SupabaseClient<Database>,
  fn: string,
  params: TPayload
): Promise<RpcResult<TResponse>> {
  const { data, error } = await supabase.rpc<TResponse>(fn, params as any);

  if (error) {
    return { success: false, error: error.message, code: error.code };
  }

  return { success: true, data: data as TResponse };
}

