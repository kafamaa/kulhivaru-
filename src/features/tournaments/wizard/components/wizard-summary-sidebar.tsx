"use client";

import { deriveWizardSummary, deriveWarningsAndBlockers } from "../lib/wizard-summary";
import type { WizardDraft } from "../types";
import { WarningList } from "./warning-list";

interface WizardSummarySidebarProps {
  draft: WizardDraft;
  className?: string;
}

export function WizardSummarySidebar({ draft, className = "" }: WizardSummarySidebarProps) {
  const summary = deriveWizardSummary(draft);
  const { warnings, blockers } = deriveWarningsAndBlockers(draft);

  return (
    <aside
      className={`sticky top-24 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 ${className}`}
    >
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Summary
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-200">{summary.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Sport</dt>
            <dd className="text-slate-300">{summary.sport}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Dates</dt>
            <dd className="text-slate-300">{summary.dateRange}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Categories</dt>
            <dd className="text-slate-300">{summary.categoryCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Registration</dt>
            <dd className="text-slate-300">{summary.registrationSummary}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Format</dt>
            <dd className="line-clamp-2 text-slate-300">{summary.formatSummary}</dd>
          </div>
        </dl>
      </div>
      {blockers.length > 0 && (
        <WarningList items={blockers} type="blocker" />
      )}
      {warnings.length > 0 && (
        <WarningList items={warnings} type="warning" />
      )}
    </aside>
  );
}
