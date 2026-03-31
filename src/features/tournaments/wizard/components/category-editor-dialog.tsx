"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategorySchemaInput } from "../schemas/category-schema";
import type { WizardCategory } from "../types";
import { StepSectionCard } from "./step-section-card";
import { InlineHelp } from "./inline-help";

const GENDER_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "mixed", label: "Mixed" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "hidden", label: "Hidden" },
  { value: "invite_only", label: "Invite only" },
] as const;

interface CategoryEditorDialogProps {
  category: WizardCategory | null;
  sport: string;
  onSave: (data: CategorySchemaInput) => void;
  onCancel: () => void;
  open: boolean;
}

export function CategoryEditorDialog({
  category,
  sport,
  onSave,
  onCancel,
  open,
}: CategoryEditorDialogProps) {
  const [manualMode, setManualMode] = useState(false);
  const form = useForm<CategorySchemaInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ?? undefined,
    values: category ?? undefined,
  });

  if (!open) return null;
  const preset = getCategoryPresetOptions(sport);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-editor-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <h2 id="category-editor-title" className="text-lg font-semibold text-slate-50">
            {category?.id ? "Edit category" : "Add category"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={form.handleSubmit(onSave)}
          className="space-y-4 p-5"
        >
          <StepSectionCard title="Details" description="Identify this category">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-200">Name *</label>
                <input
                  {...form.register("name")}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="e.g. Open Men"
                />
                <InlineHelp>Shown to teams and on public pages.</InlineHelp>
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Short label</label>
                <input
                  {...form.register("shortLabel")}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="e.g. M1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-200">Gender group</label>
                  <select
                    {...form.register("genderGroup")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-200">Visibility</label>
                  <select
                    {...form.register("visibility")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {VISIBILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Age group</label>
                <input
                  {...form.register("ageGroup")}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="e.g. U18, Senior"
                />
              </div>
            </div>
          </StepSectionCard>
          <StepSectionCard title="Teams & roster" description="Limits for this category">
            <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
              <p className="text-xs text-slate-300">
                Default values are loaded from selected sport ({sport}).
              </p>
              <button
                type="button"
                onClick={() => setManualMode((p) => !p)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200"
              >
                {manualMode ? "Use dropdown presets" : "Manual values"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200">Min teams</label>
                {manualMode ? (
                  <input
                    type="number"
                    {...form.register("minTeams")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    min={2}
                    max={256}
                  />
                ) : (
                  <select
                    {...form.register("minTeams", { valueAsNumber: true })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {preset.teamCounts.map((v) => (
                      <option key={`min-${v}`} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Max teams</label>
                {manualMode ? (
                  <input
                    type="number"
                    {...form.register("maxTeams")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    min={2}
                    max={256}
                  />
                ) : (
                  <select
                    {...form.register("maxTeams", { valueAsNumber: true })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {preset.teamCounts.map((v) => (
                      <option key={`max-${v}`} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Roster min</label>
                {manualMode ? (
                  <input
                    type="number"
                    {...form.register("rosterMin")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    min={1}
                    max={100}
                  />
                ) : (
                  <select
                    {...form.register("rosterMin", { valueAsNumber: true })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {preset.rosterSizes.map((v) => (
                      <option key={`rmin-${v}`} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Roster max</label>
                {manualMode ? (
                  <input
                    type="number"
                    {...form.register("rosterMax")}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    min={1}
                    max={100}
                  />
                ) : (
                  <select
                    {...form.register("rosterMax", { valueAsNumber: true })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    {preset.rosterSizes.map((v) => (
                      <option key={`rmax-${v}`} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-200">Match duration (min)</label>
              {manualMode ? (
                <input
                  type="number"
                  {...form.register("matchDurationMinutes")}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  min={5}
                  max={180}
                />
              ) : (
                <select
                  {...form.register("matchDurationMinutes", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                >
                  {preset.matchDurations.map((v) => (
                    <option key={`dur-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </StepSectionCard>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Save category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getCategoryPresetOptions(sport: string): {
  teamCounts: number[];
  rosterSizes: number[];
  matchDurations: number[];
} {
  const s = sport.trim().toLowerCase();
  if (s === "futsal") {
    return {
      teamCounts: [4, 6, 8, 10, 12, 16],
      rosterSizes: [8, 10, 12, 14, 16],
      matchDurations: [20, 30, 40, 50],
    };
  }
  if (s === "basketball") {
    return {
      teamCounts: [4, 6, 8, 10, 12, 16],
      rosterSizes: [8, 10, 12, 14, 16],
      matchDurations: [32, 36, 40, 48],
    };
  }
  if (s === "volleyball") {
    return {
      teamCounts: [4, 6, 8, 10, 12, 16],
      rosterSizes: [8, 10, 12, 14, 16],
      matchDurations: [45, 60, 75, 90],
    };
  }
  if (s === "badminton") {
    return {
      teamCounts: [4, 8, 16, 32, 64],
      rosterSizes: [1, 2, 3, 4],
      matchDurations: [21, 30, 45, 60],
    };
  }
  return {
    teamCounts: [4, 8, 12, 16, 24, 32],
    rosterSizes: [11, 14, 16, 18, 20, 23],
    matchDurations: [60, 70, 80, 90, 100, 120],
  };
}
