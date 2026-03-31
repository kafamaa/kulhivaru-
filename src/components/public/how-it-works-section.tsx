import Link from "next/link";

const STEPS = [
  {
    step: 1,
    title: "Create tournament",
    description: "Set name, sport, dates, and categories in a simple wizard.",
  },
  {
    step: 2,
    title: "Add teams",
    description: "Open registration and let teams sign up or invite them directly.",
  },
  {
    step: 3,
    title: "Generate matches",
    description: "Fixtures are created automatically from your structure.",
  },
  {
    step: 4,
    title: "Track results live",
    description: "Update scores and events in real time. Standings update instantly.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-50">
        How it works
      </h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ step, title, description }) => (
          <div
            key={step}
            className="relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
              {step}
            </div>
            <h3 className="font-semibold text-slate-50">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/organizer/tournaments/new"
          className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
        >
          Get started →
        </Link>
      </div>
    </section>
  );
}
