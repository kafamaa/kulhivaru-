import Link from "next/link";
import { AccessDenied } from "@/src/components/shared/access-denied";
import { getSessionUser } from "@/src/lib/auth/session";
import { ensureMyOrganization } from "@/src/features/organizer/queries/ensure-my-organization";

export default async function OnboardingPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AccessDenied
        title="Sign in required"
        message="Please sign in to complete onboarding."
        signInHref="/auth/login"
      />
    );
  }

  if (
    user.role !== "organizer" &&
    user.role !== "admin" &&
    user.role !== "super_admin"
  ) {
    return (
      <AccessDenied
        title="Organizer onboarding"
        message="Your account is not an organizer. Switch role to continue."
        signInHref="/auth/login"
      />
    );
  }

  if (user.role === "super_admin") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h1 className="text-2xl font-semibold text-slate-50">
            Super Admin
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Platform mission control — governance, operations, and configuration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/superadmin"
              className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Open Super Admin
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Operator admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold text-slate-50">
            Welcome, Admin
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            You can manage platform moderation and analytics from the admin dashboard.
          </p>
          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Go to Admin dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Organizer onboarding (Option A)
  const org = await ensureMyOrganization();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <h1 className="text-2xl font-semibold text-slate-50">
          Organizer setup
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          We’re preparing your default organization so you can start creating tournaments.
        </p>

        {org ? (
          <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm text-emerald-100">
              Organization ready:{" "}
              <span className="font-semibold text-slate-50">{org.name}</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200 font-mono">
              slug: {org.slug}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/organizer"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Go to Organizer Dashboard
              </Link>
              <Link
                href="/organizer/settings"
                className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                Review organization settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-sm text-amber-100">
              We couldn’t create your organization right now.
            </p>
            <p className="mt-1 text-xs text-amber-200">
              Try again by going to the Organizer area.
            </p>
            <div className="mt-4">
              <Link
                href="/organizer"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Go to Organizer
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

