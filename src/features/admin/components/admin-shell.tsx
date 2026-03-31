"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  ExternalLink,
  Flag,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Palette,
  ScrollText,
  Settings,
  Shield,
  Swords,
  ToggleLeft,
  Trophy,
  Users,
  Wallet,
  Wrench,
  LifeBuoy,
} from "lucide-react";
import {
  ADMIN_THEME_IDS,
  ADMIN_THEME_STORAGE_KEY,
  ADMIN_THEMES,
  type AdminThemeId,
  isAdminThemeId,
} from "../lib/admin-themes";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, only exact path match is active (e.g. dashboard). */
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: readonly NavItem[];
};

const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
      { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
      { href: "/admin/matches", label: "Matches", icon: Swords },
      { href: "/admin/finance", label: "Finance", icon: Wallet },
      { href: "/admin/reports", label: "Reports & Moderation", icon: Flag },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: LineChart },
      { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
    ],
  },
  {
    title: "Platform experience",
    items: [
      { href: "/admin/settings", label: "Settings & Theme", icon: Settings },
      { href: "/admin/feature-flags", label: "Feature flags", icon: ToggleLeft },
      { href: "/admin/navigation", label: "Navigation manager", icon: Menu },
      { href: "/admin/content/homepage", label: "Homepage content", icon: Home },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/system", label: "System tools", icon: Wrench },
      { href: "/admin/support", label: "Support / Admin notes", icon: LifeBuoy },
    ],
  },
] as const;

function navItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({
  children,
  userEmail,
  displayName,
}: {
  children: ReactNode;
  userEmail: string | null;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<AdminThemeId>("obsidian");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (stored && isAdminThemeId(stored)) setTheme(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const t = ADMIN_THEMES[theme];

  return (
    <div className={`flex min-h-screen ${t.shell}`}>
      <aside className={`flex w-64 shrink-0 flex-col border-r ${t.sidebar}`}>
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${t.badge}`}
          >
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">
              Kulhivaru+
            </p>
            <p
              className={`text-[10px] font-medium uppercase tracking-wider ${t.accentMuted}`}
            >
              Super admin
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0 overflow-y-auto p-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-1">
              <p
                className={`px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500`}
              >
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = navItemActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active ? t.navActive : t.navInactive,
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/5 p-3">
          <div className="flex items-center gap-2 px-1">
            <Palette className={`h-3.5 w-3.5 shrink-0 ${t.accentText}`} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Shell theme
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ADMIN_THEME_IDS.map((id) => {
              const preset = ADMIN_THEMES[id];
              const on = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={[
                    "rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition-colors",
                    on
                      ? `${preset.navActive} ring-1 ring-inset`
                      : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 pt-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Public site
            </Link>
            <Link
              href="/organizer"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Organizer
            </Link>
            <Link
              href="/auth/logout"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-red-300/90 hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </Link>
          </div>

          <div
            className={`rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-[10px] text-zinc-500`}
          >
            <p className="truncate font-medium text-zinc-300">
              {displayName || userEmail || "Signed in"}
            </p>
            {displayName && userEmail ? (
              <p className="truncate opacity-80">{userEmail}</p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex items-center justify-between border-b px-6 py-3 ${t.headerBar}`}
        >
          <p className={`text-xs font-medium ${t.accentMuted}`}>
            Full platform access · RPC-backed actions · audit trail
          </p>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.badge}`}
          >
            Super admin
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
