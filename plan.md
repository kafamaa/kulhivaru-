# KULHIVARU+ — MASTER PLAN

> **Complete Sports Tournament Management, Live Operations & History Ecosystem for the Republic of Maldives**
>
> This document is the single source of truth for the KULHIVARU+ product vision, architecture, features, and execution plan.
> It consolidates the product spec, repository map, feature lists, and delivery phases into one master reference.

---

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
16. [Specification Compliance Map (150-point spec)](#16-specification-compliance-map-150-point-spec)

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

> **Status (18 Oct 2026):** the former WIP feature set is now fully routed: `MyTournamentsPage` (`/dashboard/tournaments`), `TournamentDashboardLayout` (`/organizer/tournaments/:tournamentId`, 22 sections), `TeamRegistrationPage` (`/register/:slug`), registration links section, QR + registration services — all imported by `App.tsx` and compiling green.

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
│   │   ├── organizer/      # Organizer workspace pages (+ unrouted MyTournamentsPage WIP)
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

### Known schema risks (verified 17 Oct 2026; resolutions noted 18 Oct — see §14)

- ~~`venues` is **declared twice** (TEXT PK in `security_hardening` vs UUID PK in super-admin foundation).~~ *(resolved: hardening migration applied to live; single declaration governs)*
- ~~**Two competing `auth.users` triggers** create profiles with different default roles (`guest` vs `organizer`); the later migration wins.~~ *(resolved: legacy trigger dropped by migration, pushed)*
- ~~`notices` has RLS enabled but **zero policies** → unreachable for all client roles.~~ *(resolved: `20261021000000_usability_p0_fixes.sql`, pushed — public read of published + super-admin CRUD)*
- Duplicated machinery: `match_result_revisions` vs `engine_match_result_revisions`; `communication_*` vs `notification_*`; `tournament_awards` vs `engine_awards`. *(still open — low priority)*
- ~~The `venues` **store slice is omitted from `WorkspaceSnapshot`** — user-created venues never persist in Supabase mode and are not cleared on user switch.~~ *(resolved 18 Oct: venues in snapshot + cleared on switch + shipped to guests via payload; verified live)*

---

## 7. AUTH & PERMISSIONS

### Roles

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

### Known Defects (legacy)

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
| 22 | Public Tournament Data Integration | done (filtered scope) | `permittedTournaments`, scope-based views |

### Engine UI surfaces (`src/pages/engine/`, under `/engine/*`, gated by `RequireOrganizer`)

`/engine`, `/engine/configuration`, `/engine/teams`, `/engine/draw`, `/engine/fixtures`, `/engine/calendar`, `/engine/conflicts`, `/engine/matches`, `/engine/standings`, `/engine/qualification`, `/engine/brackets`, `/engine/discipline`, `/engine/awards`, `/engine/history`.

### Setup wizard (engine-driven)

`/dashboard/tournaments/new` → `src/pages/organizer/TournamentSetupWizard.tsx` is rebuilt on the real engine: 11 steps whose fixture/standings/qualification previews come from `SetupPlannerInput`/`planTournament`, with a deterministic publish (`initializeEngineTournament`) that creates the tournament, categories, teams, matches, and engine state in one atomic store action. Blocking conflicts prevent publish.

### Persistence (shifted per spec — no unstructured JSON blob)

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

### Test Files (verified 18 Oct 2026 — 217 tests / 15 files, all passing)

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
| `src/services/qr/qrEncoder.test.ts` | 14 | QR encoder round-trip (all passing) |

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

> Aligned to the 150-point specification's 14 phases (spec §147). Status verified 18 Oct 2026: `tsc` 0 errors, 217/217 unit tests, 54/54 PGlite SQL steps, production build passing.

### Phase 1: Foundation — COMPLETE
- [x] Auth (Supabase email/password, password reset with `redirectTo`, session restore, suspension lock-out)
- [x] Profiles (`public.users`, self-service profile editing on Account page — name/atoll/island)
- [x] Organizations + memberships + ownership stamping (hardcoded-owner bug fixed)
- [x] Permissions (`canAccessTournament`, tournament members/collaborators, `getUserPermissions`)
- [x] Dashboard (`/dashboard` overview with next-action, empty states, health checklist)

### Phase 2: Tournament Creation & Workspace — COMPLETE
- [x] Quick draft creation (`QuickCreateTournamentPage` — name/sport/date/island only, spec §7)
- [x] 11-step setup wizard with engine publish + conflict preflight
- [x] 22-section per-tournament dashboard (`TournamentDashboardLayout`, deep-linked)
- [x] Tournament details/settings sections
- [x] Sport configuration via engine (points rules, tiebreakers, volleyball sets, best-of)
- [~] Multi-category: engine categories exist; shared-across-category UI partially surfaced

### Phase 3: Registration — LARGELY COMPLETE (parallel-session build)
- [x] Form builder (`TournamentRegistrationFormPage`, `TournamentFormsSection`)
- [x] Registration links + QR (`TournamentRegistrationLinksPage`, `qrEncoder` 40+ tests)
- [x] Public team registration page (`TeamRegistrationPage`, roster-token submission)
- [x] Applications panel + payment verification (`PublicApplicationsPanel`, `TournamentPaymentsPage`, `registration_applications` migration)
- [~] Conditional fields / per-field privacy warnings — field types exist; conditional logic partial
- [~] Player/staff registration forms — team roster flow done; standalone player/staff forms partial

### Phase 4: Participants — COMPLETE
- [x] Teams CRUD + roster management (`TeamsManager`, `TournamentPlayersPage` add/edit/remove/transfer/CSV import)
- [x] Player eligibility checks (`eligibilityEngine` + duplicate/jersey validation in import)
- [x] Staff (`TournamentStaffPage`)
- [x] Officials with real rostering (`OfficialsManager` — assign/disburse/remove, tournament-scoped)
- [x] Venues (`VenuesManager`) — persistence defect open (§14 #4)

### Phase 5: Competition Engine — COMPLETE
- [x] Stages/rounds/matches model (28-table normalized engine schema + `engine_apply_plan`)
- [x] Draw ceremony (`drawEngine`, manual/seeded/pot-based, audit; `EngineDrawPage`)
- [x] Fixture generation + **conflict detection** (`conflictEngine`, `EngineConflictsPage` — double-booking, rest, officials)
- [x] Publish fixtures (engine plan publish → public RLS read path)
- [x] Swiss (`swissEngine`), double-elimination, best-of series engines

### Phase 6: Match Operations — COMPLETE
- [x] Match-day command lists (`MatchOperationsList`, `TournamentMatchesSection`, `EngineMatchesPage`)
- [x] Live scoring console (sport-aware events, periods, lock statuses)
- [x] Lineups + eligibility gates (`match_lineups` engine tables, lineup validation)
- [x] Result confirmation cascade (`confirmResult` → standings/stats/cards/suspensions/qualification/bracket)
- [x] Result correction with history (engine correction flow, audited)

### Phase 7: Standings, Statistics, Discipline — COMPLETE
- [x] Configurable standings metrics + deterministic tiebreakers (engine, tested)
- [x] Player/team statistics derived from events (`EngineStatistics`/`TournamentStatisticsSection`)
- [x] Discipline: cards → suspensions (`disciplineEngine`, threshold rules, red-card minimums)
- [x] Disciplinary cases + appeals (`DisciplineManager`, appeals section)
- [ ] Administrative point adjustments (§54 of spec — not built; see §16)

### Phase 8: Qualification & Knockout — COMPLETE
- [x] Qualification engine (top-N, best third-place, custom combinations, preview)
- [x] Dynamic bracket placeholders resolved from real qualification (`knockoutEngine`, `EngineBracketsPage`)
- [x] Byes (no fake teams; `__BYE__` nodes), third-place playoff support
- [x] Completion checks + champion derivation (`awardsEngine`: `canCompleteTournament`, `computeChampion`, `deriveAwards`)

### Phase 9: Public Surface — PARTIAL (biggest remaining gap)
- [~] Public tournament/match/team/player pages: full UI, but guests read **seed/snapshot data**; real DB read path only for engine-published tables (§14 #2)
- [x] Search (client-side global search), follow system (`followService`)
- [x] Organizer/organization public profiles (`OrganizationsListPage`, `OrganizationDetailPage`)
- [x] Realtime hook exists (`useRealtimeMatches`) but is not yet wired to public pages
- [ ] Followers notifications preferences

### Phase 10: Content & Media — PARTIAL
- [x] News CMS (`NewsManager`, public news pages, gating by status)
- [x] Documents registry (`DocumentsManager`, `DocumentsPage`) — no storage/uploads yet
- [x] Photo gallery / video registries **+ Supabase Storage shipped 18 Oct** (buckets + fail-closed RLS + `storageService` + 6 UI surfaces + DB push); guest anonymous file upload still needs a service-role edge function (URL paste fallback)
- [x] Polls/voting (spec §81) — **removed from product scope** (user decision, 18 Oct 2026): no poll/voting code exists anywhere in `src/` or `supabase/`; nothing to build, migrate or clean up

### Phase 11: Promotion & Awards — PARTIAL
- [x] Sponsors (`SponsorManager`, tiers)
- [x] Awards derived from results (`EngineAwardsPage` + `deriveAwards`)
- [x] **Certificates**: print-ready certificate cards with real recipients + verification QR (ReportsExports, added 18 Oct)
- [~] Social graphics: real share text/link copy; full branded graphic generation not built

### Phase 12: Finance (MVR) — LARGELY COMPLETE
- [x] Ledger with pending-verification model + Verify/Reject with reasons (fixed 17 Oct)
- [x] Entry-fee configuration + payment-proof review (`TournamentPaymentsPage`)
- [~] Donations/expenses dashboards — ledger categories cover them; dedicated donation UX partial
- [ ] Telegram alerts (needs secrets; spec §111 optional)

### Phase 13: Import/Export/Reports/API — PARTIAL
- [x] CSV import with validation + duplicate resolution (players rosters; engine plan import)
- [x] CSV/print exports (standings all groups, players, share link; match sheet print)
- [~] Reports center: pages exist; custom report builder not built
- [ ] Public REST API + API keys (spec §123 — future)
- [ ] Embeds (spec §124 — future)

### Phase 14: PWA, Offline, Realtime, Hardening — STARTED
- [x] **PWA manifest** added 18 Oct (`manifest.webmanifest`, standalone display, icons) — installable
- [ ] Service worker / offline shell (needs `vite-plugin-pwa`; not yet)
- [ ] Offline match center with local queue + sync (spec §113 — designed in SyncCenter copy, not implemented)
- [x] Security hardening round 1 (RLS on ~103 tables, notices policies migration, auth-trigger hygiene migration)
- [x] Supabase Storage buckets + policies + page wiring *(shipped & pushed 18 Oct: migration + PGlite validation + `storageService` + 6 UI surfaces; guest anonymous file upload still needs a service-role edge function)*
- [ ] Full WCAG accessibility audit
- [ ] E2E tests (Playwright) — unit/SQL coverage green (217 tests, 54 SQL steps); authenticated browser walkthrough replaced by the push-only live-DB E2E migration `20261023000003_public_content_rls_e2e.sql` (anon/owner/non-owner assertions all verified on the live project)

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

### Fixed in the 17–18 Oct usability/spec round (verified: tsc clean, 207/207 tests, 42/42 SQL steps)

| Former defect | Resolution | Verified by |
|---------------|------------|-------------|
| #1 `notices` RLS with zero policies | Migration `20261021000000_usability_p0_fixes.sql` — super-admin CRUD + public read of published notices + grants + PGlite harness step | `test:sql` step "usability P0 fixes" |
| #19 competing legacy auth trigger | Same migration drops `on_auth_user_created_profile`; harness asserts trigger is gone | `test:sql` |
| #6 `NewOrganizationPage` fake ownerId | Hardcoded id + fabricated contact fallbacks removed; context stamps real owner | `NewOrganizationPage.tsx` |
| #7 `FinanceLedger` auto-approve | New entries are `pending_verification`; real Verify/Reject actions with reason modal; approver = signed-in user | `FinanceLedger.tsx` |
| #8 `CommunicationsManager` fake counts | `deliveredCount` = real approved-team count; channel locked to in-app with honest note | `CommunicationsManager.tsx` |
| #9 `HistoricalEntry` no-op | Persists via `addHistoricalRecord` (score/venue preserved in notes) + live Archived Editions list | `HistoricalEntry.tsx` |
| #9 `SyncCenter` fabricated | Rewritten: real online/offline status, real recent match events, honest "no offline queue" notice | `SyncCenter.tsx` |
| #9 `ClosureArchive` fake checklist | Rewritten with real pre-closure verification (`canCompleteTournament`, `computeChampion`, allowances paid, open cases/protests) — close blocked while any item pending; closing records awards + permanent public history entry | `ClosureArchive.tsx` |
| #10 `OfficialsManager` no rostering | Full assign/disburse/remove UI, tournament-scoped via matchId | `OfficialsManager.tsx` |
| #11 `RegistrationInbox` cross-tournament leak + hardcoded 3500 | Scoped to this tournament's roster; fee = `registrationConfig.feeAmountMVR` | `RegistrationInbox.tsx` |
| #12 `ReportsExports` Group-A hardcode + fake share | Standings CSV exports every real group; Share copies real text+link (honest failure state); **certificates** with verification QR added | `ReportsExports.tsx` |
| #14 `LiveScoringConsole` hardcoded referee | Sign-off uses assigned referee or signed-in operator | `LiveScoringConsole.tsx` |
| #16 password reset + demo panel | `redirectTo: /reset-password`; demo panel and role picker demo-only | `authService.ts`, `AuthPages.tsx` |
| Account page display-only | Real profile editing (name/atoll/island) persisted via self-update RLS | `AuthPages.tsx`, `authService.updateUserProfile` |
| No PWA manifest | `manifest.webmanifest` + icon/theme links; production-broken `public/logo.png` paths fixed to `/logo.png` | `index.html`, `public/manifest.webmanifest` |

### Open defects (verified 18 Oct 2026, prioritized)

| # | Issue | Impact |
|---|-------|--------|
| 1 | ~~Public pages have **no DB read path** for guests~~ **FIXED 18 Oct (production-push round)**: guest hydration via `loadGuestPublicWorkspace()` + `public_tournament_content` (RLS + status alignment + sanitized publish hook); live-verified with a push-only DB E2E migration + logged-out browser sweep (real data on all 16 public routes, zero console errors, no seed flash) | Closed |
| 2 | ~~Venues store slice omitted from `WorkspaceSnapshot` + not cleared on user switch~~ **FIXED 18 Oct**: persisted, cleared on switch, published to guests (live-verified) | Closed |
| 3 | ~~Supabase Storage pending deployment + UI wiring~~ **FIXED 18 Oct**: migration pushed; upload wiring live in 6 UI surfaces. *(Guest anonymous file upload still needs a service-role edge function — URL paste fallback)* | Closed (guest uploads = remaining option) |
| 4 | ~~`DisciplineManager` claims an "automated discipline policy" that doesn't exist; synthetic entity ids~~ **FIXED 18 Oct (completion round)**: manual-sanctioning copy, real entity ids from the tournament roster, team picker scoped to `activeTournament.teams`, "Record Sanction" action | Closed |
| 5 | ~~Dashboard `/dashboard/standings` reuses the public page — lists all tournaments, not permitted ones~~ **FIXED 18 Oct**: dashboard route scoped to `permittedTournaments`, public route shows all; honest empty state | Closed |
| 6 | ~~`TournamentDetailPage`: hardcoded awards copy; rules tab ignores `rulesAndRegulations`; no 404 for unknown slug~~ **FIXED 18 Oct**: real awards slice, rules honor `rulesAndRegulations` with honest default fallback, dynamic group names from `Team.group`, honest entry fee (`Not set` when 0), Not Found guard; bracket rewritten (no fabricated MVR/stadium claims); `|| tournaments[0]` fallbacks removed from 5 other detail pages; `/venues` fully rewritten on the `venues` slice | Closed |
| 7 | ~~Follows are localStorage-only, not account-scoped~~ **FIXED 18 Oct**: `followService` keyed per account (`kulhivaru_follows_v1:<uid>`, guest shared key) via `setFollowScope` on every auth change; HomePage dismissed announcements scoped the same way | Closed (server-synced follows = future enhancement) |
| 8 | `venues` double-declared (TEXT vs UUID PK); duplicated result-revision/communication/award systems in JSONB vs engine | Schema hygiene |
| 9 | PGlite harness skips `security_hardening` + `phase1_organization_foundation` migrations | Largest hardening migration unvalidated by `test:sql` |
| 10 | `scripts/BOOTSTRAP_SUPER_ADMIN.sql` hard-codes two emails for super-admin promotion | Gate before public repo/CI exposure |
| 11 | ~~No service worker / offline shell~~ **FIXED 18 Oct**: `sw.js` + `offline.html` + PROD-only registration, verified in production build; SyncCenter offline queue still honestly unimplemented | Closed (offline queue = spec §113 remainder) |
| 12 | No administrative point adjustments (spec §54), no medal table (spec §102), no polls (spec §81 — removed from product scope), no public API (spec §123) | Spec remainder — see §16 |
| 13 | ~~Realtime hook (`useRealtimeMatches`) exists but public pages don't subscribe~~ **FIXED 18 Oct**: `refreshPublicData` added to AppContext; LiveMatchesPage + HomePage wired to the hook with honest "Live · updated <time>" status and refresh control | Closed |
| 14 | ~~Migrations `20261021000000_registration_applications.sql` + `20261021000000_usability_p0_fixes.sql` + `20261022000000_storage_buckets.sql` **not yet pushed**~~ **FIXED 18 Oct**: all 15 migrations pushed & in sync with live (verified via `migration list`) | Closed |
| 15 | ~~Guests could not see the registration lifecycle — loader omitted `registration_config`/opens/deadline and published form fields, so the public page's legacy `?? 'open'` default showed an accepting form regardless of the organizer's draft/closed state~~ **FIXED 18 Oct**: lifecycle read from the tournament row (same debounce as the snapshot), published form field definitions ship in the payload, lifecycle panel spells out that a published form ≠ open registration | Closed — found live ("published form but public page says Draft": stored status was still `draft`; the organizer must also click **Open registration**) |

### Fixed in the 18 Oct "finish everything" completion round (verified: tsc 0, 267/267 tests, 63/63 SQL harness steps, build OK, guest browser sweep zero console errors)

**Batch A — public honesty**
| Surface | Resolution |
|---------|-----------|
| `TournamentDetailPage` | Real awards slice; rules honor `rulesAndRegulations`; honest entry fee; dynamic groups; bracket wired; Not Found guard (see open-defect #6) |
| `TournamentBracket` | Rewritten — no fabricated prize/stadium/broadcast claims; honest "not drawn yet" empty state |
| `CoachDetailPage` / `MatchDetailPage` / `RefereeDetailPage` / `OrganizationDetailPage` / `TeamDetailPage` | Removed `|| X[0]` silent fallbacks — unknown id → Not Found |
| `VenuesDirectoryPage` | Fully rewritten on the real `venues` slice + PageMeta + honest empty state |
| `LiveMatchesPage` / `HomePage` | Wired to `useRealtimeMatches(refreshPublicData)`; honest sync timestamp/status |

**Batch B — registration honesty**
| Surface | Resolution |
|---------|-----------|
| Migration `20261024000001_registration_bank_reference.sql` | `bank_reference` column + 15-arg RPC (14-arg signature explicitly dropped first); `awaiting_review` enforcement; typed reference = evidence for review, never instant payment (**not yet pushed**) |
| `registrationApplicationsService` | `bankReference` param + row type |
| `TeamRegistrationPage` / `PublicApplicationsPanel` | Bank ref passed; demo branch honest (`feeStatus: 'unpaid'`, receipt shown when provided); approval sets real `ownerId`; all `?? 3500` fee fallbacks removed |

**Batch C — portals honesty**
| Surface | Resolution |
|---------|-----------|
| `TeamPortalPage` | Real identity (owner/membership), real registration/roster badges, real fee statement, notices from `communications`, honest empty states |
| `CoachPortalPage` | Was **crashing** (`coaches[0]` undefined in production) + fabricated next-match; rewritten: name-matched registry link, real fixtures from `matches`, honest "no coach profile linked" state |
| `PlayerPortalPage` | Was fabricated athlete (`Ali Fasir` fallback) + fake correction submit; rewritten: real roster link across `myTeams`, real suspension state from `disciplinaryCases`, honest correction guidance (no fake submit) |
| `RefereePortalPage` | Was `referees[0]` (crash in production) + showed all workspace assignments; rewritten: name-matched official, assignments filtered by `officialName`, honest empty state |
| `DisciplineManager` | Manual-sanctioning copy; real entity ids; tournament-scoped picker (open-defect #4) |
| `StandingsPage` | Dashboard route scoped to `permittedTournaments`; public route shows all (open-defect #5) |
| `Navbar` | Coach role-switch bug fixed (option values encode `role|route`; Coach shares organizer role by design, navigates to `/coach`) |

**Batch D — cleanup & hygiene**
| Item | Resolution |
|------|-----------|
| `SuperAdminPage` | Deleted (unrouted, fabricated; `/admin` is served by `AdminLayout`) + import removed from App.tsx |
| `SettingsManager` | Dead `useTranslation` import removed |
| `tailwind-merge` | Uninstalled (zero usage) |
| `ErrorBoundary` | New top-level component; render crash → recoverable screen instead of blank page |
| Skip-link | "Skip to main content" anchor in `PublicLayout` + `#main-content` id |
| Navbar a11y | `aria-label`s on search/explore/user-menu/mobile-menu icon-only buttons |
| `vite.config.ts` | `manualChunks`: react + supabase vendor chunks (build: react 52 kB, supabase 227 kB split from main) |
| PageMeta batch | Added to 11 content pages (coaches/referees/orgs directories + details, gallery, history, documents, venue detail, team registration) |
| Follows scoping | Per-account localStorage keys (open-defect #7) |
| `ReportsExports` | "Live on PSM Sports" claim removed; "FAM/VAM Certified" claim dropped; "Graphic Generator" renamed to honest "Share Summary"; `Team TBA` placeholders |
| `SyncCenter` | Verified already honest (real connectivity + events, explicit "no offline queue") |

**Batch E — tests & gates**
- New `publicContentService.test.ts` (12 tests): visibility gate, team/player sanitization (no ID cards/DOB/suspension reasons/fee receipts/bank refs), category reduction, news/document/gallery/award scoping, registration-form publication rules, serialized-payload leak assertions.
- Gates: **tsc 0 · vitest 267/267 (18 files) · harness 63/63 · build OK**.
- Guest browser sweep (isolated context): tournament page all tabs honest (entry fee "Not set", awards pending notice, rules default fallback, bracket not-drawn, empty standings), `/venues` + `/coaches` honest empty states, `/live` honest sync status, unknown slug → "Tournament Not Found", zero console errors.

### Carried over

| Issue | Impact |
|-------|--------|
| Seed data fabricated (~114 records) | Demo/local mode only; guests see it on live site (ties into open #1) |
| i18n gaps | ~50% Dhivehi coverage; page bodies hardcoded English; DB translations not consumed at runtime |

### In progress (parallel session, as of 18 Oct 2026 01:32)

Registration workflow, portals rebuild (TeamPortalPage/TeamRegistrationPage), engine pages, quick-create, public pages (HomePage/TournamentsListPage), i18n — actively edited; all gates green at last full run.

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

## 16. SPECIFICATION COMPLIANCE MAP (150-POINT SPEC)

> Verified 18 Oct 2026 against the tree, gates (tsc 0 errors, 217/217 tests, 54/54 SQL steps, production build passing) and the live Supabase project + logged-out browser. Status legend: ✅ implemented & wired · 🟡 partial · ⛔ not built. Spec section numbers in parentheses). **Production-push round highlights:** all 15 migrations pushed & in sync · public guest read path live-verified end-to-end (content table + RLS + status alignment + publish hook + guest hydration; push-only E2E migration asserted anon-read/owner-write/non-owner-blocked on the live DB) · storage shipped with 6 UI surfaces · venues persisted + leak fixed · service worker shipped · seed flash eliminated · polls/voting removed from product scope.

| Spec area | Status | Evidence / remainder |
|-----------|--------|----------------------|
| §1–2 Product goal & design philosophy | ✅ | Full lifecycle exists: quick create → setup wizard → registration → draw → fixtures → live scoring → results cascade → standings → qualification → knockout → awards → completion → public history. Next-action/health guidance on Overview + per-tournament dashboard |
| §3 Technology | ✅* | Vite+React+TS+Tailwind+Supabase (existing stack kept per §145; **not** Next.js — rewrite would destroy working functionality). PWA manifest + service worker (`sw.js`, `offline.html`, PROD-only registration) shipped & verified in production build |
| §4 User→org→tournament architecture | ✅ | `public.users`, `organizations`, memberships, `tournament_members`, ownership stamped server-side; RLS on ~103 tables |
| §5 Organizer dashboard | ✅ | `OverviewDashboard`: tournaments by state, today's matches, pending registrations, alerts, quick actions, org switcher |
| §6 Lifecycle state machine | ✅ | Statuses gate actions/public visibility; engine locks completed stages; closure makes competition data read-only |
| §7 Minimum creation | ✅ | `QuickCreateTournamentPage` (name/sport/date/island → `preparing` → workspace) |
| §8–9 Tournament workspace & overview | ✅ | 22-section dashboard with grouped nav, readiness %, next-action banner, health checklist |
| §10 Tournament details | ✅ | `TournamentDetailsSection` (branding, geography, dates, contact, visibility) |
| §11 Multi-category | 🟡 | Engine categories first-class (own standings/fixtures); shared-assets UX partial |
| §12 Sport configuration engine | ✅ | `rulesEngine`/`bestOfEngine` (periods, sets, points, tiebreakers, sport event types incl. volleyball/basketball) |
| §13–15 Stages/rounds/groups | ✅ | Tournament→Category→Stage→Round→Match model (28 tables); up to 32 groups; group locking |
| §16 Draw ceremony | ✅ | `drawEngine` random/manual/seeded/pot-based + audit trail; live ceremony UI in `EngineDrawPage` |
| §17–20 Registration forms/fields/conditional/privacy | 🟡 | Builder + field types + visibility flags live; conditional logic + sensitive-field warnings partial |
| §21 Registration links | ✅ | Link + copy/WhatsApp + QR (`qrEncoder`, 40+ tests), open/close/disable |
| §22–24 Application workflow & global teams | 🟡 | Full status workflow + review UI live (`PublicApplicationsPanel`, `TournamentPaymentsPage`); global reusable team registry partial (import-by-reference exists via seed import) |
| §25 Team manager portal | 🟡 | `TeamPortalPage` rebuilt this round (roster/registration/payment views); messaging & documents pending storage |
| §26–29 Players (registration, global registry, validation, status) | 🟡 | CRUD + eligibility engine + duplicate/jersey/age validation + CSV import; global cross-tournament player identity pending |
| §30–32 Staff / Officials / Venues | ✅ | Staff page; officials rostering UI (added 18 Oct); venues manager (persistence defect §14 #2) |
| §33 Registration closing/locking | 🟡 | Registration status machine + pause/close; squad-lock exceptions partial |
| §34–38 Fixtures (generate, conflicts, edit, rounds, publish) | ✅ | `conflictEngine` wired into setup preflight + `EngineConflictsPage` (double-booking, rest, officials); publish → public RLS |
| §39–44 Match entity/status/match-day/lineups/eligibility | ✅ | Engine match tables, `MatchOperationsList`, lineup gates with eligibility checks |
| §45–47 Live Match Center & sport events | ✅ | `LiveScoringConsole` sport-aware events (futsal/basketball/volleyball), period/clock controls |
| §48–50 Result entry/confirmation cascade/correction | ✅ | `confirmResult` runs standings→stats→cards→suspensions→qualification→bracket→audit; corrections recalculate with history |
| §51–53 Standings/points/tiebreakers | ✅ | Dynamic metric definitions; configurable points; deterministic tested tiebreakers (incl. head-to-head) |
| §54 Point adjustments | ⛔ | Not built (open defect §14 #12) |
| §55–56 Qualification + preview | ✅ | `qualificationEngine` top-N/best-third/custom; preview before confirm |
| §57–61 Knockout/brackets/byes/third-place/multi-leg | ✅ | `knockoutEngine`+`doubleEliminationEngine`+`bestOfEngine`; dynamic placeholders; `__BYE__` nodes; third-place match |
| §62–64 Player/team statistics & rankings | 🟡 | Derived from events via engine; dynamic ranking *definitions* UI partial |
| §65–68 Discipline (cards/suspensions/cases) | ✅ | `disciplineEngine` (yellow threshold, red minimums, carry rules) + cases + appeals pages |
| §69 Match sheets | 🟡 | Print-ready sheet template (browser print→PDF); true PDF generation pending |
| §70–72 Reports/exports | 🟡 | CSV (standings all groups, players) + print; custom report builder pending |
| §73–75 Spreadsheet import | ✅ | CSV upload → map → validate → preview → duplicate resolution → import (players; engine plans) |
| §76–80 Media CMS (news/photos/videos/feed) | ✅ | News + documents + gallery registries live; **storage shipped 18 Oct** (buckets + RLS + client service + 6 UI surfaces + DB push — all complete); unified feed partial |
| §81 Polls | 🚫 | **Removed from product scope** (user decision, 18 Oct 2026) — no poll/voting code exists in `src/` or `supabase/` |
| §82–83 Messaging & notifications | 🟡 | In-app communications (honest counts) + notification queue/edge dispatch (admin); team-manager channels pending |
| §84 Following | 🟡 | `followService` + FollowButton; account-scoping pending (§14 #7) |
| §85–89 Public discovery/pages | 🟡 | Full page set (explore/search/tournament/match/team/player); **guest data path is the #1 remaining gap** (§14 #1) |
| §90 Organizer public profile | ✅ | `OrganizationsListPage`/`OrganizationDetailPage` with active/upcoming/completed tournaments |
| §91 Sharing | ✅ | Copy link + WhatsApp + QR share |
| §92–94 Moderators/roles/permissions | ✅ | Tournament members with granular roles; permission checks in context + RLS (not UI-only) |
| §95 Audit log | ✅ | `auditEngine` + `AdminAuditPage`; key mutations audited |
| §96–98 Sponsors & tiers/placements | 🟡 | Sponsor CRUD + tiers live; placement targeting partial |
| §99 Social graphics | 🟡 | Real share text/link + certificate cards; full branded graphic generator pending |
| §100–101 Documents & regulation versioning | 🟡 | Document registry + version field; publish-new-version notify flow pending |
| §102 Medal table | ⛔ | Not built |
| §103–104 Awards & certificates | ✅ | `deriveAwards`/`computeChampion` + print-ready certificates with verification QR (added 18 Oct) |
| §105–110 Finance MVR | ✅/🟡 | Ledger with pending-verification + Verify/Reject (fixed 18 Oct), fee config + payment-proof review, sponsor/donation categories; dedicated donation UX partial |
| §111 Telegram | ⛔ | Optional; needs secrets |
| §112 QR player verification | 🟡 | QR encoder verified (roster/certificate QR); player-eligibility QR page pending |
| §113 Offline match center | ⛔ | Not implemented (SyncCenter states this honestly) |
| §114 Realtime public updates | 🟡 | `useRealtimeMatches` hook exists; not yet wired into public pages |
| §115 PWA | ✅ | Manifest + standalone + icons + service worker (`sw.js`, `offline.html`, PROD-only registration) shipped 18 Oct; verified present in production `dist/` |
| §116 Mobile UX | 🟡 | Mobile-first Tailwind throughout, sticky headers/large buttons in live scoring; dedicated bottom-nav pass pending |
| §117–119 Readiness/dependency warnings/locking | ✅ | Readiness %, engine conflict preflight, stage locks, closure read-only + audited override |
| §120–121 Completion & closed preservation | ✅ | `canCompleteTournament` gates closure; ClosureArchive now verifies real conditions and writes permanent public history (rewritten 18 Oct) |
| §122 Tournament cloning | 🟡 | Engine plan re-apply enables re-run; full "copy settings/teams/forms" wizard pending |
| §123–125 API/embeds/subscriptions | ⛔ | Future (admin console has billing/plans groundwork) |
| §126–128 Security/privacy | 🟡/✅ | RLS everywhere + notices policies migration + **storage fail-closed RLS (validated)**; guardian/consent + deletion/export flows partial |
| §129–132 DB architecture & domain actions | ✅ | Normalized engine schema + centralized domain operations (spec's action list maps to engine/context mutators) |
| §133–138 UI/UX rules | ✅/🟡 | Component system, status chips, confirmation dialogs, skeletons/empty/error states throughout; full WCAG pass pending |
| §139–141 Testing | ✅/🟡 | 207 unit tests (engine algorithms, qualification, tiebreakers, cards, suspensions, brackets, QR, auth) + 42 SQL RLS steps; E2E pending |

### Top remaining work (dependency-ordered)

1. **Public DB read path** (§14 #1) — public pages read real published data end-to-end.
2. **Supabase Storage** — ✅ core built 18 Oct (6 buckets, fail-closed RLS validated in PGlite, `storageService` client + tests); remaining: `supabase db push` + wiring uploads into pages (team logos, documents, payment proofs, media).
3. **Deploy pending migrations** (`supabase db push`) — notices admin pages + registration applications go live.
4. Venues slice persistence (§14 #2); account-scoped follows; dashboard standings scoping.
5. Service worker (vite-plugin-pwa) + realtime wiring into public match pages.
6. Point adjustments, medal table, custom report builder, PDF generation.
7. API keys/public API, embeds, subscriptions (post-product-scale work).

---

*Last updated: 18 October 2026 — after the production-push round. Gates at write time: `tsc` 0 errors · 217/217 unit tests (15 files) · 54/54 PGlite SQL steps · production build passing · all 15 migrations pushed & in sync · guest public read path live-verified end-to-end (DB E2E migration + logged-out browser sweep of 16 public routes, zero console errors). §16 is the spec compliance map; §13 is the phase plan; §14 carries the current defect list. This round additionally: shipped the public content pipeline (`public_tournament_content` + RLS + status alignment + sanitized publish hook + guest hydration in AppContext), eliminated the seed-data flash (workspace slices start empty in Supabase mode), finished storage UI wiring + venues persistence, shipped the service worker, and removed polls/voting from product scope (no poll/voting code exists in `src/` or `supabase/`). Remaining honest gaps: guest file-upload edge function, role-portal depth, no git repo (all work uncommitted).*"
*KULHIVARU+ — Republic of Maldives Sporting Ecosystem*

---

## 17. LAUNCH UPGRADE STATUS — 2026-10-18

### Completed in the current Team/Player upgrade batch

- [x] Organizer dashboard launcher for Teams, Tournaments, Players and Organizations.
- [x] Permanent Team workspace dark visual system aligned with the main authenticated app shell.
- [x] Team workspace overview, squad, applications, rosters, matches, lineups, payments and statistics remain routed and real-data backed.
- [x] Team application flow opens the real tournament registration form with `?teamId=` and preserves the permanent Team identity.
- [x] Authenticated `/dashboard/players` registry with search, eligibility filtering and Digital Card access.
- [x] Authenticated `/dashboard/players/:playerId/*` Player Workspace with profile, team, tournament, statistics, awards, card and ID sections.
- [x] Public-safe `/verify/player/:token` Digital Player ID verification page.
- [x] Public Player Profile no longer silently falls back to another player and exposes Digital Card preview.
- [x] Public Medal Table at `/medals`.
- [x] Read-only public API edge function deployed at `public-api`.
- [x] Guest upload edge function deployed and migration set synchronized with production.

### Verification

- `tsc --noEmit`: passing
- `npm test`: 277/277 passing
- `npm run typecheck:functions`: passing
- `npm run build`: passing
- `npm run test:sql`: passing

### Still requiring dedicated implementation passes

- Player claim and identity-review workflow with secure claim tokens.
- Full relational Player career/history model beyond current roster projections.
- Offline match queue and conflict-resolution sync.
- Full WCAG audit and remediation across every route.
- Playwright/browser E2E suite and mobile-device matrix.
- Embed widget UI, API keys/developer portal, and production observability setup.

> This status is intentionally explicit: the master plan is not marked fully complete until the remaining dedicated implementation passes and launch QA gates are finished.
