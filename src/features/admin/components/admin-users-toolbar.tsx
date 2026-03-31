"use client";

import { useState, useTransition } from "react";
import type { AdminUserListFilters } from "../queries/admin-users-rpc";
import { adminExportUsersCsvAction } from "../actions/admin-user-actions";
import { downloadCsv } from "../utils/organizations-csv";

export function AdminUsersToolbar({ filters }: { filters: AdminUserListFilters }) {
  const [exportPending, startExport] = useTransition();
  const [hint, setHint] = useState(false);

  const exportAll = () => {
    startExport(async () => {
      const res = await adminExportUsersCsvAction(filters);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`users-export-${stamp}.csv`, res.data!.csv);
    });
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className="rounded-lg border border-dashed border-zinc-600 px-4 py-2 text-center text-xs font-medium text-zinc-500"
          title="Provision accounts via Supabase Auth or your signup flow"
        >
          Invite / create user — use Auth
        </span>
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
      </div>
      {hint ? (
        <p className="max-w-md text-right text-[10px] text-zinc-500">
          Select users below to suspend, reactivate, assign a platform role, or export CSV. Dangerous actions
          require an audit reason.
        </p>
      ) : null}
    </div>
  );
}
