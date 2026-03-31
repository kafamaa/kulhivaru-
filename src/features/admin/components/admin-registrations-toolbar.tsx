"use client";

import { useState, useTransition } from "react";
import type { AdminRegistrationListFilters } from "../queries/admin-registrations-rpc";
import { adminExportRegistrationsCsvAction } from "../actions/admin-registration-actions";
import { downloadCsv } from "../utils/organizations-csv";

export function AdminRegistrationsToolbar({
  filters,
}: {
  filters: AdminRegistrationListFilters;
}) {
  const [exportPending, startExport] = useTransition();
  const [hint, setHint] = useState(false);

  const exportAll = () => {
    startExport(async () => {
      const res = await adminExportRegistrationsCsvAction(filters);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`registrations-export-${stamp}.csv`, res.data!.csv);
    });
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
          onClick={() => setHint((v) => !v)}
          className="rounded-lg border border-dashed border-zinc-600 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
        >
          Bulk actions
        </button>
        <span
          className="rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-[10px] font-medium text-zinc-600"
          title="Use organizer tournament teams or a future force-add dialog"
        >
          Force add entry — organizer / coming
        </span>
      </div>
      {hint ? (
        <p className="max-w-md text-right text-[10px] text-zinc-500">
          Select rows in the table to approve, reject, reset to pending, waive fees, or export. Finance-altering
          bulk actions require an audit reason.
        </p>
      ) : null}
    </div>
  );
}
