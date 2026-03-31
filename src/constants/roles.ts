import type { PlatformRole } from "@/src/lib/auth/types";

export const DEFAULT_ROLE: PlatformRole = "member";

/** Roles that can access the organizer dashboard */
export const ORGANIZER_ROLES: PlatformRole[] = ["organizer", "admin", "super_admin"];

/** Role that can access the admin panel */
export const ADMIN_ROLE: PlatformRole = "admin";

/** Highest platform tier */
export const SUPER_ADMIN_ROLE: PlatformRole = "super_admin";

export function isOrganizerRole(role: PlatformRole): boolean {
  return ORGANIZER_ROLES.includes(role);
}

export function isAdminRole(role: PlatformRole): boolean {
  return role === ADMIN_ROLE;
}
