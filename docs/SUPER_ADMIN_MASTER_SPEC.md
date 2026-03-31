# KULHIVARU+ Super Admin — Master Specification

This document is the platform-owner **Super Admin** product spec (mission control: governance, operations, experience, platform tools).

**Implementation status:** Phase 1 routes and access live under `/superadmin`. See codebase:

- `app/(superadmin)/superadmin/*`
- `src/features/superadmin/*`
- Migration: `supabase/migrations/*_super_admin_role_and_platform_settings.sql`

**Role:** `super_admin` (distinct from `admin`, which uses `/admin`).

---

## Full specification (reference)

The complete page tree, KPIs, RPC names, database tables, UI components, build phases, and security rules are maintained in the project brief. Summary:

1. **Access:** `/superadmin/*`, `isSuperAdmin()` server-side, future RPC `is_super_admin(auth.uid())`.
2. **Governance:** Organizations, tournaments, users, teams, players, audit.
3. **Operations:** Registrations, matches, finance, reports, notifications, support notes.
4. **Experience:** Appearance, layout, branding, navigation, homepage content, feature flags.
5. **Platform:** Settings, system tools, exports.
6. **Security:** Privileged writes via RPC, reasons + confirmations for destructive actions, immutable audit trail.
7. **Config tables:** `platform_settings`, `admin_notes`, `reports`, `entity_flags`, `entity_locks`, theme/nav/content tables (staged in migrations as needed).

For the **full narrative spec** (all sections 1–43), keep the canonical copy in your product wiki or paste from the stakeholder document; this repo file tracks **delivery mapping** only.

---

## Build priority (from spec)

| Phase | Scope |
|-------|--------|
| **1** | Layout, overview, organizations, tournaments, users, audit-logs |
| **2** | Registrations, matches, finance, reports |
| **3** | Appearance, layout, branding, navigation, homepage, feature-flags, settings, system |

---

## SQL: grant `super_admin`

Run after migration `20260320200000_super_admin_role_and_platform_settings.sql`.

```sql
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower('you@example.com') LIMIT 1;
  IF uid IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role','super_admin')
  WHERE id = uid;

  UPDATE public.profiles SET role = 'super_admin', updated_at = now() WHERE id = uid;
END $$;
```

Sign out and sign in. Open **`/superadmin`**.

**Note:** `admin` → `/admin` (operator). `super_admin` → `/superadmin` (mission control).
