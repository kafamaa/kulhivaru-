# KULHIVARU+ — RECOVERY REPORT

**Session recovered:** 2026-10-16 (OpenCode agent)
**Project path:** `C:\Users\hp\Downloads\K+`
**Mode:** Recovery/continuation — no project rebuild, no data deletion.

## 1. Environment & Repository
- Current working directory contains the full project tree (`src`, `supabase`, `scripts`, `public`, `docs`/`plan.md`).
- **Git:** No `.git` repository found in the project folder. `git status`/`git log` could not be used; code state is taken directly from the filesystem.
- `node_modules` present; application previously buildable.
- Local Supabase client configuration exists in `.env` (URL + publishable anon key). `_No secrets are printed in this report.`

## 2. Verification Results
| Gate | Result |
|------|--------|
| `npm test` (Vitest) | **PASS** — 10 test files, 109 tests |
| `npm run test:sql` (PGlite migrations + RLS) | **PASS** — all statements, including super-admin foundation |
| `npm run build` (tsc + Vite) | **PASS** — production bundle created; only bundle-size warning |
| Recovery edits TypeScript check | **PASS** (`npx tsc --noEmit`) |

## 3. Supabase Credential Exposure Check
- Source tree contains **no** `service_role`, secret key, or hardcoded credential usage.
- `src/services/supabaseClient.ts` reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment and uses the publishable/public client.
- `.env` is correctly gitignored (`.env` / `.env.*`, with `!.env.example`).
- **Risk noted:** `.env` exists in the working directory and built `dist` embeds the project URL and publishable key by design (Vite public env). This is normal for a browser client but the file must not be committed and the project must never use a service-role key client-side.
- Recommended hardening: rotate/regenerate only if the project URL/key was committed externally; keep `.env` local; never move admin-only operations to the browser client without RLS/RPC.

## 4. Database / Migration Status
All 8 migration files are present and apply cleanly in order under PGlite:
1. `20261013000000_workspace_isolation_rls.sql`
2. `20261013010000_user_workspace_state.sql`
3. `20261013020000_security_hardening.sql`
4. `20261014000000_fix_org_function.sql` (referenced in plan; file present)
5. `20261015000000_phase1_organization_foundation.sql`
6. `20261016000000_new_user_profile_trigger.sql`
7. `20261017000000_tournament_engine.sql`
8. `20261019000000_super_admin_foundation.sql` (renamed platform sponsor table to `platform_sponsors` to avoid collision with organizer `sponsors`)

### Recovery fixes made to DB test harness / migration
- `scripts/validate-engine-sql.mjs`: now applies the full super-admin migration as one statement batch instead of unsafely splitting dollar-quoted `DO $$ ... $$` blocks.
- `supabase/migrations/20261019000000_super_admin_foundation.sql`: platform sponsor tables/index/policies are namespaced as `public.platform_sponsors`, eliminating both the naming collision with organizer sponsors and the `status` column error.

## 5. Super Admin Control Center
**Status:** Started and continued in this recovery.
- Foundation migration supplies ~50 additive tables, RLS, and helper policies for platform settings, feature flags, themes, homepage layouts, notices, platform sponsors/ads, media, moderation, support, locations, sports/rule templates, automation, notifications, billing, translations, etc.
- `src/components/layout/AdminLayout.tsx` navigation references 14 control-center modules.
- Previously implemented pages: Dashboard, Users, Organizers, Tournaments, Roles & Permissions, Audit Log.
- **Implemented in this recovery (real Supabase-backed, RLS-scoped pages):**
  - Reports & Moderation
  - Notices (create + status/pin management)
  - Announcements (queue/status management)
  - Platform Sponsors (create + status/priority)
  - Appearance & Themes (preset/version publication + platform settings)
  - Homepage & Content layouts (create + version publication)
  - Maldives Locations (atoll/island/venue lists + venue creation)
  - System & Security (feature flags + platform settings)
  - Support (ticket triage)
  - Analytics (state counts + DB counts)
