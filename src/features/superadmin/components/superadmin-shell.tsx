"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowRightLeft,
  Building2,
  ClipboardList,
  CreditCard,
  Flag,
  Home,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  LineChart,
  ListTree,
  LogOut,
  Megaphone,
  Radar,
  ScrollText,
  Settings,
  Shield,
  Swords,
  UserCircle2,
  Users,
  Wrench,
  Download,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  placeholder?: boolean;
  /** Only for exact path match (e.g. overview) */
  exact?: boolean;
};
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Governance",
    items: [
      { href: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/superadmin/organizations", label: "Organizations", icon: Building2 },
      { href: "/superadmin/tournaments", label: "Tournaments", icon: Swords },
      { href: "/superadmin/users", label: "Users", icon: Users },
      { href: "/superadmin/teams", label: "Teams", icon: Users },
      { href: "/superadmin/players", label: "Players", icon: UserCircle2 },
      { href: "/superadmin/audit-logs", label: "Audit logs", icon: ScrollText },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/superadmin/registrations", label: "Registrations", icon: ClipboardList, placeholder: true },
      { href: "/superadmin/matches", label: "Matches", icon: Activity, placeholder: true },
      { href: "/superadmin/finance", label: "Finance", icon: CreditCard, placeholder: true },
      { href: "/superadmin/reports", label: "Reports & moderation", icon: Flag, placeholder: true },
      { href: "/superadmin/notifications", label: "Notifications", icon: Megaphone, placeholder: true },
      { href: "/superadmin/support", label: "Support notes", icon: LifeBuoy, placeholder: true },
    ],
  },
  {
    title: "Experience",
    items: [
      { href: "/superadmin/appearance", label: "Appearance", icon: ImageIcon, placeholder: true },
      { href: "/superadmin/layout", label: "Layout", icon: LayoutTemplate, placeholder: true },
      { href: "/superadmin/branding", label: "Branding", icon: Home, placeholder: true },
      { href: "/superadmin/navigation", label: "Navigation", icon: ListTree, placeholder: true },
      { href: "/superadmin/content/homepage", label: "Homepage content", icon: Home, placeholder: true },
      { href: "/superadmin/feature-flags", label: "Feature flags", icon: Flag, placeholder: true },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/superadmin/settings", label: "Platform settings", icon: Settings, placeholder: true },
      { href: "/superadmin/system", label: "System tools", icon: Wrench, placeholder: true },
      { href: "/superadmin/exports", label: "Data exports", icon: Download, placeholder: true },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SuperAdminShell({
  children,
  userEmail,
  displayName,
}: {
  children: ReactNode;
  userEmail: string | null;
  displayName: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#07080c] text-zinc-100">
      <aside className="flex w-[270px] shrink-0 flex-col border-r border-amber-500/10 bg-[#0a0b10]">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
            <Radar className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-amber-200/90">
              Super Admin
            </p>
            <p className="truncate text-[11px] text-zinc-500">Kulhivaru+ · mission control</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={[
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/25"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                          item.placeholder && !active ? "opacity-80" : "",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.placeholder ? (
                          <span className="rounded bg-zinc-800 px-1 py-px text-[8px] font-bold uppercase text-zinc-500">
                            Soon
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/5 p-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Operator admin (/admin)
          </Link>
          <Link
            href="/organizer"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            <LineChart className="h-3.5 w-3.5" aria-hidden />
            Organizer
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
            Public site
          </Link>
          <Link
            href="/auth/logout"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-red-400/90 hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Sign out
          </Link>
          <div className="rounded-lg border border-white/5 bg-black/30 px-2 py-2 text-[10px] text-zinc-600">
            <p className="truncate font-medium text-zinc-400">
              {displayName || userEmail || "Signed in"}
            </p>
            {displayName && userEmail ? (
              <p className="truncate text-zinc-600">{userEmail}</p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-black/20 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200/90 sm:inline">
              Production
            </span>
            <p className="truncate text-xs text-zinc-500">
              Privileged area · RPC-only writes · audit all destructive actions (spec)
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-400 sm:inline"
              disabled
            >
              Search / command (phase 2)
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.06),transparent)] px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
