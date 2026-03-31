"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { AdminTournamentListFilters } from "../queries/admin-tournaments-rpc";
import { adminExportTournamentsCsvAction } from "../actions/admin-tournament-actions";
import { downloadCsv } from "../utils/organizations-csv";

export function AdminTournamentsToolbar({
  filters,
}: {
  filters: AdminTournamentListFilters;
}) {
  const [exportPending, startExport] = useTransition();
  const [bulkHint, setBulkHint] = useState(false);

  const exportAll = () => {
    startExport(async () => {
      const res = await adminExportTournamentsCsvAction(filters);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`tournaments-export-${stamp}.csv`, res.data!.csv);
    });
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/organizer/tournaments/new"
          className="rounded-lg bg-violet-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
        >
          Create tournament
        </Link>
        <button
          type="button"
          disabled={exportPending}
          onClick={exportAll}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10 disabled:opacity-50"
        >
          {exportPending ? "Exporting…" : "Export"}
        </button>
        <button
          type="button"
          onClick={() => setBulkHint((v) => !v)}
          className="rounded-lg border border-dashed border-zinc-600 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
        >
          Bulk actions
        </button>
      </div>
      {bulkHint ? (
        <p className="max-w-md text-right text-[10px] text-zinc-500">
          Select rows in the table, then use the floating bar to publish (draft only), archive, lock, unlock, or
          export the selection.
        </p>
      ) : null}
    </div>
  );
}
