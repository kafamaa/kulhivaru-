import type { PublicTournamentCardData } from "@/src/features/tournaments/types";

export function StatusBadge({
  status,
  isRegistrationOpen,
}: {
  status: PublicTournamentCardData["status"];
  isRegistrationOpen?: boolean;
}) {
  const showRegistration =
    Boolean(isRegistrationOpen) && status !== "completed";

  const label = showRegistration
    ? "Registration Open"
    : status.charAt(0).toUpperCase() + status.slice(1);

  const tone =
    status === "ongoing" || showRegistration
      ? "emerald"
      : status === "upcoming"
        ? "cyan"
        : "slate";

  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide";

  if (tone === "emerald") {
    return (
      <span className={`${base} border-emerald-400/30 bg-emerald-400/10 text-emerald-200`}>
        {label}
      </span>
    );
  }

  if (tone === "cyan") {
    return (
      <span className={`${base} border-cyan-400/30 bg-cyan-400/10 text-cyan-200`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`${base} border-slate-400/30 bg-slate-400/10 text-slate-200`}>
      {label}
    </span>
  );
}

