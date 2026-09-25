import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-[#081f49]">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="relative z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1450px] items-center px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={175}
              height={58}
              priority
              className="h-auto max-h-[52px] w-auto"
            />
          </Link>

          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(0,87,255,0.22)] transition hover:bg-[#004de0]"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold text-[#081f49] transition hover:bg-slate-50 sm:inline-flex"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(0,87,255,0.22)] transition hover:bg-[#004de0]"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="relative">
        <div className="pointer-events-none absolute left-[-180px] top-[120px] h-[420px] w-[420px] rounded-full bg-[#00ceef]/10 blur-[100px]" />

        <div className="pointer-events-none absolute right-[-180px] top-[-80px] h-[520px] w-[520px] rounded-full bg-[#0057ff]/10 blur-[120px]" />

        <div className="mx-auto grid min-h-[650px] max-w-[1450px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:py-20">
          {/* LEFT */}

          <div className="relative z-10 max-w-[720px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#00c98d]" />

              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                Sports Competition Platform
              </span>
            </div>

            <h1 className="text-[44px] font-black leading-[1.02] tracking-[-0.045em] text-[#081f49] sm:text-[58px] lg:text-[68px]">
              Run your tournament.

              <span className="block bg-gradient-to-r from-[#0057ff] to-[#00bfe9] bg-clip-text text-transparent">
                Build the competition.
              </span>
            </h1>

            <p className="mt-7 max-w-[620px] text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Kulhivaru+ gives organizers one professional workspace to
              create tournaments, manage teams, fixtures, results,
              standings and competition operations.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-[#0057ff] px-7 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(0,87,255,0.25)] transition hover:-translate-y-0.5 hover:bg-[#004de0]"
                >
                  Open My Kulhivaru
                  <span className="ml-2">→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-[#0057ff] px-7 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(0,87,255,0.25)] transition hover:-translate-y-0.5 hover:bg-[#004de0]"
                  >
                    Create Your Workspace
                    <span className="ml-2">→</span>
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 text-sm font-extrabold text-[#081f49] shadow-sm transition hover:border-blue-200 hover:text-[#0057ff]"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            {/* BENEFITS */}

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-slate-500">
              <Benefit text="Organization workspaces" />
              <Benefit text="Tournament management" />
              <Benefit text="Built for every screen" />
            </div>
          </div>

          {/* ==================================================
              RIGHT APP PREVIEW
              ================================================== */}

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[48px] bg-gradient-to-br from-[#0057ff]/10 to-[#00ceef]/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[32px] bg-[#081f49] p-6 shadow-[0_30px_80px_rgba(8,31,73,0.22)]">
              <Image
                src="/branding/kulhivaru-icon-mark.png"
                alt=""
                width={420}
                height={420}
                loading="eager"
                className="pointer-events-none absolute -bottom-32 -right-24 h-[420px] w-[420px] rotate-[-12deg] object-contain opacity-[0.055]"
              />

              <div className="relative">
                {/* PREVIEW HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-lg font-black text-white">
                      K
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#00ceef]">
                        Organization Workspace
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-white">
                        Kulhivaru Sports Club
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[9px] font-extrabold uppercase text-emerald-300">
                    Active
                  </span>
                </div>

                {/* TOURNAMENT */}

                <div className="mt-6 rounded-[22px] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0057ff]">
                        Live Tournament
                      </p>

                      <h2 className="mt-2 text-xl font-black text-[#081f49]">
                        Kulhivaru Championship
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Football • League + Knockout
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                      ⚽
                    </div>
                  </div>

                  {/* TOURNAMENT STATS */}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold uppercase text-slate-400">
                        Teams
                      </p>

                      <p className="mt-1 text-xl font-black text-[#081f49]">
                        16
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold uppercase text-slate-400">
                        Matches
                      </p>

                      <p className="mt-1 text-xl font-black text-[#081f49]">
                        32
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-[9px] font-bold uppercase text-emerald-500">
                        Live
                      </p>

                      <p className="mt-1 text-xl font-black text-emerald-600">
                        2
                      </p>
                    </div>
                  </div>

                  {/* NEXT MATCH */}

                  <div className="mt-5 rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400">
                          Next Match
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-[#081f49]">
                          Blue Waves
                          <span className="mx-2 text-slate-300">
                            vs
                          </span>
                          United FC
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-extrabold text-[#0057ff]">
                        20:00
                      </span>
                    </div>
                  </div>
                </div>

                {/* PREVIEW BOTTOM */}

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
                      Competition
                    </p>

                    <p className="mt-2 text-sm font-extrabold text-white">
                      Manage everything
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
                      Platform
                    </p>

                    <p className="mt-2 text-sm font-extrabold text-white">
                      One workspace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURES
          ====================================================== */}

      <section className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-[1450px] px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0057ff]">
              One Competition Workspace
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Everything your tournament needs.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Start with the competition foundation and grow into a complete
              tournament operations platform.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon="🏆"
              title="Tournaments"
              description="Create and organize Football and Futsal competitions."
            />

            <FeatureCard
              icon="👥"
              title="Teams"
              description="Manage participating teams, squads and competition membership."
            />

            <FeatureCard
              icon="📅"
              title="Fixtures"
              description="Build schedules and manage match operations from one place."
            />

            <FeatureCard
              icon="📊"
              title="Standings"
              description="Track competition results, rankings and tournament progress."
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          WORKFLOW
          ====================================================== */}

      <section className="bg-[#f5f8fc]">
        <div className="mx-auto max-w-[1450px] px-5 py-16 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0057ff]">
              Simple Workflow
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              From setup to final whistle.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <WorkflowCard
              number="01"
              title="Create Organization"
              description="Create the workspace that owns and manages your competitions."
            />

            <WorkflowCard
              number="02"
              title="Create Tournament"
              description="Choose the sport and configure your tournament."
            />

            <WorkflowCard
              number="03"
              title="Manage Competition"
              description="Add teams, fixtures, matches, results and competition data."
            />

            <WorkflowCard
              number="04"
              title="Track Progress"
              description="Follow standings, tournament progress and final results."
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          CTA
          ====================================================== */}

      <section className="bg-white px-5 pb-16 pt-4 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-[1450px] overflow-hidden rounded-[28px] bg-[#081f49] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12">
          <Image
            src="/branding/kulhivaru-icon-mark.png"
            alt=""
            width={300}
            height={300}
            className="pointer-events-none absolute -bottom-28 -right-12 h-[300px] w-[300px] object-contain opacity-[0.05]"
          />

          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#00ceef]">
              Kulhivaru+
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Your competition starts here.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
              Build your organization workspace and manage your tournaments
              through one professional sports platform.
            </p>
          </div>

          <div className="relative mt-6 lg:mt-0">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-[#081f49] transition hover:bg-slate-100"
            >
              {user ? 'Open Dashboard' : 'Get Started'}
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1450px] flex-col gap-4 px-5 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/branding/kulhivaru-icon-mark.png"
              alt="Kulhivaru+"
              width={34}
              height={34}
              className="h-[34px] w-[34px] object-contain"
            />

            <div>
              <p className="font-extrabold text-[#081f49]">
                Kulhivaru+
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Competition Management
              </p>
            </div>
          </div>

          <p>
            Sports competition management platform.
          </p>
        </div>
      </footer>
    </main>
  )
}

// ============================================================
// BENEFIT
// ============================================================

function Benefit({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600">
        ✓
      </span>

      {text}
    </span>
  )
}

// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(8,31,73,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(8,31,73,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-[#081f49]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  )
}

// ============================================================
// WORKFLOW CARD
// ============================================================

function WorkflowCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(8,31,73,0.035)]">
      <span className="text-[11px] font-black tracking-[0.12em] text-[#00bfe9]">
        {number}
      </span>

      <h3 className="mt-4 text-lg font-extrabold text-[#081f49]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  )
}