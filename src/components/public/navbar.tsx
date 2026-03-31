"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { SessionUser } from "@/src/lib/auth/types";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/matches", label: "Matches" },
  { href: "/watch", label: "Watch" },
  { href: "/stats", label: "Stats" },
];

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-slate-50"
          aria-label="Kulhivaru+ home"
        >
          <span className="relative h-7 w-[92px] overflow-hidden rounded-md border border-white/10 bg-slate-900/60">
            <Image
              src="/kulhivaru-logo.png"
              alt=""
              fill
              sizes="92px"
              className="object-contain object-center p-0.5"
            />
          </span>
          <span className="text-lg">Kulhivaru+</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-slate-800 text-slate-50"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: search + auth */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Search trigger (opens search bar or navigates to explore with search) */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-200 md:min-w-[200px]"
            aria-label="Search"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden md:inline">Search tournaments, teams…</span>
          </button>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white ring-2 ring-slate-700 hover:bg-emerald-500"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {(user.email ?? user.id).slice(0, 1).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-800 bg-slate-900 py-1 shadow-xl">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/organizer"
                    className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Organizer Dashboard
                  </Link>
                  <hr className="my-1 border-slate-800" />
                  <Link
                    href="/auth/logout"
                    className="block px-3 py-2 text-sm text-slate-400 hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Logout
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                Sign up
              </Link>
              <Link
                href="/organizer/tournaments/new"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Create Tournament
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Global search bar (expandable) */}
      {searchOpen && (
        <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2">
              <input
                type="search"
                placeholder="Search tournaments, teams, players…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <Link
                href={`/explore?q=${encodeURIComponent(searchQuery)}`}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                onClick={() => setSearchOpen(false)}
              >
                Search
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500">Quick:</span>
              <Link href="/explore" className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">
                Tournaments
              </Link>
              <Link href="/explore?type=teams" className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">
                Teams
              </Link>
              <Link href="/explore?type=players" className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">
                Players
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
