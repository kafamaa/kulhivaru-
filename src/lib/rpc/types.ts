export type RpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

