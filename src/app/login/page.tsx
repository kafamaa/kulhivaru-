'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (loginError) {
        setError('Email or password is incorrect.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f4f7] px-4 py-8">

      {/* =====================================================
          BACKGROUND BRAND DECORATION
          ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* TOP LEFT */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={420}
          height={420}
          className="absolute -left-24 -top-24 w-[320px] rotate-[-14deg] opacity-[0.035] sm:w-[400px]"
        />

        {/* TOP RIGHT */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={420}
          height={420}
          className="absolute -right-24 -top-10 w-[320px] rotate-[18deg] opacity-[0.04] sm:w-[410px]"
        />

        {/* BOTTOM LEFT */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={420}
          height={420}
          className="absolute -bottom-32 -left-24 w-[340px] rotate-[18deg] opacity-[0.035] sm:w-[430px]"
        />

        {/* BOTTOM RIGHT */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={460}
          height={460}
          className="absolute -bottom-36 -right-28 w-[360px] rotate-[-16deg] opacity-[0.04] sm:w-[450px]"
        />

        {/* CENTER SOFT GLOW */}
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ceef]/[0.025] blur-3xl" />
      </div>


      {/* =====================================================
          LOGIN CARD
          ===================================================== */}

      <section className="relative z-10 w-full max-w-[390px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(8,31,73,0.13)]">

        {/* BLUE / CYAN TOP LINE */}
        <div className="absolute left-0 top-0 h-[5px] w-full bg-gradient-to-r from-[#0057ff] via-[#008cff] to-[#00ceef]" />


        {/* CARD WATERMARK */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={170}
          height={170}
          className="pointer-events-none absolute -right-14 -top-14 w-[160px] rotate-[16deg] opacity-[0.025]"
        />


        <div className="relative px-8 pb-9 pt-9 sm:px-10">

          {/* =================================================
              LOGO
              ================================================= */}

          <div className="mb-7 flex justify-center">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={210}
              height={90}
              priority
              className="h-auto max-h-[78px] w-auto max-w-[190px] object-contain"
            />
          </div>


          {/* =================================================
              HEADING
              ================================================= */}

          <div className="mb-8 text-center">
            <h1 className="text-[30px] font-extrabold tracking-tight text-[#081f49]">
              Welcome Back
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Sign in to Kulhivaru+
            </p>
          </div>


          {/* =================================================
              FORM
              ================================================= */}

          <form onSubmit={handleLogin} className="space-y-6">

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-[#081f49]"
              >
                Email
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[17px] w-[17px] fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                  required
                  placeholder="example@email.com"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-7 pr-2 text-sm text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />
              </div>
            </div>


            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-[#081f49]"
              >
                Password
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[17px] w-[17px] fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  placeholder="Enter your password"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-7 pr-14 text-sm text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0057ff] transition hover:text-[#00aeea]"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>


              {/* FORGOT PASSWORD */}

              <div className="mt-3 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0057ff] transition hover:text-[#00aeea]"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>


            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}


            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0057ff] via-[#008cff] to-[#00bce9] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(0,87,255,0.22)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,87,255,0.28)] focus:outline-none focus:ring-4 focus:ring-[#00ceef]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>


          {/* =================================================
              SIGNUP LINK
              ================================================= */}

          <p className="mt-7 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}

            <Link
              href="/signup"
              className="font-bold text-[#0057ff] transition hover:text-[#00aeea]"
            >
              Create Account
            </Link>
          </p>


          {/* =================================================
              BOTTOM LOGO MARK
              ================================================= */}

          <div className="mt-8 flex justify-center">
            <Image
              src="/branding/kulhivaru-icon-mark.png"
              alt=""
              width={38}
              height={38}
              className="h-8 w-8 object-contain opacity-30"
            />
          </div>
        </div>
      </section>
    </main>
  )
}