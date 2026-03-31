interface OrganizerTournamentFinancePageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentFinancePage({
  params,
}: OrganizerTournamentFinancePageProps) {
  const { id } = await params;

  const { getOrganizerTournamentFinanceSnapshot } = await import(
    "@/src/features/finance/queries/get-organizer-tournament-finance-snapshot"
  );
  const { FinanceTabs } = await import(
    "@/src/features/finance/components/finance-tabs"
  );

  const snapshot = await getOrganizerTournamentFinanceSnapshot(id);

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
        Tournament not found.
      </div>
    );
  }

  return <FinanceTabs snapshot={snapshot} />;
}

