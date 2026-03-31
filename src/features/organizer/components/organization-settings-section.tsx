"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizationSettingsSchema,
  type OrganizationSettingsFormValues,
} from "@/src/features/organizer/schemas/organization-settings-schema";
import { updateMyOrganizationAction } from "@/src/features/organizer/actions/organization-settings-actions";
import { slugify } from "@/src/features/teams/lib/slugify";
import type { OrganizerOrganization } from "@/src/features/organizer/types";

export function OrganizationSettingsSection({
  organization,
}: {
  organization: OrganizerOrganization;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | undefined
  >(undefined);

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: { name: organization.name, slug: organization.slug },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({ name: organization.name, slug: organization.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.id]);

  function onSubmit(values: OrganizationSettingsFormValues) {
    setMessage(undefined);
    startTransition(async () => {
      const res = await updateMyOrganizationAction({
        organizationId: organization.id,
        values,
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as any, { message: v });
          }
        }
        return;
      }
      setMessage({ kind: "success", text: "Organization updated." });
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-50">
          Organization settings
        </h1>
        <p className="text-sm text-slate-400">
          Option A: your organizer account owns exactly one organization.
        </p>
        <p className="text-xs text-slate-500">
          ID:{" "}
          <span className="font-mono text-slate-300">
            {organization.id.slice(0, 8)}…
          </span>
        </p>
      </header>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            message.kind === "success"
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
              : "border-red-800 bg-red-950/20 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Profile</h2>
            <p className="mt-1 text-xs text-slate-500">
              The org name appears on public tournaments.
            </p>
          </div>

          <Field
            label="Organization name"
            error={form.formState.errors.name?.message}
          >
            <input
              className={inputClass(Boolean(form.formState.errors.name))}
              {...form.register("name")}
              placeholder="My Organization"
              onBlur={(e) => {
                form.setValue("name", e.target.value, { shouldValidate: true });
                if (!form.getValues("slug")) {
                  form.setValue("slug", slugify(e.target.value), {
                    shouldValidate: true,
                  });
                }
              }}
            />
          </Field>

          <Field
            label="Slug"
            hint="Used in URLs and uniqueness checks."
            error={form.formState.errors.slug?.message}
          >
            <input
              className={inputClass(Boolean(form.formState.errors.slug))}
              {...form.register("slug")}
              placeholder="my-organization"
              onBlur={(e) => {
                form.setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                });
              }}
            />
          </Field>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Changes save via server action (RLS enforced).
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
    hasError
      ? "border-red-700 focus:border-red-500 focus:ring-red-500"
      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
  }`;
}