- All 14 AdminLayout navigation items now route to live pages (no blank/unmatched outlets).

## 6. Reviewed Feature Areas
| Area | Status |
|------|--------|
| Tournament management | Substantially implemented via organizer workspace + engine (`/engine/*`) + 11-step wizard |
| User management | Client + Supabase profile loading; role changes via `set_user_role` path/RPC in architecture |
| Security | RLS policies and guards; super-admin bypass points documented; no secrets exposed |
| Sponsors | Organizer tournament sponsors (`SponsorManager`) + platform sponsors (Admin, newly implemented) |
| Appearance customization | Admin page added on existing `theme_presets` / `theme_versions` / `platform_settings` schema |
| Notices | Admin notice registry implemented on `notices` |
| Homepage builder | Admin layout/version management implemented on `page_layouts` / `page_layout_versions` |
| Notifications | Schema present (`notification_templates` / `notification_deliveries`); runtime dispatch is metadata/configuration-level |
| Tournament engine | Deterministic, tested (109 tests) and validated against PGlite |

## 7. Known Defects / Remaining Work
- Route legacy defects noted in `plan.md` (some are already partially addressed by distinct `FixturesPage`/`ResultsPage`/`VenuesDetailPage`/`ResetPasswordPage`).
- `/dashboard/matches` remains a list/console surface rather than a `:id` console; cross-tenant safety is enforced by `requireMatchWrite`/RLS rather than route parameter.
- `plan.md` explicitly lists not-yet-implemented mutators (`publishTournament`, `rescheduleMatch`, etc are present in AppContext, but several documented CRUD gaps may still exist).
- i18n coverage is still limited (~6 public strings), no interpolation.
- Admin modules are functional data-management screens but do not yet implement every possible workflow (e.g., full ad-campaign lifecycle, support messages thread, automation execution, billing processing).
- Bundle size warning (>500 kB) remains; not a correctness issue.

## 8. Recovery Work Summary
- Verified project in place and did not rebuild or delete data.
- Ran TypeScript, unit tests, SQL validation, and production build successfully (build passes after edits).
- Fixed SQL validation harness and sponsor table collision in the super-admin migration.
- Implemented 10 missing Super Admin Control Center pages and wired all admin routes.
- Preserved existing state, migrations, seed data, and engine implementation.

## 9. Recommended Next Steps
1. ~~Apply migrations to the live Supabase project and verify table/policy creation.~~ **Done — see §10.**
2. Add E2E/auth tests for the new admin routes.
3. Extend admin modules from read/status-management into full CRUD as needed.
4. Continue i18n coverage and code-splitting to address bundle size.

---

## 10. Super Admin Completion Round — 2026-10-17

Eliminated every one of the five declared "limits" end-to-end (SQL → edge → UI
→ tests) without deleting or rebuilding anything. `plan.md` §14 now records the
verified fix status of all legacy defects.

### 10.1 Database (migration `20261020000000_admin_ops_runtime.sql`)
- **User suspension/deletion/audit:** `suspended_at`/`suspension_reason`/`suspended_by`/`deleted_at`/`deleted_by` columns;
  `admin_suspend_user` / `admin_unsuspend_user` / `admin_delete_user` / `admin_list_users` / `admin_user_events`;
  dual-logging into `user_admin_events` + `audit_logs`; guards against self-suspend/self-delete, deleting or suspending
  the last active super admin, and hard-purge blockers (FK RESTRICT) — soft-delete/anonymize always succeeds first.
  `is_super_admin()` redefined to exclude suspended/deleted rows, so a suspended admin loses power instantly.
- **Platform-operator guard:** `is_service_caller()` + shared `assert_platform_operator()`
  (`is_super_admin() OR is_service_caller()`); every new RPC is SECURITY DEFINER with a pinned `search_path`.
- **Automation execution:** `execute_automation_rule(rule, context, idempotency_key)` — jsonb condition matching,
  whitelisted actions (`noop`/`log`/`notify`/`set_report_status`/`suspend_user`), dry-run isolation, per-key
  idempotency — plus `run_due_automation_rules` with `next_run_at` scheduling and a guarded pg_cron tick.
