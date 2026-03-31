import type { SessionUser } from "@/src/lib/auth/types";

/** Platform operator (`/admin`). */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}

/** Highest tier (`/superadmin`). Implies full governance scope per product spec. */
export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "super_admin";
}

export function canAccessOrganizerDashboard(user: SessionUser | null): boolean {
  return (
    user?.role === "organizer" ||
    isAdmin(user) ||
    isSuperAdmin(user)
  );
}

export function canManageTournament(user: SessionUser | null): boolean {
  return user?.role === "organizer" || isAdmin(user) || isSuperAdmin(user);
}

