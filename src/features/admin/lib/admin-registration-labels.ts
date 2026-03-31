export function entryStatusLabel(s: string): string {
  switch (s) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "withdrawn":
      return "Withdrawn";
    default:
      return s;
  }
}

export function entryStatusBadgeClass(s: string): string {
  switch (s) {
    case "pending":
      return "border-amber-500/40 bg-amber-500/15 text-amber-100";
    case "approved":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-100";
    case "rejected":
      return "border-red-500/40 bg-red-500/15 text-red-100";
    case "cancelled":
    case "withdrawn":
      return "border-zinc-600 bg-zinc-900/80 text-zinc-400";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

export function paymentBucketLabel(b: string): string {
  switch (b) {
    case "paid":
      return "Paid";
    case "unpaid":
      return "Unpaid";
    case "partial":
      return "Partial";
    case "waived":
      return "Waived";
    case "voided":
      return "Voided";
    case "none":
      return "—";
    default:
      return b;
  }
}

export function paymentBucketBadgeClass(b: string): string {
  switch (b) {
    case "paid":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "unpaid":
      return "border-zinc-500/40 bg-zinc-800/60 text-zinc-300";
    case "partial":
      return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    case "waived":
      return "border-violet-500/40 bg-violet-500/10 text-violet-200";
    case "voided":
      return "border-orange-500/40 bg-orange-500/10 text-orange-200";
    default:
      return "border-white/10 bg-white/5 text-zinc-400";
  }
}
