interface OrganizerTournamentReportsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentReportsPage({
  params,
}: OrganizerTournamentReportsPageProps) {
  const { id } = await params;
  // MVP: exports/reports generation is not implemented yet.
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reports & exports</h1>
        <p className="text-sm text-slate-300">
          Generate detailed views for registrations, matches, finances and more.
        </p>
        <p className="text-xs text-slate-500">Tournament ID: {id}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
          <h2 className="text-sm font-semibold text-slate-100">
            Registration reports
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            Export team lists, contact info and category splits.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
          <h2 className="text-sm font-semibold text-slate-100">
            Match & stats reports
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            Export fixtures, results and detailed statistics.
          </p>
        </div>
      </section>
    </div>
  );
}

