import Link from "next/link";
import type {
  ExploreStatusFilter,
  ExploreSort,
} from "@/src/features/tournaments/queries/explore-public-tournaments";

export function ActiveFilterChips({
  filters,
}: {
  filters: {
    q?: string;
    status?: ExploreStatusFilter;
    sport?: string;
    location?: string;
    organizer?: string;
    sort?: ExploreSort;
  };
}) {
  const chips: Array<{ key: string; label: string }> = [];

  const q = filters.q?.trim();
  if (q) chips.push({ key: "q", label: `“${q}”` });

  if (filters.status && filters.status !== "all") {
    chips.push({
      key: "status",
      label:
        filters.status === "live"
          ? "Live"
          : filters.status.charAt(0).toUpperCase() +
            filters.status.slice(1),
    });
  }

  if (filters.sport && filters.sport !== "all") {
    chips.push({ key: "sport", label: filters.sport });
  }

  if (filters.location && filters.location.trim()) {
    chips.push({ key: "location", label: filters.location.trim() });
  }

  if (filters.organizer && filters.organizer.trim()) {
    chips.push({ key: "organizer", label: `Organizer: ${filters.organizer.trim()}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <span
          key={c.key + c.label}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
        >
          {c.label}
        </span>
      ))}
      <Link
        href="/explore"
        className="ml-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
      >
        Clear filters
      </Link>
    </div>
  );
}

