export type PlatformRole = "member" | "organizer" | "admin" | "super_admin";

export const PLATFORM_ROLES: readonly PlatformRole[] = [
  "member",
  "organizer",
  "admin",
  "super_admin",
] as const;

export function platformRoleLabel(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "admin":
      return "Admin";
    case "organizer":
      return "Organizer";
    case "member":
      return "Member";
    default:
      return role;
  }
}

export function accountStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
    case "invited":
      return "Invited";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function roleBadgeClass(role: string): string {
  switch (role) {
    case "super_admin":
      return "border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-100";
    case "admin":
      return "border-violet-500/50 bg-violet-500/15 text-violet-100";
    case "organizer":
      return "border-emerald-500/50 bg-emerald-500/15 text-emerald-100";
    default:
      return "border-zinc-600 bg-zinc-800/80 text-zinc-200";
  }
}

export function accountStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "suspended":
      return "border-amber-500/40 bg-amber-500/15 text-amber-100";
    case "invited":
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    case "archived":
      return "border-zinc-600 bg-zinc-900/80 text-zinc-400";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}
