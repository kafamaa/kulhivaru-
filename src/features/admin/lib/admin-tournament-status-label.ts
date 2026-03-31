/** Maps DB tournament.status to admin UI labels (Published = upcoming, Live = ongoing). */
export function adminTournamentStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "upcoming":
      return "Published";
    case "ongoing":
      return "Live";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "draft":
      return "border-zinc-600 bg-zinc-800/80 text-zinc-200";
    case "upcoming":
      return "border-sky-500/40 bg-sky-500/15 text-sky-200";
    case "ongoing":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    case "completed":
      return "border-violet-500/40 bg-violet-500/15 text-violet-200";
    case "cancelled":
      return "border-red-500/40 bg-red-500/15 text-red-200";
    case "archived":
      return "border-zinc-600 bg-zinc-900/80 text-zinc-400";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}
