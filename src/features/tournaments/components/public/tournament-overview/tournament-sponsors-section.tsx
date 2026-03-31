import Image from "next/image";

export function TournamentSponsorsSection({
  sponsors,
}: {
  sponsors: Array<{ id: string; name: string; tier: string | null; logoUrl: string | null }>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.2)]">
        <h2 className="text-lg font-semibold text-slate-50">Sponsors</h2>
        {sponsors.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Sponsors will appear here once the organizer adds them.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((s) => (
              <div
                key={s.id}
                className={`rounded-2xl border bg-white/5 p-3 ${getTierBorderClass(s.tier)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-white/10">
                    {s.logoUrl ? (
                      <Image src={s.logoUrl} alt={s.name} fill className="object-contain p-1" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-200">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{s.name}</div>
                    {s.tier ? (
                      <div className="text-xs text-slate-400">{s.tier}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getTierBorderClass(tier?: string | null): string {
  const t = (tier ?? "").trim().toLowerCase();
  if (t.includes("gold")) return "border-[#D4AF37]/60";
  if (t.includes("silver")) return "border-[#C0C0C0]/60";
  if (t.includes("bronze")) return "border-[#CD7F32]/60";
  if (t.includes("platinum")) return "border-[#E5E4E2]/60";
  if (t.includes("diamond")) return "border-[#7DD3FC]/60";
  if (t.includes("partner")) return "border-[#34D399]/60";
  return "border-white/10";
}
