import Link from "next/link";

const BENEFITS = [
  "Automatic fixtures & scheduling",
  "Live standings & results",
  "Team registration & approvals",
  "Stats tracking & reports",
];

export function OrganizerCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            Run your tournament like a pro
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Everything you need to create, manage, and promote your competition — in one place.
          </p>
          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left text-slate-200 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/organizer/tournaments/new"
            className="mt-8 inline-flex items-center rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Create Tournament
          </Link>
        </div>
      </div>
    </section>
  );
}
