'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function CreateOrganizationPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cleanName = name.trim()
  const cleanSlug = makeSlug(slug)

  const canSubmit = useMemo(() => {
    return (
      cleanName.length > 0 &&
      cleanName.length <= 120 &&
      cleanSlug.length > 0 &&
      cleanSlug.length <= 80 &&
      !loading
    )
  }, [cleanName, cleanSlug, loading])

  function handleNameChange(value: string) {
    setName(value)

    if (!slugEdited) {
      setSlug(makeSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true)
    setSlug(makeSlug(value))
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')

    const finalName = name.trim()
    const finalSlug = makeSlug(slug)
    const finalDescription = description.trim()

    if (!finalName) {
      setError('Organization name is required.')
      return
    }

    if (finalName.length > 120) {
      setError(
        'Organization name must be 120 characters or less.'
      )
      return
    }

    if (!finalSlug) {
      setError('Organization URL is required.')
      return
    }

    if (finalSlug.length > 80) {
      setError(
        'Organization URL must be 80 characters or less.'
      )
      return
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)
    ) {
      setError(
        'Organization URL can contain lowercase letters, numbers and hyphens only.'
      )
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      /*
       * The database RPC performs the official write.
       *
       * It uses auth.uid() on the database side and creates:
       *
       * 1. Organization
       * 2. Owner membership
       *
       * in one database operation.
       *
       * We never send a user ID or owner ID from the browser.
       */

      const { data, error: rpcError } =
        await supabase.rpc('create_organization', {
          organization_name: finalName,
          organization_slug: finalSlug,
          organization_description:
            finalDescription || null,
        })

      if (rpcError) {
        console.error(
          'Create organization error:',
          rpcError
        )

        if (
          rpcError.code === '23505' ||
          rpcError.message
            .toLowerCase()
            .includes('duplicate')
        ) {
          setError(
            'That organization URL is already being used. Please choose another one.'
          )
          return
        }

        if (
          rpcError.message
            .toLowerCase()
            .includes('authentication required')
        ) {
          router.replace('/login')
          router.refresh()
          return
        }

        setError(
          'We could not create the organization. Please check the information and try again.'
        )

        return
      }

      const organizationId =
        typeof data === 'string' ? data : null

      if (!organizationId) {
        setError(
          'The organization was created, but we could not open it. Please return to the dashboard.'
        )

        return
      }

      router.push(`/organizations/${organizationId}`)
      router.refresh()
    } catch (unknownError) {
      console.error(
        'Unexpected create organization error:',
        unknownError
      )

      setError(
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f2f4f7]">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6">

          <Link href="/dashboard">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={165}
              height={58}
              priority
              className="h-auto max-h-[50px] w-auto"
            />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#081f49]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>

            <span className="hidden sm:inline">
              Dashboard
            </span>
          </Link>
        </div>
      </header>


      {/* =====================================================
          PAGE
          ===================================================== */}

      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-12">

        {/* Page heading */}

        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0057ff]">
            Organization
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#081f49] sm:text-[36px]">
            Create Organization
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Create the workspace that will own and manage
            your tournaments, staff and sports operations.
          </p>
        </div>


        {/* ===================================================
            FORM CARD
            =================================================== */}

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(8,31,73,0.07)]">

          {/* Brand line */}

          <div className="h-[5px] bg-gradient-to-r from-[#0057ff] via-[#008cff] to-[#00ceef]" />

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >

            {/* Organization identity */}

            <div className="mb-7 flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057ff]/10 to-[#00ceef]/15">
                <Image
                  src="/branding/kulhivaru-icon-mark.png"
                  alt=""
                  width={38}
                  height={38}
                  className="h-9 w-9 object-contain opacity-80"
                />
              </div>

              <div>
                <h2 className="font-extrabold text-[#081f49]">
                  Organization Details
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  You will become the owner of this
                  organization.
                </p>
              </div>
            </div>


            <div className="space-y-6">

              {/* =============================================
                  NAME
                  ============================================= */}

              <div>
                <label
                  htmlFor="organization-name"
                  className="mb-2 block text-sm font-bold text-[#081f49]"
                >
                  Organization Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="organization-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  maxLength={120}
                  autoComplete="organization"
                  placeholder="Example: Kanditheemu Sports Club"
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#0057ff] focus:ring-4 focus:ring-[#0057ff]/[0.07] disabled:bg-slate-50"
                />

                <div className="mt-2 flex justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    The public name of your organization.
                  </p>

                  <span className="shrink-0 text-xs text-slate-300">
                    {name.length}/120
                  </span>
                </div>
              </div>


              {/* =============================================
                  SLUG
                  ============================================= */}

              <div>
                <label
                  htmlFor="organization-slug"
                  className="mb-2 block text-sm font-bold text-[#081f49]"
                >
                  Organization URL
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="flex min-h-[48px] overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-[#0057ff] focus-within:ring-4 focus-within:ring-[#0057ff]/[0.07]">

                  <div className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-400">
                    kulhivaru+
                  </div>

                  <input
                    id="organization-slug"
                    type="text"
                    value={slug}
                    onChange={(event) =>
                      handleSlugChange(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    maxLength={80}
                    spellCheck={false}
                    placeholder="organization-name"
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#081f49] outline-none placeholder:text-slate-300"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  A unique identifier for your
                  organization. Lowercase letters,
                  numbers and hyphens only.
                </p>
              </div>


              {/* =============================================
                  DESCRIPTION
                  ============================================= */}

              <div>
                <label
                  htmlFor="organization-description"
                  className="mb-2 block text-sm font-bold text-[#081f49]"
                >
                  Description
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  id="organization-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  rows={5}
                  placeholder="Tell us a little about your organization..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#0057ff] focus:ring-4 focus:ring-[#0057ff]/[0.07] disabled:bg-slate-50"
                />
              </div>


              {/* =============================================
                  OWNER INFORMATION
                  ============================================= */}

              <div className="rounded-2xl border border-[#0057ff]/10 bg-[#0057ff]/[0.035] p-4">

                <div className="flex gap-3">

                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0057ff]/10 text-[#0057ff]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-none stroke-current"
                      strokeWidth="2"
                    >
                      <path d="M12 3 4 7v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7l-8-4Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#081f49]">
                      Owner access
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your signed-in account will
                      automatically become the owner.
                      Ownership is determined securely
                      from your authenticated account,
                      not from this form.
                    </p>
                  </div>
                </div>
              </div>


              {/* =============================================
                  ERROR
                  ============================================= */}

              {error && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-red-500"
                    strokeWidth="2"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 8v5M12 16h.01" />
                  </svg>

                  <p className="text-sm leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              )}
            </div>


            {/* ===============================================
                ACTIONS
                =============================================== */}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

              <Link
                href="/dashboard"
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0057ff] to-[#00bce9] px-6 text-sm font-bold text-white shadow-[0_10px_25px_rgba(0,87,255,0.18)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(0,87,255,0.25)] focus:outline-none focus:ring-4 focus:ring-[#00ceef]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-none stroke-current"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>

                    Create Organization
                  </>
                )}
              </button>
            </div>
          </form>
        </section>


        {/* Footer */}

        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Image
            src="/branding/kulhivaru-icon-mark.png"
            alt=""
            width={22}
            height={22}
            className="h-5 w-5 object-contain opacity-30"
          />

          Kulhivaru+
        </div>
      </div>
    </main>
  )
}