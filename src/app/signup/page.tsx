'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setMessage('')

    const cleanName = fullName.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName) {
      setError('Please enter your full name.')
      return
    }

    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: cleanName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setPassword('')
      setConfirmPassword('')

      if (data.session) {
        router.push('/onboarding')
        router.refresh()
        return
      }

      setMessage(
        'Account created. Please check your email to confirm your account.'
      )
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f4f7] px-4 py-8">

      {/* BRAND BACKGROUND DECORATIONS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Top left */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={420}
          height={420}
          className="absolute -left-32 -top-28 w-[330px] rotate-[-12deg] opacity-[0.045] sm:w-[430px]"
        />

        {/* Top right */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={320}
          height={320}
          className="absolute -right-20 top-8 w-[250px] rotate-[18deg] opacity-[0.05] sm:w-[330px]"
        />

        {/* Bottom left */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={300}
          height={300}
          className="absolute -bottom-16 -left-20 w-[230px] rotate-[18deg] opacity-[0.04] sm:w-[300px]"
        />

        {/* Bottom right */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={440}
          height={440}
          className="absolute -bottom-40 -right-28 w-[350px] rotate-[-15deg] opacity-[0.045] sm:w-[450px]"
        />

        {/* Blue glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ceef]/[0.035] blur-3xl" />
      </div>

      {/* SIGNUP CARD */}
      <section className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-[30px] border border-[#0057ff]/10 bg-white shadow-[0_28px_80px_rgba(10,35,80,0.12)]">

        {/* Card top accent */}
        <div className="absolute left-0 top-0 h-[5px] w-full bg-gradient-to-r from-[#0057ff] via-[#00ceef] to-[#0057ff]" />

        {/* Decorative card watermark */}
        <Image
          src="/branding/kulhivaru-icon-mark.png"
          alt=""
          width={190}
          height={190}
          className="pointer-events-none absolute -right-16 -top-14 w-[180px] rotate-[15deg] opacity-[0.035]"
        />

        <div className="relative px-7 pb-8 pt-9 sm:px-10">

          {/* LOGO */}
          <div className="mb-7 flex justify-center">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={220}
              height={90}
              priority
              className="h-auto max-h-[82px] w-auto max-w-[210px] object-contain"
            />
          </div>

          {/* HEADING */}
          <div className="mb-7 text-center">
            <h1 className="text-[30px] font-extrabold tracking-tight text-[#092657]">
              Create Account
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Sign up to Kulhivaru+
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSignUp} className="space-y-5">

            {/* FULL NAME */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-xs font-bold text-[#092657]"
              >
                Full Name
              </label>

              <div className="relative">
                <div className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                  </svg>
                </div>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  disabled={loading}
                  required
                  placeholder="Full name"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-8 pr-2 text-sm text-[#092657] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-[#092657]"
              >
                Email
              </label>

              <div className="relative">
                <div className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                  placeholder="example@email.com"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-8 pr-2 text-sm text-[#092657] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-[#092657]"
              >
                Password
              </label>

              <div className="relative">
                <div className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-8 pr-14 text-sm text-[#092657] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0057ff] hover:text-[#00aeda]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-bold text-[#092657]"
              >
                Confirm Password
              </label>

              <div className="relative">
                <div className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-[#0057ff]"
                    strokeWidth="2"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  minLength={8}
                  placeholder="Confirm password"
                  className="w-full border-b border-slate-200 bg-transparent py-3 pl-8 pr-14 text-sm text-[#092657] outline-none transition placeholder:text-slate-300 focus:border-[#00ceef]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0057ff] hover:text-[#00aeda]"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
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

            {/* SUCCESS */}
            {message && (
              <div
                role="status"
                className="rounded-xl border border-[#00ceef]/20 bg-[#00ceef]/5 px-4 py-3 text-sm leading-6 text-[#092657]"
              >
                {message}
              </div>
            )}

            {/* CREATE ACCOUNT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#0057ff] to-[#00aeea] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,87,255,0.22)] transition hover:shadow-[0_10px_30px_rgba(0,87,255,0.32)] focus:outline-none focus:ring-4 focus:ring-[#00ceef]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* LOGIN LINK */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-[#0057ff] transition hover:text-[#00aeea]"
            >
              Sign In
            </Link>
          </p>

          {/* BOTTOM BRAND MARK */}
          <div className="mt-7 flex justify-center">
            <Image
              src="/branding/kulhivaru-icon-mark.png"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 object-contain opacity-30"
            />
          </div>
        </div>
      </section>
    </main>
  )
}