"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

type ProfileFormProps = { userId: string };

export function ProfileForm({ userId }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      if (profile?.display_name != null) {
        setDisplayName(profile.display_name);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.display_name != null) {
          setDisplayName(String(user.user_metadata.display_name));
        }
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const name = displayName.trim() || null;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (profileError) {
      setSaving(false);
      setMessage({ type: "error", text: profileError.message });
      return;
    }
    await supabase.auth.updateUser({
      data: { display_name: name ?? undefined },
    });
    setSaving(false);
    setMessage({ type: "success", text: "Profile updated." });
    router.refresh();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="h-10 animate-pulse rounded bg-slate-800" />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-800 bg-slate-950 p-6"
    >
      <h2 className="text-sm font-semibold text-slate-200">Display name</h2>
      <p className="mt-1 text-sm text-slate-400">
        This name can be shown on the site (e.g. comments or leaderboards).
      </p>
      {message && (
        <div
          className={
            message.type === "error"
              ? "mt-3 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200"
              : "mt-3 rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200"
          }
        >
          {message.text}
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
