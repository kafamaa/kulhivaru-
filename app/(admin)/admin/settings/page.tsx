import Link from "next/link";
import { Palette, ShieldAlert } from "lucide-react";
import { ADMIN_THEMES, ADMIN_THEME_IDS } from "@/src/features/admin/lib/admin-themes";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings & appearance</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Platform configuration (flags, notices) is mostly scaffold;{" "}
          <strong className="text-zinc-300">admin shell themes</strong> apply only
          inside this area and are saved in your browser.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/25 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="h-4 w-4 text-violet-400" aria-hidden />
          Shell themes
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Use the <strong className="text-zinc-300">Shell theme</strong> picker at the
          bottom of the left sidebar to switch presets instantly:
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ADMIN_THEME_IDS.map((id) => {
            const preset = ADMIN_THEMES[id];
            return (
              <li
                key={id}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-zinc-200">{preset.label}</span>
                <span className="mt-0.5 block text-zinc-500">{preset.description}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          The public site and organizer dashboard keep their own styling; this only
          changes gradients, accents, and sidebar chrome here.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/25 p-6">
          <h2 className="text-sm font-semibold text-white">Feature flags</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Not persisted yet. When implemented, toggles will live in the database
            and apply across server and client.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-100">
            Not wired to DB
          </span>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-6">
          <h2 className="text-sm font-semibold text-white">System notices</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Public banners / maintenance messages are not stored yet.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-zinc-600 bg-zinc-800/60 px-3 py-1 text-[11px] text-zinc-300">
            No active notices
          </span>
        </section>
      </div>

      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-100">
          <ShieldAlert className="h-4 w-4" aria-hidden />
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-red-200/80">
          Destructive actions require confirmations and audit logging before we enable
          them in production.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/audit-log"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            View audit logs
          </Link>
          <span className="inline-flex items-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200">
            Bulk deletes disabled
          </span>
        </div>
      </section>
    </div>
  );
}
