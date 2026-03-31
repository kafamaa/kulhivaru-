import Link from "next/link";
import type { OrganizerAlert } from "../types";

interface AlertBannerProps {
  alert: OrganizerAlert;
}

const TYPE_STYLES: Record<string, string> = {
  pending_approvals: "border-amber-700 bg-amber-950/50 text-amber-200",
  unscheduled_matches: "border-amber-700 bg-amber-950/50 text-amber-200",
  missing_results: "border-amber-700 bg-amber-950/50 text-amber-200",
  draft_incomplete: "border-slate-600 bg-slate-900/80 text-slate-300",
};

export function AlertBanner({ alert }: AlertBannerProps) {
  const style = TYPE_STYLES[alert.type] ?? "border-slate-700 bg-slate-900 text-slate-200";
  const Wrapper = alert.href ? Link : "div";
  const wrapperProps = alert.href ? { href: alert.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`block rounded-lg border px-3 py-2 text-sm transition-colors ${style} ${
        alert.href ? "hover:bg-opacity-80" : ""
      }`}
    >
      <span className="font-medium">{alert.message}</span>
      {alert.tournamentName && (
        <span className="ml-1 text-slate-400">— {alert.tournamentName}</span>
      )}
    </Wrapper>
  );
}
