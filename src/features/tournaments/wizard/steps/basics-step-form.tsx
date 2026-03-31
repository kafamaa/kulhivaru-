"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { basicsSchema, type BasicsSchemaInput } from "../schemas/basics-schema";
import type { WizardBasics } from "../types";
import { StepSectionCard } from "../components/step-section-card";
import { InlineHelp } from "../components/inline-help";

const SPORTS = [
  "Football",
  "futsal",
  "Volleyball",
  "Basketball",
  "Badminton",
  "Table Tennis",
  "Tennis",
  "Rugby",
  "Hockey",
  "Other",
] as const;

interface BasicsStepFormProps {
  data: WizardBasics;
  onChange: (data: WizardBasics) => void;
  onSportSelected?: (sport: string) => void;
  sportRulesNotice?: string | null;
  onBlur?: () => void;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function BasicsStepForm({
  data,
  onChange,
  onSportSelected,
  sportRulesNotice,
  onBlur,
}: BasicsStepFormProps) {
  const form = useForm<BasicsSchemaInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: data,
    values: data,
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      if (values && typeof values === "object") onChange(values as WizardBasics);
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = form.handleSubmit((values) => {
    onChange(values as WizardBasics);
    onBlur?.();
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepSectionCard title="Name & sport" description="Identify your tournament">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200">Tournament name *</label>
            <input
              {...form.register("tournamentName")}
              placeholder="Summer Cup 2026"
              className={inputClass}
            />
            <InlineHelp>Shown on public pages and in the organizer dashboard.</InlineHelp>
            {form.formState.errors.tournamentName && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.tournamentName.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Short name</label>
            <input
              {...form.register("shortName")}
              placeholder="e.g. SC26"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Sport *</label>
            <select
              {...form.register("sport", {
                onChange: (e) => {
                  const nextSport = String(e.target.value ?? "");
                  onSportSelected?.(nextSport);
                },
              })}
              className={inputClass}
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {sportRulesNotice ? (
              <p className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                {sportRulesNotice}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Description</label>
            <textarea
              {...form.register("description")}
              rows={3}
              placeholder="Brief description for teams and fans"
              className={inputClass}
            />
          </div>
        </div>
      </StepSectionCard>
      <StepSectionCard title="Dates" description="When the tournament runs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-200">Start date *</label>
            <input type="date" {...form.register("startDate")} className={inputClass} />
            {form.formState.errors.startDate && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">End date *</label>
            <input type="date" {...form.register("endDate")} className={inputClass} />
            {form.formState.errors.endDate && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.endDate.message}
              </p>
            )}
          </div>
        </div>
        <InlineHelp>Registration window can be set in the Registration step.</InlineHelp>
      </StepSectionCard>
      <StepSectionCard title="Location & venue" description="Where matches take place">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-200">Country</label>
              <input {...form.register("country")} placeholder="Maldives" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">City</label>
              <input {...form.register("city")} placeholder="Malé" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Venue name</label>
            <input
              {...form.register("venueName")}
              placeholder="National Stadium"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Venue notes</label>
            <input
              {...form.register("venueNotes")}
              placeholder="Parking, access, etc."
              className={inputClass}
            />
          </div>
        </div>
      </StepSectionCard>
      <StepSectionCard title="Branding" description="Optional logo and banner URLs">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200">Logo URL</label>
            <input
              {...form.register("logoUrl")}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Banner URL</label>
            <input
              {...form.register("bannerUrl")}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </StepSectionCard>
    </form>
  );
}
