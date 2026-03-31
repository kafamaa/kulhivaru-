"use client";

import { useState, useTransition } from "react";
import type { AdminOrgListFilters } from "../queries/admin-organizations-rpc";
import { adminExportOrganizationsCsvAction } from "../actions/admin-organization-actions";
import { downloadCsv } from "../utils/organizations-csv";
import { AdminCreateOrganizationDialog } from "./admin-create-organization-dialog";

export function AdminOrganizationsToolbar({
  filters,
}: {
  filters: AdminOrgListFilters;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [exportPending, startExport] = useTransition();

  const exportAll = () => {
    startExport(async () => {
      const res = await adminExportOrganizationsCsvAction(filters);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`organizations-export-${stamp}.csv`, res.data!.csv);
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
        >
          Create organization
        </button>
        <button
          type="button"
          disabled={exportPending}
          onClick={exportAll}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10 disabled:opacity-50"
        >
          {exportPending ? "Exporting…" : "Export"}
        </button>
        <span className="rounded-lg border border-dashed border-zinc-600 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Bulk actions — select rows below
        </span>
      </div>
      <AdminCreateOrganizationDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
