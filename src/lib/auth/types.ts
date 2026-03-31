export type PlatformRole = "public" | "member" | "organizer" | "admin" | "super_admin";

export interface SessionUser {
  id: string;
  email: string | null;
  role: PlatformRole;
}