- **Notification dispatch:** `dispatch_notification_queue` (in-app, completes in SQL) and
  `claim_notification_deliveries` / `mark_delivery_result` for the provider worker (claim >5 min idle re-claim).
- **Live payments:** `payment_intents` + `billing_create_payment_intent` / `billing_confirm_payment` /
  `billing_cancel_subscription` — idempotent replay, "never pay an invoice twice", late-failure guard on a
  succeeded intent, subscription activation from the plan interval, audit stamps.
- **Analytics:** `admin_daily_stats(p_from, p_days)` day buckets (users/tournaments/matches/official/revenue/tickets/notifications).

### 10.2 Client
- `src/services/adminOpsService.ts`: single bridge — best-effort edge invoke (tolerates undeployed functions) +
  authoritative RPC fallback, typed against the real signatures.
- Pages: AdminUsersPage (live directory, suspend/reinstate/delete modals, audit-trail panel),
  AdminNotificationsPage (queued counts + "Dispatch queue now"), AdminAutomationPage (Run now / Run due rules with
  outcomes, schedule display), AdminBillingPage (payment-intent lifecycle, sandbox checkout deep-link
  `?intent=`, subscription cancel), AdminAnalyticsPage (range selector + hand-rolled SVG line/bar charts, totals,
  CSV export), AdminContentPage (HTML5 drag-and-drop section builder synced with the JSON editor).
- Suspension enforcement: `User` carries `suspendedAt`/`suspensionReason`/`deletedAt` (with an un-migrated-backend
  fallback in `getUserProfile`); `RouteGuards` shows a signed-out-ready suspension notice in both `RoleGate` and
  `RequireAuth`; `AppContext` force-signs-out deleted accounts during session restore.

### 10.3 Edge functions — deployed
`admin-user-ops`, `notify-dispatch`, `billing-webhook`, `automation-worker` (+ `_shared/`) are live on project
`tktaujblxjxifgznooyi`. Every function gates on `is_super_admin() OR is_service_caller()` before touching a secret;
`billing-webhook` refuses unsigned events (fail-closed). See `supabase/functions/README.md`.
**Secrets intentionally NOT set by this session** (deploy with `supabase secrets set`):
`PAYMENT_WEBHOOK_SECRET` (webhook 503s until set), `RESEND_API_KEY` + `EMAIL_FROM` (email rows stay queued until set).

### 10.4 Deployment status — LIVE
- `supabase db push` applied both pending migrations to `k+final` (`tktaujblxjxifgznooyi`), including a healing fix:
  the remote `venues` table pre-dated the foundation migration (created by `security_hardening` with `owner_id`), so
  idempotent `ADD COLUMN IF NOT EXISTS` statements for `atoll_id`/`island_id`/`created_by` were added to the
  foundation migration before its policies/indexes reference them.
- All four edge functions deployed via `supabase functions deploy`.

### 10.5 Verification gates — all green
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | **PASS** |
| `npm run typecheck:functions` | **PASS** (new: edge functions checked with a Deno shim via `tsconfig.functions.json`) |
| `npm test` | **PASS** — 11 files, **127 tests** (18 new `adminConsole.test.ts` route/authorization/contract tests) |
| `npm run test:sql` | **PASS** — incl. 14 new runtime RPC behavior steps (guards, idempotency, RLS, day buckets) |
| `npm run build` | **PASS** (pre-existing bundle-size warning only) |
| `supabase db push` | **PASS** — 2 migrations applied to production project |
| `supabase functions deploy` | **PASS** — 4/4 functions |

### 10.6 Remaining (deliberate)
1. Set the three edge-function secrets above when a provider is chosen (`supabase/functions/README.md`).
2. Optional smoke test as a real super-admin session against the live project.
3. Carry-over debt from §7 (i18n coverage, bundle size, remaining store mutators).