/** Visual presets for the platform admin area (stored in localStorage). */
export const ADMIN_THEME_STORAGE_KEY = "gameon-admin-theme";

export type AdminThemeId = "obsidian" | "aurora" | "ember" | "forest";

export const ADMIN_THEMES: Record<
  AdminThemeId,
  {
    label: string;
    description: string;
    /** Outer shell gradient + base */
    shell: string;
    sidebar: string;
    headerBar: string;
    accentText: string;
    accentMuted: string;
    navInactive: string;
    navActive: string;
    card: string;
    tableHeader: string;
    rowBorder: string;
    badge: string;
  }
> = {
  obsidian: {
    label: "Obsidian",
    description: "Violet command center",
    shell: "bg-zinc-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.18),transparent),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(59,130,246,0.08),transparent)]",
    sidebar: "border-violet-500/20 bg-zinc-950/80 backdrop-blur-xl",
    headerBar: "border-violet-500/15 bg-zinc-900/50",
    accentText: "text-violet-300",
    accentMuted: "text-violet-400/80",
    navInactive: "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
    navActive: "bg-violet-500/15 text-violet-100 border border-violet-500/35 shadow-[0_0_20px_rgba(139,92,246,0.12)]",
    card: "rounded-2xl border border-violet-500/15 bg-zinc-900/50 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
    tableHeader: "border-b border-violet-500/15 bg-zinc-900/70 text-zinc-400",
    rowBorder: "border-b border-zinc-800/80",
    badge: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  },
  aurora: {
    label: "Aurora",
    description: "Cyan / Arctic",
    shell: "bg-slate-950 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(34,211,238,0.16),transparent),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(99,102,241,0.12),transparent)]",
    sidebar: "border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl",
    headerBar: "border-cyan-500/15 bg-slate-900/50",
    accentText: "text-cyan-300",
    accentMuted: "text-cyan-400/80",
    navInactive: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
    navActive: "bg-cyan-500/15 text-cyan-50 border border-cyan-500/35 shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    card: "rounded-2xl border border-cyan-500/15 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
    tableHeader: "border-b border-cyan-500/15 bg-slate-900/70 text-slate-400",
    rowBorder: "border-b border-slate-800/80",
    badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  },
  ember: {
    label: "Ember",
    description: "Warm ops console",
    shell: "bg-neutral-950 bg-[radial-gradient(ellipse_110%_70%_at_50%_-10%,rgba(251,146,60,0.14),transparent),radial-gradient(ellipse_70%_50%_at_100%_80%,rgba(248,113,113,0.08),transparent)]",
    sidebar: "border-orange-500/20 bg-neutral-950/85 backdrop-blur-xl",
    headerBar: "border-orange-500/15 bg-neutral-900/50",
    accentText: "text-orange-300",
    accentMuted: "text-orange-400/80",
    navInactive: "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100",
    navActive: "bg-orange-500/15 text-orange-50 border border-orange-500/35 shadow-[0_0_20px_rgba(251,146,60,0.1)]",
    card: "rounded-2xl border border-orange-500/15 bg-neutral-900/50 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
    tableHeader: "border-b border-orange-500/15 bg-neutral-900/70 text-neutral-400",
    rowBorder: "border-b border-neutral-800/80",
    badge: "border-orange-400/30 bg-orange-500/10 text-orange-100",
  },
  forest: {
    label: "Forest",
    description: "Aligns with public Kulhivaru+ theme",
    shell: "bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.2),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.12),transparent_55%)]",
    sidebar: "border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl",
    headerBar: "border-emerald-500/15 bg-slate-900/50",
    accentText: "text-emerald-300",
    accentMuted: "text-emerald-400/80",
    navInactive: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
    navActive: "bg-emerald-500/15 text-emerald-50 border border-emerald-500/35 shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    card: "rounded-2xl border border-emerald-500/15 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
    tableHeader: "border-b border-emerald-500/15 bg-slate-900/70 text-slate-400",
    rowBorder: "border-b border-slate-800/80",
    badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  },
};

export const ADMIN_THEME_IDS = Object.keys(ADMIN_THEMES) as AdminThemeId[];

export function isAdminThemeId(v: string): v is AdminThemeId {
  return v in ADMIN_THEMES;
}
