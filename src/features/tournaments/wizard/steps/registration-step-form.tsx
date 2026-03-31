"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationSchemaInput } from "../schemas/registration-schema";
import type { WizardRegistration } from "../types";
import { StepSectionCard } from "../components/step-section-card";
import { InlineHelp } from "../components/inline-help";

const APPROVAL_OPTIONS = [
  { value: "manual", label: "Manual — I approve each team" },
  { value: "auto", label: "Auto — approve when criteria are met" },
  { value: "payment_first", label: "Payment first — approve after payment" },
] as const;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

interface RegistrationStepFormProps {
  data: WizardRegistration;
  onChange: (data: WizardRegistration) => void;
}

export function RegistrationStepForm({ data, onChange }: RegistrationStepFormProps) {
  const form = useForm<RegistrationSchemaInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: data,
    values: data,
  });

  const approvalMode = form.watch("approvalMode");
  const hasFee = Number(form.watch("entryFee")) > 0;

  useEffect(() => {
    const sub = form.watch((values) => {
      if (values && typeof values === "object") onChange(values as WizardRegistration);
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  return (
    <form
      onSubmit={form.handleSubmit((v) => onChange(v as WizardRegistration))}
      className="space-y-6"
    >
      <StepSectionCard
        title="Registration window"
        description="When teams can register (use Basics dates or override here)"
      >
        <p className="text-xs text-slate-500">
          Uses tournament start/end from Basics. You can add a separate registration
          open/close in a future iteration.
        </p>
      </StepSectionCard>
      <StepSectionCard
        title="Approval mode"
        description="How team registrations are approved"
      >
        <div className="space-y-2">
          {APPROVAL_OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                {...form.register("approvalMode")}
                value={o.value}
                className="h-4 w-4 border-slate-600 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-200">{o.label}</span>
            </label>
          ))}
        </div>
      </StepSectionCard>
      <StepSectionCard
        title="Fees & payment"
        description="Optional entry fee and payment rules"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-200">Entry fee</label>
              <input
                type="number"
                step="0.01"
                min={0}
                {...form.register("entryFee")}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">Currency</label>
              <input
                {...form.register("currency")}
                placeholder="USD"
                className={inputClass}
                maxLength={3}
              />
            </div>
          </div>
          {hasFee && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("paymentRequiredBeforeApproval")}
                className="h-4 w-4 rounded border-slate-600 text-emerald-500"
              />
              <span className="text-sm text-slate-200">
                Require payment before approval
              </span>
            </label>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...form.register("allowWaitlist")}
              className="h-4 w-4 rounded border-slate-600 text-emerald-500"
            />
            <span className="text-sm text-slate-200">Allow waitlist when full</span>
          </label>
        </div>
      </StepSectionCard>
      <StepSectionCard
        title="Required from teams"
        description="What teams must submit when registering"
      >
        <div className="space-y-2">
          {[
            { key: "requireManagerContact", label: "Manager contact" },
            { key: "requireTeamLogo", label: "Team logo" },
            { key: "requirePlayerList", label: "Player list" },
            { key: "requireIdVerification", label: "ID verification" },
            { key: "requirePaymentReceipt", label: "Payment receipt" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register(key as keyof RegistrationSchemaInput)}
                className="h-4 w-4 rounded border-slate-600 text-emerald-500"
              />
              <span className="text-sm text-slate-200">{label}</span>
            </label>
          ))}
        </div>
      </StepSectionCard>
      <StepSectionCard
        title="Instructions & policies"
        description="Text shown to teams during registration"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200">Instructions</label>
            <textarea
              {...form.register("instructions")}
              rows={3}
              placeholder="How to register, deadlines, etc."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Refund policy</label>
            <textarea
              {...form.register("refundPolicy")}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Eligibility notes</label>
            <input {...form.register("eligibilityNotes")} className={inputClass} />
          </div>
        </div>
      </StepSectionCard>
    </form>
  );
}
