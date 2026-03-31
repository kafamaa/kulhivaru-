import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth/session";
import { ProfileForm } from "@/src/features/auth/components/profile-form";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login?next=/profile");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your account and preferences.
        </p>
      </div>

      <section className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-sm font-semibold text-slate-200">
            Account information
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-0.5 font-medium text-slate-100">
                {user.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="mt-0.5">
                <span
                  className={
                    user.role === "super_admin"
                      ? "rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200"
                      : user.role === "admin"
                        ? "rounded-full border border-violet-500/50 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300"
                        : user.role === "organizer"
                          ? "rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300"
                          : "rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300"
                  }
                >
                  {user.role}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {user.role === "super_admin" ? (
              <Link
                href="/superadmin"
                className="text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                Super Admin →
              </Link>
            ) : null}
            {user.role === "organizer" || user.role === "admin" ? (
              <Link
                href="/organizer"
                className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
              >
                Organizer dashboard →
              </Link>
            ) : null}
            {user.role === "admin" || user.role === "super_admin" ? (
              <Link
                href="/admin"
                className="text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Operator admin →
              </Link>
            ) : null}
          </div>
        </div>

        <ProfileForm userId={user.id} />

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Security</h2>
          <p className="mt-2 text-sm text-slate-400">
            Change your password or manage security from the link we send to your
            email.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-3 inline-block text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Send password reset email
          </Link>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-6">
          <Link
            href="/auth/logout"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            Sign out
          </Link>
        </div>
      </section>
    </div>
  );
}
