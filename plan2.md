# KULHIVARU+ — MASTER PLAN

> **Complete Sports Tournament Management, Live Operations & History Ecosystem for the Republic of Maldives**
>
> This document is the single source of truth for the KULHIVARU+ product vision, architecture, features, and execution plan.
> It consolidates the product spec, repository map, feature lists, and delivery phases into one master reference.

---

> **Status correction — 17 October 2026:** The user supplied a later session report that `App.tsx` routes were connected at 05:56 (timezone not established), the 22-section tournament dashboard rendered, and a foreign/unknown tournament received a friendly not-found screen. Dashboard route wiring is therefore **reported working**, not unrouted. This document review did not inspect the repository, database or browser. Individual section functionality, registration routes, QR tests and current build results still require fresh verification. Older implementation/deployment claims below are retained as historical audit evidence, not independently reverified facts. Section 16 defines new requirements, not completed work.

## TABLE OF CONTENTS

1. [Product Vision & Scope](#1-product-vision--scope)
2. [Design Language & Visual Identity](#2-design-language--visual-identity)
3. [User Surfaces & Routes](#3-user-surfaces--routes)
4. [Core Features](#4-core-features)
5. [Architecture & Tech Stack](#5-architecture--tech-stack)
6. [Data Architecture](#6-data-architecture)
7. [Auth & Permissions](#7-auth--permissions)
8. [Competition Engine](#8-competition-engine)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Testing Strategy](#10-testing-strategy)
11. [Hard Rules for Development](#11-hard-rules-for-development)
12. [Additional Features (Roadmap)](#12-additional-features-roadmap)
13. [Phased Delivery Plan](#13-phased-delivery-plan)
14. [Known Defects & Technical Debt](#14-known-defects--technical-debt)
15. [File Naming Conventions](#15-file-naming-conventions)
16. [Usability Requirements and Missing Workflow Details](#16-usability-requirements-and-missing-workflow-details)

---

## 1. PRODUCT VISION & SCOPE

KULHIVARU+ is a **complete, production-grade Maldives sports ecosystem** — not a clickable demo, static website, or CRUD scaffold. The platform covers the full lifecycle:

**Discovery → Organization Creation → Tournament Creation → Team/Player Registration → Verification → Competition Configuration → Draw → Fixtures → Scheduling → Match Operations → Official Results → Recalculation → Qualification → Final Championship → Awards → Archiving**

Plus: finance, sponsorship, news, media, officials, documents, history, administration, integrations, and reporting.

### Non-Negotiable Scope

- Every function in the functional specification is **TARGET scope**
- An unfinished module must never be presented as implemented
- **AI output is advisory only** — must be validated by the deterministic engine
- Never let AI invent scores, winners, suspensions, or official results
- Never fabricate sporting records
- Never expose private medical, emergency-contact, identity-document, or billing records on public surfaces

---

## 2. DESIGN LANGUAGE & VISUAL IDENTITY

### Brand Tokens (Tailwind)

| Token | Usage |
|-------|-------|
| `brand.primary` | Primary actions, links, brand color (#059669) |
| `brand.secondary` | Dark surfaces, headers (#0f172a) |
| `brand.accent` | Highlights, secondary actions (#06b6d4) |
| `brand.gold` | Awards, highlights (#f59e0b) |
| `surface` | Card backgrounds |
| `text` | Primary text |
| `success` / `warning` / `danger` / `border` | Semantic states |

### Typography

- **Inter** — Primary font (English)
- **MV Boli / Thaana** — Dhivehi script font
- Loaded via Google Fonts in `index.html`

### Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| `xs` | 375px | iPhone SE |
| `sm-phone` | 390px | iPhone 14/15 |
| `sm` | 640px | Large phones / small tablets |
| `lg-phone` | 430px | iPhone Pro Max |
| `lg` | 1024px | Tablets |
| `xl` | 1280px | Desktop |

### Layout Patterns

**Desktop Global Page:**
```
┌─────────────────────────────────────────────────────────┐
│ Brand   Live  Tournaments  Teams  Players  Stats  News  │
├─────────────────────────────────────────────────────────┤
│ Breadcrumb / page title          Context    Main action│
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │ KPI/tab │ │ KPI/tab │ │ KPI/tab │                    │
│ └─────────┘ └─────────┘ └─────────┘                    │
│ Filter/search/sort                                     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Real table / cards / bracket / timeline / editor  │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Organizer Workspace:**
```
┌─────────────────────────────────────────────────────────┐
│ Brand [Org ▼] [Tournament ▼] Search Alerts Profile     │
├───────────────┬─────────────────────────────────────────┤
│ Dashboard     │ Breadcrumb                    Save / Publish  │
│ Tournaments   │ Page title & status                        │
│ Registrations │ Workflow progress / next action            │
│ Teams & People│ ┌───────────────────────────────────────┐│
│ Matches       │ │ Module view / form / data table       ││
│ Finance       │ └───────────────────────────────────────┘│
│ News & Content│ Save state / audit history / help         │
│ Reports       │                                         │
│ Settings      │                                         │
└───────────────┴─────────────────────────────────────────┘
```

**Match Operations Console:**
```
┌─────────────────────────────────────────────────────────┐
│ MATCH / Stage / Round   ONLINE · SYNCED                 │
│        HOME   2  :  1   AWAY           67:34  LIVE      │
│ [Start/Pause]  [Period]  [End period]  [Review]         │
├───────────────────────────┬─────────────────────────────┤
│ HOME ROSTER               │ AWAY ROSTER                 │
│ [Goal] [Card] [Sub] [...] │ [Goal] [Card] [Sub] [...]    │
├───────────────────────────┴─────────────────────────────┤
│ Event ledger with author/time/undo/correction           │
│ [Recheck] [Save safely] [Submit for official review]    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. USER SURFACES & ROUTES

### ~105 Routes in `src/App.tsx`
*(Verified 17 Oct 2026: 39 public · 3 role portals · 22 admin · 26 organizer · 14 engine · 404)*

#### Public Pages (39 routes)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomePage` | Landing page |
| `/live` | `LiveMatchesPage` | Live match tracking |
| `/matches` | `MatchesPage` | All matches |
| `/fixtures` | `FixturesPage` | Upcoming fixtures (distinct page — old defect fixed) |
| `/results` | `ResultsPage` | Completed results (distinct page — old defect fixed) |
| `/tournaments` | `TournamentsListPage` | Tournament listing |
| `/tournaments/:slug` | `TournamentDetailPage` | Tournament detail |
| `/matches/:id` | `MatchDetailPage` | Match detail with events |
| `/teams` | `TeamsDirectoryPage` | Team directory |
| `/teams/:id` | `TeamDetailPage` | Team profile |
| `/players` | `PlayersDirectoryPage` | Player directory |
| `/players/:id` | `PlayerDetailPage` | Player profile |
| `/coaches` | `CoachesDirectoryPage` | Coach directory |
| `/coaches/:id` | `CoachDetailPage` | Coach profile |
| `/referees` | `RefereesDirectoryPage` | Referee directory |
| `/referees/:id` | `RefereeDetailPage` | Referee profile |
| `/organizations` | `OrganizationsListPage` | Organization directory |
| `/organizations/:slug` | `OrganizationDetailPage` | Organization profile |
| `/standings` | `StandingsPage` | League standings |
| `/news` | `NewsListPage` | News & announcements |
| `/gallery` | `GalleryMediaPage` | Photo gallery |
| `/media` | `GalleryMediaPage` | Media library |
| `/documents` | `DocumentsPage` | Official documents |
| `/history` | `HistoryPage` | Historical archives |
| `/venues` | `VenuesDirectoryPage` | Venue directory |
| `/venues/:slug` | `VenuesDetailPage` | Venue detail (old defect fixed) |
| `/search` | `GlobalSearchPage` | Global search |
| `/register/:slug` | `TeamRegistrationPage` | Team registration |
| `/login` | `LoginPage` | Sign in |
| `/signup` | `SignupPage` | Sign up |
| `/forgot-password` | `ForgotPasswordPage` | Password reset request |
| `/reset-password` | `ResetPasswordPage` | Password reset (dedicated page, token handling — old defect fixed) |
| `/account` | `AccountPage` | Account management (read-only; no profile editing yet) |
| `/about` | `LegalPages` | About page |
| `/contact` | `LegalPages` | Contact page |
| `/terms` | `LegalPages` | Terms of service |
| `/privacy` | `LegalPages` | Privacy policy |
| `/team-portal/tournaments/:id` | `TeamPortalPage` | Team tournament portal |

#### Role-Specific Portals (3 routes)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/player` | `PlayerPortalPage` | Player dashboard (stub — see §14) |
| `/coach` | `CoachPortalPage` | Coach dashboard (stub — see §14) |
| `/referee` | `RefereePortalPage` | Referee dashboard (stub — see §14) |

#### Super Admin Control Center (22 routes under `<AdminLayout>` at `/admin`)

`index`(Dashboard), `users`, `organizers`, `tournaments`, `roles`, `audit`, `reports`, `notices`, `announcements`, `sponsorship`, `appearance`, `content`, `locations`, `system`, `support`, `analytics`, `ad-campaigns`, `automation`, `notifications`, `translations`, `billing` — 21 pages in `src/pages/admin/`, all `RequireSuperAdmin`. 16 are fully DB-backed (RPCs/tables + 4 edge functions); 5 partial (see §14).

#### Organizer Workspace (26 routes: index + 25, under `<OrganizerLayout>` at `/dashboard`)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `OverviewDashboard` | Workspace overview + My Tournaments tab |
| `/dashboard/index` | *(Navigate)* | Redirects to `/dashboard` |
| `/dashboard/tournaments/new` | `TournamentSetupWizard` | 11-step wizard (engine publish) |
| `/dashboard/organizations/new` | `NewOrganizationPage` | Create organization |
| `/dashboard/registrations` | `RegistrationInbox` | Registration review/approval |
| `/dashboard/teams` | `TeamsManager` | Team + roster management |
| `/dashboard/fixtures` | `FixturesManager` | Fixture scheduling |
| `/dashboard/matches` | `MatchOperationsList` | Match operations list |
| `/dashboard/matches/:id/live` | `LiveScoringConsole` | Live scoring |
| `/dashboard/standings` | `StandingsPage` *(public page reused)* | Standings (not tournament-scoped — defect) |
| `/dashboard/discipline` | `DisciplineManager` | Disciplinary cases |
| `/dashboard/protests` | `ProtestsManager` | Protest management |
| `/dashboard/officials` | `OfficialsManager` | Official assignments (pay-only; no rostering UI) |
| `/dashboard/venues` | `VenuesManager` | Venue + booking management |
| `/dashboard/operations` | `OperationsIncidents` | Incident tracking |
| `/dashboard/communications` | `CommunicationsManager` | Comms management |
| `/dashboard/finance` | `FinanceLedger` | Financial ledger |
| `/dashboard/sponsors` | `SponsorManager` | Sponsor management |
| `/dashboard/checklist` | `ChecklistHub` | Tournament checklist |
| `/dashboard/reports` | `ReportsExports` | Reports & exports |
| `/dashboard/history` | `HistoricalEntry` | Historical data entry (stub — see §14) |
| `/dashboard/news` | `NewsManager` | News CRUD |
| `/dashboard/documents` | `DocumentsManager` | Document records (URL registry, no upload) |
| `/dashboard/media` | `MediaManager` | Gallery records (URL registry, no upload) |
| `/dashboard/sync` | `SyncCenter` | Sync center (fake — see §14) |
| `/dashboard/closure` | `ClosureArchive` | Tournament closure |
| `/dashboard/settings` | `SettingsManager` | Workspace settings |

> **Later dashboard update:** My Tournaments and the 22-section per-tournament dashboard are reported routed and rendered. Confirm exact route paths from the current repository; keep existing deep links. Registration, roster, payment, QR and import behavior must be verified separately. See the status correction above and §16.

---

## 4. CORE FEATURES

### 4.1 Tournament Management & Setup Wizard

**11-Step Guided Tournament Setup Wizard** (`TournamentSetupWizard.tsx`):

1. **Basic Information** — Bilingual names, atoll, island, dates, logo, cover
2. **Sport & Rules** — Futsal, Football, Volleyball, Basketball, Handball, 3x3
3. **Categories & Divisions** — Senior Men, Women Open, U-18, entry fees
4. **Teams & Participants** — Add/import clubs, roster sizes
5. **Competition Format** — Single/Double Round Robin League, Groups + Knockout, Single Elimination
6. **Progression Mapping** — Cross-group semifinals, finals
7. **Points & Tiebreakers** — Ordered evaluation: H2H, Goal Diff, Goals Scored, Fair Play
8. **Draw & Seeding** — Pots, seed distribution, restrictions
9. **Automatic Fixture Generation** — Deterministic Berger table algorithm
10. **Readiness Review** — Venue conflicts, minimum 90-min rest constraint
11. **Publish Tournament** — Go-live confirmation

### 4.2 Live Match Operations

- **Goal & Card Recording** — Goals, penalties, own goals, assists, yellow/red cards, substitutions
- **Volleyball Set-by-Set Controller** — FIVB-compliant (Sets 1–4 to 25pts, Set 5 to 15pts, 2-point lead rule)
- **Immutable Event Ledger** — Complete timeline with undo/correction and auto score recalculation
- **Provisional vs. Official Results** — Only verified referees/directors confirm official results
- **Match State Machine** — Scheduled → Live → Halftime → Finished → Official

### 4.3 Finance & Sponsorship

- **MVR Accounting** — General journal of revenues, grants, and expenses
- **Payment Verification** — Bank of Maldives (BML) slip reference verification queue
- **Sponsor Deliverables** — Cash vs. in-kind separation, checklist tracking (banners, social posts, VIP passes)

### 4.4 Reports & Media

- **Printable Match Sheets** — FAM/VAM compliant official referee match report with signatures
- **Certified CSV Exports** — Standings and registered rosters
- **Social Media Share Cards** — Automatic branded matchday announcements and final score flyers

### 4.5 Organization Management

- Organization creation with verified owner membership
- Multiple organization types: clubs, councils, schools, workplaces, federations
- Organization-scoped data isolation
- Staff/collaborator management

### 4.6 Maldives-First Architecture

- **Complete Atoll & Island Hierarchy** — All atolls (HA, HDh, Sh, N, R, B, Lh, K, AA, ADh, V, M, F, Dh, Th, L, GA, GDh, Gn, S)
- **Maldives Standard Time (MVT)** — All times in `Indian/Maldives` (+05:00) with UTC persistence
- **Maldivian Rufiyaa (MVR)** — Precise minor unit accounting via `Intl.NumberFormat('dv-MV')`
- **Bilingual** — English + Dhivehi with RTL support

---

## 5. ARCHITECTURE & TECH STACK

### Core Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.0.0 | UI framework |
| TypeScript | ^5.7.3 | Type safety |
| Vite | ^6.1.0 | Build tool & dev server |
| React Router | ^7.1.5 | Client-side routing |
| Tailwind CSS | ^3.4.17 | Utility-first styling |
| Supabase JS | ^2.117.3 | Backend client (Auth + DB) |

### Supporting Libraries

| Library | Purpose |
|---------|---------|
| lucide-react | Icon library |
| clsx | Conditional CSS class utility |
| tailwind-merge | Tailwind class merging |

### Dev/Test Tools

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing framework |
| @vitejs/plugin-react | Vite React plugin (Fast Refresh) |
| autoprefixer | CSS vendor prefixing |
| postcss | CSS processing pipeline |

### Key Architecture Patterns

- **State Management:** React Context (`src/store/AppContext.tsx`, ~1,970 LOC) with `useState`
- **Persistence:** Single JSONB blob per user in `user_workspace_state` table, localStorage fallback; normalized mirror for `tournaments` + 28 `engine_*` tables
- **Internationalization:** Custom React Context-based i18n (`src/i18n/index.tsx`) — en ≈330 keys, dv overrides ≈150 keys, `{{interpolation}}`, RTL
- **Route Guards:** Custom `RequireAuth`, `RequireOrganizer`, `RequireOfficial`, `RequireSuperAdmin`
- **Competition Engine:** Deterministic, tested algorithm for standings, fixtures, brackets
- **Path Alias:** `@/` maps to `src/` in both `tsconfig.json` and `vite.config.ts`

### Project Structure

```
K+/
├── index.html              # Vite entry HTML
├── package.json            # Project manifest
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
├── tsconfig.functions.json # Type-check project for Supabase edge functions
├── tailwind.config.js      # Tailwind config
├── postcss.config.js       # PostCSS config
│
├── public/
│   ├── logo.svg / logo.png
│   └── robots.txt / sitemap.xml
│
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component + all routes
│   ├── index.css           # Global styles
│   │
│   ├── components/
│   │   ├── ui/             # Badge, Button, Card, Modal, SearchModal
│   │   ├── layout/         # Footer, MobileNav, Navbar, OrganizerLayout, AdminLayout, EngineLayout, RouteGuards
│   │   ├── match/          # EventLedger, MatchCard, VolleyballScoreboard
│   │   └── bracket/        # GroupStandingsTable, TournamentBracket
│   │
│   ├── pages/
│   │   ├── public/         # Public-facing pages (incl. AuthPages, LegalPages, ResetPasswordPage)
│   │   ├── portals/        # Team/player/coach/referee portals
│   │   ├── organizer/      # Organizer workspace pages (+ MyTournamentsPage; route connection reported later)
│   │   ├── engine/         # Tournament Engine UI surfaces
│   │   └── admin/          # 21 Super Admin Control Center pages
│   │
│   ├── services/
│   │   ├── authService.ts          # GoTrue + permission/filter helpers
│   │   ├── supabaseClient.ts       # Client factory (anon key only)
│   │   ├── workspaceRepository.ts  # user_workspace_state load/save
│   │   ├── adminOpsService.ts      # Admin RPCs + edge-function calls
│   │   ├── competitionEngine.ts    # Legacy competition math
│   │   ├── calendarService.ts      # ICS / Google Calendar builders
│   │   ├── followService.ts        # localStorage follows
│   │   ├── engine/                 # 21 pure engine modules + engineRepository + workspaceSync
│   │   ├── registration/           # registrationEngine.ts (WIP, unwired)
│   │   ├── qr/                     # qrEncoder (WIP)
│   │   └── import/                 # csvTools.ts (WIP import tooling)
│   │
│   ├── data/
│   │   ├── seedData.ts             # ~890 lines of demo seed records
│   │   └── maldivesLocations.ts    # Atolls/islands/venues static registry
│   │
│   ├── store/AppContext.tsx
│   ├── types/index.ts
│   └── i18n/index.tsx
│
├── supabase/
│   ├── migrations/         # 8 timestamped SQL migrations (all applied live)
│   └── functions/          # 4 edge functions + _shared guard/cors
│
├── scripts/
│   ├── validate-engine-sql.mjs     # PGlite SQL harness (41 steps)
│   ├── deno-shim.d.ts
│   └── BOOTSTRAP_SUPER_ADMIN.sql   # One-shot SQL-editor bootstrap (see §14 security note)
│
└── dist/                   # Production build output
```

---

## 6. DATA ARCHITECTURE

### Critical Architectural Fact (updated)

**The application still uses its JSONB workspace blob as the live store, but the Tournament Engine now also mirrors into its normalized schema.** RLS on engine and core tables is enforced server-side via the SQL functions.

### Store (`AppContext.tsx`)

**Engine state:**
- `engineState` (`EngineState`) persisted as a JSONB slice in the workspace snapshot and mirrored per-tournament via `syncTournamentsToSupabase` (guarded).
- `updateEngineState(updater)` — engine mutations.
- `initializeEngineTournament(input)` — atomic wizard publish.

### Store (`AppContext.tsx`)

**Global Arrays:**
- `tournaments`, `teams`, `matches`, `organizations`
- `financeTransactions`, `sponsors`, `checklist`
- `coaches`, `referees`, `disciplinaryCases`, `protests`
- `officialAssignments`, `venueBookings`, `incidents`
- `communications`, `invitations`

**Scoped Projections (USE THESE in workspace pages):**
- `myTournaments`, `sharedTournaments`, `permittedTournaments`
- `myOrganizations`, `myTeams`, `myMatches`, `myFinances`
- `myChecklist`, `myCommunications`, `myInvitations`

**Mutators (client-only):**
- `createTournament`, `updateTournament`, `deleteTournament`
- `createOrganization`, `updateMatch`, `addMatchEvent`, `deleteMatchEvent`
- `updateVolleyballSet`, `confirmOfficialResult`, `addMatches`
- `registerTeam`, `updateTeamStatus`, `updateTeamFeeStatus`
- `addPlayerToTeam`, `addFinanceTransaction`, `verifyFinanceTransaction`
- `addSponsor`, `toggleSponsorDeliverable`, `toggleChecklistItem`
- `addDisciplinaryCase`, `resolveDisciplinaryCase`
- `addProtest`, `resolveProtest`, `payOfficialAssignment`
- `addVenueBooking`, `addIncident`, `resolveIncident`
- `sendCommunication`, `resetToDefaultData`

**Mutators — verified present (17 Oct 2026):**
`createTournament`, `updateTournament`, `deleteTournament`, `publishTournament`, `createOrganization`, `updateOrganization`, `updateMatch`, `rescheduleMatch`, `setMatchStatus`, `startMatch`, `addMatchEvent`, `deleteMatchEvent`, `correctMatchEvent`, `updateVolleyballSet`, `provisionalResult`, `confirmOfficialResult`, `addMatches`, `deleteMatch`, `registerTeam`, `updateTeamStatus`, `updateTeamFeeStatus`, `updateTeam`, `addPlayerToTeam`, `updatePlayer`, `removePlayerFromTeam`, `addFinanceTransaction`, `verifyFinanceTransaction`, `rejectFinanceTransaction`, `deleteFinanceTransaction`, `refundFinanceTransaction`, `addSponsor`, `updateSponsor`, `deleteSponsor`, `toggleSponsorDeliverable`, `toggleChecklistItem`, `addChecklistItem`, `deleteChecklistItem`, `addDisciplinaryCase`, `resolveDisciplinaryCase`, `addProtest`, `resolveProtest`, `addOfficialAssignment`, `updateOfficialAssignment`, `deleteOfficialAssignment`, `payOfficialAssignment`, `addVenueBooking`, `updateVenueBooking`, `deleteVenueBooking`, `addIncident`, `updateIncident`, `resolveIncident`, `sendCommunication`, `updateCommunication`, `addNewsArticle`, `updateNewsArticle`, `publishNewsArticle`, `deleteNewsArticle`, `addDocument`, `deleteDocument`, `addGalleryItem`, `deleteGalleryItem`, `addHistoricalRecord`, `deleteHistoricalRecord`, `addAward`, `deleteAward`, `addVenue`, `setUserRole`, plus **WIP registration set**: `upsertRegistrationForm`, `deleteRegistrationForm`, `updateRegistrationConfig`, `updateTeamRosterStatus`, `submitTeamRoster` (single-use `rosterToken`), `verifyTeamPayment`.
*(The former "NOT Present" list is fully implemented; what remains missing is UI wiring for several of them — see §14.)*

### Supabase Tables (Migrations)

Migration files in `supabase/migrations/` (all 8 applied to live project `tktaujblxjxifgznooyi`):

| Migration | Purpose |
|-----------|---------|
| `20261013000000_workspace_isolation_rls.sql` | Base schema: 17 core tables + permission helpers + first RLS layer |
| `20261013010000_user_workspace_state.sql` | `user_workspace_state` JSONB snapshot table + role-escalation trigger |
| `20261013020000_security_hardening.sql` | 2,461-line hardening: +25 tables, column grants, barrier views, version columns, idempotency, append-only ledgers, finance triggers |
| `20261015000000_phase1_organization_foundation.sql` | Auto-create default organization per user |
| `20261016000000_new_user_profile_trigger.sql` | Auto-provision `public.users` profile with `organizer` role for every new signup |
| `20261017000000_tournament_engine.sql` | **Tournament Engine normalized schema** (28 tables + RLS + RPCs, additive columns) |
| `20261019000000_super_admin_foundation.sql` | Super Admin Control Center: 31 tables (settings, themes, layouts, notices, ads, moderation, support, locations, automation, billing, translations) |
| `20261020000000_admin_ops_runtime.sql` | Admin runtime: user suspend/delete RPCs, automation executor, notification dispatch, payment intents + billing RPCs, `admin_daily_stats` |

> *(A previously listed `20261014000000_fix_org_function.sql` never existed — removed from this map.)*

### Data Architecture notes

- **Primary source of truth in-app today**: still the JSONB `user_workspace_state.data` blob (backwards compatible) plus localStorage.
- **Normalized mirror**: per-tournament engine writes via `engine_apply_plan` (guarded by `isSupabaseConfigured`). `engineState` slices per `tournamentId`.
- **RLS**: engine tables all carry `tournament_id`; policies use `can_view_tournament` / `can_manage_tournament`.
- Server-side permission checks (`canManageTournament`) are enforced inside the SQL functions, not just the client.

### Known schema risks (verified 17 Oct 2026 — see §14)

- `venues` is **declared twice** (TEXT PK in `security_hardening` vs UUID PK in super-admin foundation).
- **Two competing `auth.users` triggers** create profiles with different default roles (`guest` vs `organizer`); the later migration wins.
- `notices` has RLS enabled but **zero policies** → unreachable for all client roles.
- Duplicated machinery: `match_result_revisions` vs `engine_match_result_revisions`; `communication_*` vs `notification_*`; `tournament_awards` vs `engine_awards`.
- The `venues` **store slice is omitted from `WorkspaceSnapshot`** — user-created venues never persist in Supabase mode and are not cleared on user switch.

---

## 7. AUTH & PERMISSIONS

### Roles

Role membership alone must not bypass tournament ownership, staff assignment, action permissions or private-field restrictions. Any super-admin access must be server-authorized and audited.

| Role | Access |
|------|--------|
| `super_admin` | Hard bypass — full access (~11 bypass points) |
| `organizer` | Full workspace access within organization scope |
| `coach` | Team/player management within assigned teams |
| `player` | Personal profile, team view, match participation |
| `referee` | Match operations, official results confirmation |
| `viewer` | Read-only public surfaces |

### Permission Actions (`canAccessTournament`)

`view_public` | `view_private` | `edit` | `manage_matches` | `manage_finance` | `manage_roster` | `invite_collaborator` | `delete`

### Filter Helpers

`filterTournamentsForUser`, `filterOrganizationsForUser`, `filterTeamsForUser`, `filterMatchesForUser`, `filterFinancesForUser`, `filterChecklistForUser`, `filterCommunicationsForUser`, `canInviteCollaborators`, `canRevokeCollaborator`

### Route Guards

- `RequireAuth` — Any authenticated user
- `RequireOrganizer` — Organizer role
- `RequireOfficial` — Referee/official role
- `RequireSuperAdmin` — Super admin role

---

## 8. COMPETITION ENGINE (LEGACY)

**File:** `src/services/competitionEngine.ts` (~310 LOC).

The legacy helpers (standings, round-robin fixture generation, knockout bracket, conflict detection) remain available for simple flows; the complete lifecycle uses the Tournament Engine above.

### Historical legacy defects (reported fixed; see §14)

- Qualification hardcoded `idx < 2` in places — replaced by the qualification engine
- Counts `live` matches into standings (line 34) — engine computes only finalized
- Knockout later rounds resolved by bracket slot sources, not string IDs

KULHIVARU+ ships a fully implemented, deterministic, normalized Tournament Engine. It is organized as the following integrated, testable service architecture. The legacy `src/services/competitionEngine.ts` helpers feed it but the engine is the authoritative module set.

### Required modules — implemented (`src/services/engine/`)

| # | Module | Status | Key file |
|---|--------|--------|----------|
| 1 | Tournament Configuration Engine | done | `setupPlanner.ts`, `types` (`EngineRuleSet`) |
| 2 | Sport Rules Engine | done | `rulesEngine.ts` (`defaultRuleSet`, `EngineRuleSet`) |
| 3 | Registration & Eligibility Engine | done | `eligibilityEngine.ts` (see `eligibilityEngine.test.ts`) |
| 4 | Draw Ceremony Engine (random/seeded/pots/hybrid/manual live) | done | `drawEngine.ts` (`buildDrawTokens`, `runManualDraw`) |
| 5 | Seeding Engine | done | `drawEngine.ts` (pots/seeding) |
| 6 | Fixture Generation Engine | done | `leagueEngine`, `knockoutEngine`, `groupEngine`, `bestOfEngine` |
| 7 | Scheduling Engine | done | `createScheduler` in `fixtureUtils.ts` |
| 8 | Conflict Detection Engine | done | `conflictEngine.ts` |
| 9 | Match Operations Engine | done (client lifecycle) | `src/pages/engine/EngineMatchesPage.tsx` |
| 10 | Live Scoring Engine | done | `src/services/Engine matches/*` via `AppContext` |
| 11 | Result Validation & Finalization Engine | partial (admin-approved) | `EngineMatchesPage`, `awardsEngine` |
| 12 | Standings Calculation Engine | done | `leagueEngine`, `groupEngine` |
| 13 | Tie-Breaker Engine | done | `tieBreaker` in league engine |
| 14 | Qualification Engine (manual approve by default) | done | `qualificationEngine.ts`; `automaticAdvancement = false` |
| 15 | Knockout Bracket Engine | done | `knockoutEngine.ts` |
| 16 | Double Elimination Engine | done | `doubleEliminationEngine.ts` |
| 17 | Swiss Pairing Engine | done | `swissEngine.ts` |
| 18 | Discipline & Protest Engine | done | `disciplineEngine.ts` |
| 19 | Awards & Champion Engine | done | `awardsEngine.ts` |
| 20 | Tournament Completion Engine | done | `completion` rows in `EngineAwardsPage` |
| 21 | Audit & Revision Engine | done | `auditEngine.ts` + `engine_audit_log` mirror |
| 22 | Public Tournament Data Integration | partial / requires verification | Workspace filtering does not establish a guest-accessible public database read path; see §14 |

### Engine UI surfaces (`src/pages/engine/`, under `/engine/*`, gated by `RequireOrganizer`)

`/engine`, `/engine/configuration`, `/engine/teams`, `/engine/draw`, `/engine/fixtures`, `/engine/calendar`, `/engine/conflicts`, `/engine/matches`, `/engine/standings`, `/engine/qualification`, `/engine/brackets`, `/engine/discipline`, `/engine/awards`, `/engine/history`.

### Setup wizard (engine-driven)

`/dashboard/tournaments/new` → `src/pages/organizer/TournamentSetupWizard.tsx` is rebuilt on the real engine: 11 steps whose fixture/standings/qualification previews come from `SetupPlannerInput`/`planTournament`, with a deterministic publish (`initializeEngineTournament`) that creates the tournament, categories, teams, matches, and engine state in one atomic store action. Blocking conflicts prevent publish.

### Persistence (normalized mirror alongside the current JSONB workspace store)

- `src/services/engine/persistenceMappers.ts` — deterministic mapping between in-memory EngineState/Tournament and normalized DB rows.
- `src/services/engine/workspaceSync.ts` — best-effort mirror into normalized tables via `engine_apply_plan`.
- `supabase/migrations/20261017000000_tournament_engine.sql` — 28 normalized engine tables with `tournament_id`-scoped RLS, idempotent `engine_apply_plan`/`engine_read_state`/`engine_upsert_rows`, plus additive columns on `matches`/`teams`.
- `src/store/AppContext.tsx` triggers the per-tournament mirror from the existing Supabase save effect (guarded by `isSupabaseConfigured`).

### Defaults / invariants

- `automaticAdvancement = false` by default; manual organizer confirmation required before qualification/brackets write forward.
- `configuration versioning`: stages carry a `configVersionId` + `engine_config_versions` snapshot.
- Idempotent generation/regeneration guards; optimistic concurrency via `lock_version` / `updated_at`.
- Default timezone `Indian/Maldives`.

---

## 9. INTERNATIONALIZATION (i18n)

**File:** `src/i18n/index.tsx`

### Features (verified 17 Oct 2026)

- 2 locales: `en` (≈330 keys incl. `engine.*` namespace) and `dv` (≈150 hand-authored Thaana override keys, merged over English)
- Interpolation implemented (`{{count}}`, `{{amount}}`) in `tr()`
- Real RTL support via `document.documentElement.dir`
- Locale-aware `formatMVR` (`Intl.NumberFormat('dv-MV')`), `formatDate`, `formatTime` (Indian/Maldives)
- Persisted to `localStorage['kulhivaru_lang']`
- Hook: `useTranslation()` → `{ t, formatMVR, formatDate, locale, isRtl }`; consumed in ~60 components (chrome, guards, layouts, most admin/engine pages)

### Gaps (open)

- Most **page-level copy is hardcoded English**: auth pages, all portals, legal pages, tournament-detail tabs, parts of public listings
- Runtime dictionary is a static file; the DB `translation_keys`/`translations` tables + `/admin/translations` page are **not consumed at runtime**
- Dhivehi coverage ≈50% — toggling `dv` leaves large surfaces in English

---

## 10. TESTING STRATEGY

### Test Files (verified 17 Oct 2026 — 181 tests / 13 files)

| File | Tests | Focus |
|------|-------|-------|
| `src/services/engine/engineAlgorithms.test.ts` | 33 | Engine algorithms |
| `src/services/registration/registrationEngine.test.ts` | 40 | Registration/admission/waitlist/roster logic (WIP feature) |
| `src/services/engine/setupPlanner.test.ts` | 18 | Wizard planner — formats, determinism, scheduling |
| `src/adminConsole.test.ts` | 18 | Admin nav↔route↔RPC↔edge-function contract consistency |
| `src/services/engine/engineOperations.test.ts` | 13 | Engine operations |
| `src/services/engine/enginePlan.test.ts` | 9 | Normalized payload flatten/hydrate |
| `src/services/engine/persistenceMappers.test.ts` | 8 | Row mappers + per-tournament slicing |
| `src/services/engine/manualDraw.test.ts` | 7 | Manual/physical draw ceremony |
| `src/services/authSecurity.test.ts` | 7 | Workspace-isolation security scenarios |
| `src/services/competitionEngine.test.ts` | 6 | Legacy standings/fixtures/brackets |
| `src/services/engine/eligibilityEngine.test.ts` | 6 | Eligibility engine |
| `src/services/engine/engineScenario.test.ts` | 2 | Full-tournament end-to-end + draw reproducibility |
| `src/services/qr/qrEncoder.test.ts` | 14 | QR encoder round-trip (WIP — 4 failing as of 17 Oct audit) |

### Repository-level DB validation

| Tool | Purpose |
|------|---------|
| `npm run test:sql` (PGlite) | Applies 6 of the 8 migrations in-process (skips `security_hardening` + `phase1_organization_foundation`), exercises `engine_apply_plan`/`engine_read_state` idempotency, multi-tenant RLS, admin runtime, billing, automation, analytics — **41 assertion steps** |
| `npm run typecheck:functions` | tsc pass over the 4 Deno edge functions (via `tsconfig.functions.json` + deno shim) |

### Commands
```bash
npm test          # Vitest unit tests (must pass)
npm run test:sql  # PostgreSQL (PGlite) migration + RLS validation
npm run typecheck:functions  # Edge function types
npm run build     # TypeScript check + Vite build (must pass)
```

### Non-Negotiables

- All unit tests (181 as of the Oct 2026 audit) must keep passing
- `npm run build` must stay green
- All gates must pass before any merge
- **No E2E or React component tests exist** (no jsdom/testing-library/Playwright) — service-level + SQL harness only

---

## 11. HARD RULES FOR DEVELOPMENT

1. **Never remove a working feature.** Extend it.
2. **Never replace a real implementation with a placeholder**, mock, `alert()`, `setTimeout`, or hardcoded array.
3. A button must either persist data, navigate, or not exist.
4. Use the **scoped** store slices (`myMatches`, `myTeams`, `myFinances`) inside workspace pages.
5. Never hardcode an actor name — use `currentUser?.name` / `currentUser?.id`.
6. Never hardcode an amount (e.g. MVR 3500) — read from category/tournament config.
7. Tailwind `brand` tokens exist — do not add new ad-hoc colors.
8. Mobile breakpoints `xs`(375) `sm-phone`(390) `lg-phone`(430) already defined.
9. Keep `npm run build` green and `npm test` green at all times.
10. Do NOT edit files owned by another agent.
11. Do not delete seed data silently — mark as demo-labelled or replace with real empty state.

---

## 12. ADDITIONAL FEATURES (ROADMAP)

> **Schema-first note (Oct 2026):** several roadmap items already have **fully-migrated, RLS-protected tables** but no UI wiring yet: Equipment Inventory (`equipment_items`), Volunteer Management (`volunteer_shifts`), Digital Accreditation (`accreditations` with QR bearer credentials), Inter-Island Logistics (`inter_island_travel`), Emergency Response (`emergency_plans`), Hall of Fame (`hall_of_fame`), Digital Trophy Room (`trophy_room_items`), Island Rivalries (`rivalry_records`), Community Challenges (`community_challenges`), Referee Assessments (`referee_assessments`), Broadcast Studio (`broadcast_configs`), Tournament Templates (`tournament_templates`). Building these out is UI work, not schema work.

### A. Tournament Management & Automation
- AI Tournament Assistant
- Tournament Templates
- Rule Templates
- Automatic Tournament Awards
- Multi-Sport Festivals
- Inter-Atoll Championships
- Tournament Command Center / Control Room
- Custom Tournament Website Builder

### B. Matches / Live
- Live Match Center Pro
- Smart Match Analysis
- Digital Match Program
- Broadcast Studio

### C. Players / Teams
- Digital Player Cards
- Digital Player ID
- Digital Trophy Room
- Island-vs-Island Rivalries
- Hall of Fame
- Sports Heritage Archive

### D. Maldives Ecosystem
- Island Sports Pages
- School Sports Management
- Community Sports Challenges

### E. Operations / Logistics
- Inter-Island Logistics
- Venue Booking
- Equipment Inventory
- Volunteer Management
- Emergency Response Planning
- Digital Accreditation

### F. Referees
- Performance & Development tracking
- Official assignments management
- Private assessments
- Training records

### G. Offline Capabilities
- Offline Tournament Mode
- Local draft capture
- Idempotent sync
- Conflict review

### H. Public Experiences
- Custom tournament websites
- Player cards (public-facing)
- Trophy room
- Match program
- Broadcast studio
- Island pages
- Hall of Fame
- Community challenges

---

## 13. PHASED DELIVERY PLAN

### Phase 1: Foundation (substantial implementation; open foundation defects remain)

### Phased DB Status

- [x] Normalized tournament-engine schema migration added (additive, 28 tables + RLS)
- [x] Server-side transactional `engine_apply_plan` / `engine_read_state`
- [x] RLS tenant isolation validated (PGlite)
- [x] **All 8 migrations applied to live Supabase project** (`tktaujblxjxifgznooyi`) + 4 edge functions deployed
- [x] Competition engine (standings, fixtures, brackets)
- [x] i18n infrastructure (EN + DV)
- [x] Seed data (demo mode)
- [x] Fix known route defects (fixtures/results/reset-password/venues/:id — all fixed)
- [x] Add missing mutators to store (full list verified present — §6)
- [ ] Retire JSONB engine state once normalized reads become primary

### Phase 2: Core Tournament Lifecycle
- [x] Tournament setup wizard (11 steps, fully functional, engine publish)
- [ ] Team registration & verification workflow (**WIP**: `registrationEngine` + context wiring done; routes/pages/DB tables missing)
- [x] Fixture generation & scheduling (engine + FixturesManager + conflicts)
- [x] Live match scoring console
- [x] Official results confirmation flow
- [x] Standings calculation & display (engine-authoritative)

### Phase 3: Operations & Management
- [~] Finance ledger *(add works; verification/reject/refund UI missing — see §14)*
- [x] Sponsor management & deliverable tracking
- [x] Discipline & protest management
- [~] Official assignments *(pay-only; rostering UI missing)*
- [x] Venue booking & conflict detection
- [~] Communications manager *(delivery counts/SMS/email incomplete — see §14)*

### Phase 4: Public-Facing Features
- [~] Public tournament pages with brackets *(UI done; data is seed/snapshot, no public DB read path)*
- [~] Live match center (public view) *(UI done; realtime channel never fed)*
- [~] News & announcements *(gating correct; content seed-only for guests)*
- [~] Documents & media gallery *(record registries only; no storage/uploads)*
- [x] Search functionality (client-side)
- [~] Team/player/organization detail pages *(render seed data for guests)*

### Phase 5: Advanced Features
- [~] Reports & CSV exports *(real CSV/print; Group-A hardcode + fake share button)*
- [~] Printable match sheets *(print route works)*
- [ ] Social media share cards
- [ ] Tournament templates
- [ ] Multi-sport festival support
- [ ] Inter-Atoll championships

### Phase 6: Polish & Production
- [ ] Complete DV translation coverage (~50% today)
- [ ] Accessibility audit (WCAG)
- [ ] PWA packaging (Capacitor)
- [ ] Production deployment *(Supabase backend deployed; frontend hosting TBD)*
- [ ] Performance optimization
- [ ] End-to-end testing
- [ ] Provision Supabase storage buckets (logos, avatars, payment proofs, documents)

---

## 14. KNOWN DEFECTS & TECHNICAL DEBT

> **Status (full-app audit, 17 Oct 2026):** the Super Admin round completed everything listed in the FIXED tables below. A comprehensive audit then re-verified the whole codebase and produced the **current, complete open-defect list** (see `AUDIT_REPORT.md` for the full three-tier audit). Note: a parallel session was actively building the My Tournaments / per-tournament dashboard / registration-links feature set during the audit — WIP items are marked.

### Route Defects — FIXED

| Defect | Resolution | Verified by |
|--------|------------|-------------|
| `/fixtures` and `/results` both rendered `MatchesPage` | Now `FixturesPage` / `ResultsPage` (distinct) | `App.tsx` routes |
| `/reset-password` rendered `ForgotPasswordPage` | Now `ResetPasswordPage` | `App.tsx` routes |
| `/venues/:slug` rendered `VenuesDirectoryPage` | Now `VenuesDetailPage` | `App.tsx` routes |
| `/dashboard/matches` had no `:id` (cross-tenant write risk) | Id-scoped `matches/:id/live` route; writes go through id-scoped queries | `App.tsx` routes |

### Competition Engine Defects — FIXED

| Defect | Resolution | Verified by |
|--------|------------|-------------|
| Qualification hardcoded `idx < 2` | Generic ordering (points-per-game) in `qualificationEngine.ts` | engine test suites |
| Counts `live` matches in standings | No `live` status participates in standings — only finalised/official results | `engineScenario` / `engineAlgorithms` tests |
| Knockout later rounds used unresolved string IDs | `winnerOf()` resolution advances winners into placeholders (`competitionEngine.ts`) | `engineOperations` tests |

### Data & Architecture Debt — FIXED

| Issue | Resolution |
|-------|------------|
| App didn't use relational DB schema | Supabase-backed: workspace snapshot loads, RLS, `set_user_role`, and SECURITY DEFINER admin RPCs |
| `workspaceReady` defined but not exported | Exported as `isWorkspaceReady` in the context value |

### The five declared Super Admin limits — FIXED (this round)

| Former limit | Resolution |
|--------------|------------|
| Provider dispatch | `dispatch_notification_queue` (in-app, SQL) + `claim_notification_deliveries`/`mark_delivery_result` feeding the `notify-dispatch` edge function (Resend email, honest queued/failed policy); Dispatch button on AdminNotificationsPage |
| User suspension / deletion / audit | `admin_suspend_user` / `admin_unsuspend_user` / `admin_delete_user` / `admin_list_users` / `admin_user_events`; `suspended_at`/`deleted_at` columns; `is_super_admin()` excludes locked accounts; `RouteGuards` shows a suspension notice, deleted accounts are force-signed-out; AdminUsersPage directory + audit panel; GoTrue ban/purge via `admin-user-ops` edge function |
| Live payment processing | `payment_intents` + `billing_create_payment_intent` / `billing_confirm_payment` / `billing_cancel_subscription` (idempotent, late-failure guard); `billing-webhook` edge function with HMAC-SHA256 verification; AdminBillingPage intent lifecycle + sandbox checkout deep-link |
| Automation worker execution | `execute_automation_rule` (jsonb condition, whitelisted actions, dry-run, idempotency) + `run_due_automation_rules` with `next_run_at` scheduling and pg_cron tick; `automation-worker` edge function; Run now / Run due on AdminAutomationPage |
| Analytics charts & trends | `admin_daily_stats(p_from, p_days)` day buckets; AdminAnalyticsPage range selector with hand-rolled SVG line/bar charts, totals tiles and CSV export; graceful fallback to counts when the backend is unavailable |

### Open defects (verified 17 Oct 2026, prioritized)

| # | Issue | Impact |
|---|-------|--------|
| 1 | `notices` table has RLS enabled with **zero policies** | The deployed Notices & Announcements admin pages read nothing and cannot insert in production |
| 2 | Public pages have **no DB read path** — guests see fabricated seed data; signed-in users see their own workspace (incl. drafts) on "public" pages | Public site is demo-grade; private/draft tournaments leak into public views (`canAccessTournament(..., 'view_public')` exists but is never consulted publicly) |
| 3 | All four role portals (team/player/coach/referee) are **stubs** over seed data | No portal can actually do its job; fake `alert`/`setTimeout` handlers |
| 4 | `venues` store slice omitted from `WorkspaceSnapshot` + not cleared on user switch | User-created venues never persist in Supabase mode; leak across accounts in a shared session |
| 5 | **No Supabase storage anywhere** (no buckets, policies, or client calls) | Logos, avatars, payment proofs, documents, media cannot be uploaded |
| 6 | `NewOrganizationPage` hardcodes `ownerId: 'user-current-owner'` | Created org is invisible to its own creator |
| 7 | `FinanceLedger` writes new transactions as `status: 'approved'`; `verify/reject/refund` have no UI | Bypasses the fail-closed pending-verification model |
| 8 | `CommunicationsManager` hardcodes `deliveredCount: 16`; SMS/Email channels send nothing | Fabricated delivery receipts |
| 9 | `HistoricalEntry` form is a no-op (never calls `addHistoricalRecord`); `SyncCenter` is entirely fake (hardcoded ledger, fake sync button); `ClosureArchive` only flips status while claiming full archival + hardcoded checklist | Buttons violate hard rule #3 |
| 10 | `OfficialsManager`: no rostering UI (add/update/delete mutators orphaned), ignores tournament scope; referee panel is immutable seed data | Officials cannot actually be rostered |
| 11 | `RegistrationInbox` pulls `under_review` teams from **all** tournaments; falls back to hardcoded `3500` fee | Cross-tournament data leak + violates hard rule #6 |
| 12 | `ReportsExports`: standings export hardcoded to `'Group A'`; "Share Graphic" copies nothing | Fake share UX |
| 13 | `DisciplineManager` describes an "Automated Competition Discipline Policy" that does not exist; synthetic entity ids | Misleading UI |
| 14 | `LiveScoringConsole`: hardcoded sign-off referee name; `provisionalResult` dead code | Violates hard rule #5 |
| 15 | Dashboard `/dashboard/standings` reuses the **public** page — selector lists all tournaments, not permitted ones | Scope inconsistency |
| 16 | Password reset email lacks `redirectTo`; demo "Quick Switch User" panel still rendered on the production login page | Auth UX/security residue |
| 17 | `TournamentDetailPage`: hardcoded Awards prize copy + Rules tab ignores `tournament.rulesAndRegulations`; unknown slug falls back to first tournament (no 404) | Content fidelity |
| 18 | Follows are localStorage-only, not account-scoped | Follows don't travel with the account |
| 19 | Two competing `auth.users` triggers; `venues` double-declared (TEXT vs UUID PK); duplicated result-revision/communication/award systems | Schema hygiene; later migration silently undoes least-privilege role default |
| 20 | PGlite harness skips `security_hardening` + `phase1_organization_foundation` migrations | The largest hardening migration is unvalidated by `test:sql` |
| 21 | `scripts/BOOTSTRAP_SUPER_ADMIN.sql` hard-codes two email addresses for super-admin promotion | Remove or gate before public repo/CI exposure |

### Still open (carried over)

| Issue | Impact |
|-------|--------|
| Seed data is fabricated (~114 records) | Demo/local mode only; guests see it on the live site (ties into #2) |
| i18n gaps | ~50% Dhivehi coverage; page bodies hardcoded English; DB translations not consumed at runtime |
| Missing UI wiring | Context mutators exist for officials rostering, finance verification, gallery update, communication status — pages don't expose them |

### In progress (parallel session, 17 Oct 2026)

Registration/roster/payment + per-tournament dashboard build: `registrationEngine` (40 tests), context registration mutators (forms/roster token/payment verify), `MyTournamentsPage` + 22-section `TournamentDashboardLayout`, `qrEncoder`, `import/csvTools` — **dashboard routing subsequently reported connected at 05:56**. Other wiring and tests require verification; the earlier red gate results are historical, not current results.

---

## 15. FILE NAMING CONVENTIONS

### Code Files

| Pattern | Example | Usage |
|---------|---------|-------|
| `PascalCase.tsx` | `HomePage.tsx`, `TournamentBracket.tsx` | React components and pages |
| `camelCase.ts` | `seedData.ts`, `maldivesLocations.ts` | Data files and utilities |
| `camelCase.tsx` | `AppContext.tsx`, `publicSurface.tsx` | Context providers, special modules |
| `camelCase.test.ts` | `competitionEngine.test.ts` | Test files (co-located) |
| `camelCase.scenarios.test.ts` | `competitionEngine.scenarios.test.ts` | Scenario-based tests |

### Directories

| Pattern | Example | Usage |
|---------|---------|-------|
| lowercase single-word | `components`, `pages`, `services` | Top-level source directories |
| PascalCase groups | `components/ui`, `components/layout` | Component subdirectories by domain |
| lowercase page groups | `pages/public`, `pages/organizer` | Page subdirectories by surface |

### Database Migrations

| Pattern | Example |
|---------|---------|
| `{YYYYMMDDHHMMSS}_{description}.sql` | `20261013000000_workspace_isolation_rls.sql` |

### Documentation Files

| Pattern | Example |
|---------|---------|
| `UPPER_SNAKE_CASE.md` | `REPO_MAP.md`, `README.md` |
| `plan.md` | This file — master plan |
| `COMPLETE_*.MD` | Tournament lifecycle docs in `docs/` |

---

*Last updated: 17 October 2026 — synced against the full-app audit (`AUDIT_REPORT.md`); figures reflect the verified tree at that time.*
*KULHIVARU+ — Republic of Maldives Sporting Ecosystem*


## 16. USABILITY REQUIREMENTS AND MISSING WORKFLOW DETAILS

### 16.1 Scope and evidence

Keep every existing feature, working route, competition rule and permission. Simplify how people reach and operate features. This is a document revision; no application code was supplied or changed. Treat inherited audit counts and deployment claims as dated observations. Record new checks with date, environment, command or user journey, result and evidence. A route rendering is not proof that its mutation persists or its access checks work.

Resolve these plan contradictions before marking work complete:

| Finding | Required correction or follow-up |
|---|---|
| Dashboard still labelled unrouted | Later session reports routing and rendering working; verify each child section separately |
| Public integration marked done while public read path listed missing | Keep partial until a signed-out visitor sees authorized published data from real persistence |
| Normalized persistence described as replacing JSON | Document JSON workspace plus normalized mirror accurately; define one authoritative writer per entity |
| Finance/comms checked complete while major actions missing | Keep partial until verification, refunds and real delivery states work |
| Fixed legacy bugs also listed as current | Keep historical findings distinct from current defects |
| Approximate route counts and paths | Generate inventory from current routes; distinguish parent layouts, aliases and actual screens |
| Broad compliance claims for sports rules and reports | Record source/version and validation evidence before claiming compliance; support tournament-specific rules |
| Existing test failures described as current | Re-run current checks; do not assume earlier failures either remain or were fixed |

### 16.2 Navigation: all sections remain available

Organizer home: keep `/dashboard` as the established home unless the current repository defines another canonical route. Existing `/organizer` links may redirect to it. Do not create a second disconnected workspace.

Tournament workspace: retain the connected `/organizer/tournaments/:id` route and actual child deep links. Navigation labels can change without changing saved URLs. Carry tournament/category context through every action. Provide Back to My Tournaments and View Public Page; show public-page availability honestly for drafts.

| Main navigation | Sections and functions |
|---|---|
| Overview | Current stage, next action, attention queue, milestones, activity and upcoming matches |
| Teams | Team Management, Player Management, Registration Management; quick Registration Link shortcut |
| Matches | Fixtures & Scheduling, Matches & Live Scoring, Standings; visible shortcuts to Draw Ceremony, Qualification and Knockout Brackets |
| Payments | Payment Verification; retain full finance ledger, expenses, refunds and sponsor accounting through direct links |
| More | Details, Settings, Registration Form Builder, Registration Links, Draw Ceremony, Qualification, Knockout Brackets, Discipline, Sponsors, Announcements, Tournament Staff, Reports & Exports, Awards, Completion & History |

Use grouped More navigation: Setup; Competition; People & Operations; Content; Finish. Existing venues, protests, incidents, checklist, officials, news, documents and media remain reachable even if outside the reported 22 sections. Do not drop these modules during consolidation. Pin favorite sections, offer searchable navigation, and show outstanding-count badges. Desktop may expand these groups; mobile uses five labelled bottom items and a searchable More sheet. Common actions must not require opening More.

### 16.3 First organizer page

Order: organization name/switcher; Create Tournament; My Tournaments; Needs Attention; Today's Matches; recent activity. Hide an unnecessary organization chooser when there is only one organization. Show only owned or assigned tournaments.

Cards show logo or initials, tournament name, sport, dates or Dates to be confirmed, status and an Open Tournament action. Card title/body opens the tournament in one activation; secondary menus are separate controls. Preserve search, filters and scroll position on return. New accounts see an explanation and Create Your First Tournament. Failed loading shows Retry, never a misleading empty account.

### 16.4 Tournament overview and progress

Header: tournament name, category when applicable, lifecycle status and Copy Registration Link when registration is open. Show at most four useful totals, with units and labels. Each total opens the corresponding filtered list.

Separate setup readiness, registration state and competition progress. Label 67% as Setup progress only when backed by explicit weighted requirements; show numerator/denominator or a checklist explanation. Do not label a registration-stage tournament as competition in progress just because setup is incomplete. Match progress uses official completed matches and explains byes/cancelled matches. Fees collected means verified net receipts; display pending amounts separately.

Needs Attention lists real tasks by urgency: missing required setup, applications, payment reviews, incomplete rosters, conflicts, result approvals and unresolved protests. Each row has one direct Fix/Review action. Avoid duplicate counts for the same task. Show empty, loading, unavailable and error states distinctly.

### 16.5 Create early; configure progressively

Quick creation asks for name, sport and planned date, with Date not decided yet supported. Organization is inherited or selected only if needed. Create Draft persists the tournament and opens its workspace. Team count, venue, categories, format, fees and detailed rules can be undecided. Sponsorship and planning can start before registration.

Retain the full 11-step configuration as Guided Setup or Advanced Setup. Do not force early team entry, draw, fixture generation or publication. Provide Save and Continue Later. Distinguish public announcement, opening registration, publishing fixtures and beginning competition. Each has its own readiness checks.

Provide sport templates with a visible summary and editable rules. Freeze/version rules at appropriate milestones. After a draw or official result exists, explain downstream effects before changing format, teams, qualification or scoring rules. Never silently regenerate published fixtures.

### 16.6 Next-action workflow

| State | Primary action | Gate / outcome |
|---|---|---|
| Draft planning | Prepare Registration | Configure categories, capacity, dates, form and fee requirements |
| Registration ready | Open Registration | Show public preview; confirm opening; issue working link |
| Registration open | Review Applications | Open pending queue; sharing remains a secondary action |
| Applications reviewed | Review Player Lists | Validate category rules, duplicates and required documents |
| Eligible teams ready | Prepare Draw | Freeze participants; choose physical/manual or digital draw |
| Draw completed | Generate Fixtures | Preview deterministic pairings and conflicts; save draft |
| Fixtures prepared | Publish Fixtures | Resolve blocking conflicts; confirm publication |
| Competition running | Open Match Center | Open today's scheduled/live matches |
| Stage complete | Review Qualifiers | Show ranking reasons; require organizer approval by default |
| Final official | Review Awards & Close | Resolve blockers; confirm awards/champion and archive |

These are helpful recommendations, not a rigid sequence that blocks legitimate parallel planning. Support configured exceptions, reopened registrations, waitlists and postponed events with clear permissions and audit history.

### 16.7 Registration and team-manager experience

Form Builder must support text, number, date, choice, checkbox and file fields, required/optional rules, ordering, help text and preview. Supply editable templates: team name; first/second jersey colors; manager name, ID and phone; fee instructions and payment slip when applicable. Keep system identifiers stable. Version published forms so edits do not invalidate existing submissions.

Registration Links offers Copy Link, platform share where available, downloadable QR and a public preview. QR must decode to the exact URL. Support open/closed dates, category, capacity and expiry/revocation where configured. Copy success means clipboard succeeded; show a selectable link fallback otherwise. Opening WhatsApp is a share action, not proof of delivery.

Choose and document an applicant access model: guest submission with a secure confirmation/manage link, or a clearly explained account requirement before entry. Never accept a form then silently discard it. Save drafts safely, show field errors beside inputs, preserve entries after failure, prevent duplicate submission, and issue a persistent reference and receipt. Handle closed, full and waitlist states clearly.

Team managers can view application, payment and roster states separately; correct requested fields; resubmit; withdraw according to policy; and recover access without asking an organizer to expose private tokens. Tokens must be scoped, expiring/revocable and rotated on replacement, without exposing internal credentials in public pages.

Player-list template: full name, jersey number, ID number and ID-card front where tournament policy requires them. Add configurable eligibility fields only when necessary. Include manual entry, spreadsheet import with preview/error rows, duplicate checks, category-specific roster limits, deadline/lock, request changes and controlled post-lock amendments. Team approval, payment verification and roster approval are independent states. Allow authorized fee waivers with recorded reasons.

### 16.8 Direct actions and click budgets

Count navigation activations separately from typing, file selection and deliberate review. A one-click action starts a task; it does not skip required input or validation.

| Task from the relevant screen | Target interaction |
|---|---|
| Open tournament | One card/title activation |
| Open an attention item | One direct action, correct record/filter already selected |
| Add team or player | One activation opens short form; one Save after entry |
| Edit ordinary details | Inline edit or small panel; save without leaving context |
| Copy registration link | One activation; immediate truthful feedback |
| Review application/payment | One activation opens details with decision controls beside evidence |
| Open scoring | One activation from match card/list |
| View standings/bracket | One visible shortcut from Matches or Overview |
| Export current list | One activation for a safe default; options available separately |
| Delete/publish/finalize/refund/verify payment | Explicit review and confirmation, then one guarded submission |

Routine updates avoid repetitive confirmation dialogs. Offer Undo only when the reversal is real and permitted. Official match-event corrections append an auditable correction rather than erasing history. Batch review requires explicit selection and a result for each record; never approve unreviewed evidence automatically. A preview must distinguish selected, rejected and skipped rows.

### 16.9 Payment, competition and closure detail

Payment review shows expected amount, category, payer, reference, submitted date and private proof side by side. States include not required/waived, unpaid, submitted, under review, verified, rejected, partial and refunded as supported. A typed bank reference never verifies payment. Validate duplicate references/proofs, record verifier/time/reason and enforce configured separation of duties. Refunds create ledger entries rather than deleting receipts.

Scheduling checks teams, venues, officials, rest windows and unresolved bracket dependencies. Explain each conflict and link to a fix. Use configured sport/category rest rules; the existing 90-minute value is a configurable default, not a universal rule. Manual draw records who picked which token and prevents duplicate picks; reseeding/redraw requires a reason and an impact preview.

Official results alone feed final standings and qualification. Keep manual qualification approval as the default in this plan; automation is an explicit setting. Ties, protests, corrections, forfeits, abandoned matches and withdrawals must produce deterministic configured outcomes or a visible unresolved decision. Correcting an earlier result must preview downstream consequences and protect completed later rounds.

Closure shows actual checks, confirmed champion/awards, unresolved finance/protests and a final report preview. Archive must persist the final snapshot and history. Reopening requires permission, reason and revision history. Never claim complete archival when only the status changed.

### 16.10 Usable forms, accessibility and languages

Use visible labels and plain verbs, with brief help beside unfamiliar fields. Avoid icons without text for primary actions. Distinguish required from optional. Reuse known organization/team details and remember safe preferences. Use accessible contrast, visible keyboard focus, logical tab order, screen-reader labels and errors linked to fields. Touch targets should be at least 44 by 44 CSS pixels, with spacing. No horizontal page overflow at 375, 390 or 430 pixels. Complex tables may scroll inside a labelled region; offer mobile record cards.

Modal/sheet forms trap focus and return it to the opener; Escape closes when safe. Browser Back works without losing saved state. Prevent accidental loss of unsaved edits. Keep the main mobile action visible without covering content or the keyboard. Status uses text and icons as well as color. English/Dhivehi covers forms, errors, empty states and receipts, with RTL layout and correct mixed-direction IDs/phone numbers. Show MVR and Maldives time explicitly where ambiguity matters.

### 16.11 Reliability and account boundaries

Show Loading, Saving, Saved, Not saved—Retry and Conflict states based on actual operations. Success follows durable server acknowledgement; a local draft is labelled Saved on this device. Retry must not duplicate applications, payments, fixtures or match events. Never overwrite another collaborator's newer edit silently; offer refresh/review with preserved local input. Clear account-scoped caches and sensitive drafts on sign-out/switch; do not reuse a previous tournament selection without authorization.

No fake sync indicators or provider delivery counts. Offline capability stays labelled unavailable until capture, queue, conflict resolution and recovery work. Sensitive documents require private authorized access, expiry/revocation of temporary links, file validation, retention/deletion rules and auditability. Public data reads need an explicit allowlist of published fields, separate from staff/private records. Test direct URLs and server actions, not only hidden buttons.

### 16.12 Missing requirements and priority

| Priority | Requirement | Completion evidence |
|---|---|---|
| P0 | Recheck historical privacy, workspace, finance and notices defects | Allowed/denied journeys and persistence verified in current environment |
| P0 | Real uploads and private proof/ID access | Authorized upload/reopen works; foreign/signed-out access denied |
| P0 | Real public published data | Independent signed-out visitor sees published changes; drafts remain private |
| P1 | Simple home, five navigation items, direct actions | Core click budgets met; every legacy feature still reachable |
| P1 | Quick draft creation before team count is known | Create/resume planning tournament with undecided fields |
| P1 | Complete custom registration, roster and payment workflow | Manager submission through organizer decision survives reload and account separation |
| P1 | Staff roles, invitations and access revocation | Assigned staff collaborate on the same tournament; revoked access stops on server |
| P1 | Scheduling, qualification and correction review | Conflicts and downstream effects explained; deterministic results |
| P1 | Real closure and reports | Saved awards, champion, financial states and archive agree |
| P2 | Profile editing, support/contact and account recovery | Working save/request and clear next action |
| P2 | Complete Dhivehi, accessibility, templates and safe bulk import | Mobile/keyboard/RTL workflows and import errors verified |
| P2 | Operational backup/restore and release recovery | Documented restore exercise and deployment rollback evidence |

### 16.13 Acceptance journeys and delivery order

Implement by extending current routes: first reconcile status and verify critical defects; then navigation/home/quick creation; then registration/team/payment tasks; then competition/closure; finally accessibility/language polish. Preserve existing working behavior throughout.

Acceptance journeys:

1. A new organizer creates a draft from name, sport and an undecided date; returns later and finds it unchanged.
2. My Tournaments opens the selected tournament in one activation; all 22 reported sections plus existing operational modules remain reachable.
3. An applicant uses a shared link, submits once despite retry, receives a reference, returns and corrects requested fields.
4. A manager submits a player list and proof; organizer reviews the correct tournament; team/payment/roster decisions persist independently.
5. An unverified payment never increases verified fees collected; refund and waiver totals reconcile.
6. Four eligible teams complete a draw, fixture preview, publication, live scoring, result confirmation, qualifier review, final, awards and archive.
7. A foreign account, revoked staff member and signed-out visitor cannot read private tournament records or ID/payment files through URLs or direct requests.
8. A public visitor sees only published information; unknown tournament links never fall back to another tournament.
9. A save failure, expired session, duplicate click and concurrent edit each show a recoverable, truthful outcome without data loss.
10. Repeat essential journeys on a narrow mobile viewport, with keyboard only, and in Dhivehi RTL; verify all labels and action feedback.

Run repository build/type checks, meaningful service tests, full migration/RLS checks and targeted end-to-end journeys after implementation. Record actual results rather than copying historic counts. Do not mark this usability revision implemented until the application passes these journeys.
